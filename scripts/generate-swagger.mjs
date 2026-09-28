// Generates public/swagger.json (OpenAPI 3.0) by scanning src/app/api/**/route.{ts,js}.
//
// For every route file it records the exported HTTP methods, path params, query
// params (searchParams.get("x")), JSON body fields (destructured from req.json()),
// and whether the handler checks auth. When a handler just delegates to an
// imported controller function, that function is scanned too.
//
// Hand-written details (summaries, examples, responses) live in OVERRIDES below.
//
// Usage: node scripts/generate-swagger.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_DIR = path.join(ROOT, "src", "app", "api");
const OUT_FILE = path.join(ROOT, "public", "swagger.json");
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
const AUTH_PATTERN =
  /authorization|requireAccess|requireLogin|authenticateRequest|authenticate\(|authorize\(|checkPermission|isAdmin|isUserManager|isManagerOrAdmin|verifyBillingUser|authorizeSchool|jwt\.verify|verifyToken/;

// Endpoints whose summary / body / responses deserve more than the heuristics give.
const OVERRIDES = {
  "POST /api/auth/login": {
    summary: "Log in and receive a JWT",
    description:
      "Returns a token. Click **Authorize** at the top of the page and paste it to call protected endpoints.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email", example: "admin@school.com" },
              password: { type: "string", format: "password", example: "********" },
            },
          },
        },
      },
    },
  },
  "POST /api/auth/register": {
    summary: "Register a new user",
    description:
      "`school`, `location`, `model`, `numberOfTeachers`, `numberOfStudents` and `schoolLogo` are required when `role` is `school-leader`.",
  },
  "GET /api/auth/me": { summary: "Get the currently authenticated user" },
  "POST /api/auth/logout": { summary: "Log out" },
};

// ---------------------------------------------------------------------------

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /^route\.(ts|js)$/.test(entry.name) ? [full] : [];
  });
}

function toApiPath(file) {
  const segments = path
    .relative(API_DIR, path.dirname(file))
    .split(path.sep)
    .filter((s) => s && !/^\(.*\)$/.test(s)) // drop route groups like (admin)
    .map((s) => s.replace(/^\[\[?(?:\.\.\.)?(\w+)\]?\]$/, "{$1}"));
  return "/api/" + segments.join("/");
}

// Returns the source text of a top-level function/const named `name`, up to the
// next top-level export. Good enough for scanning; not a parser.
function extractFunction(src, name) {
  const re = new RegExp(
    `export\\s+(?:async\\s+)?(?:function\\s+${name}\\b|const\\s+${name}\\s*=)`,
  );
  const match = re.exec(src);
  if (!match) return null;
  const rest = src.slice(match.index + match[0].length);
  const next = rest.search(/\nexport\s/);
  return match[0] + (next === -1 ? rest : rest.slice(0, next));
}

function resolveImport(fromFile, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(ROOT, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null;
  for (const ext of ["", ".ts", ".js", ".tsx", "/index.ts", "/index.js"]) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

// Map of imported identifier -> source file, for named imports only.
function namedImports(file, src) {
  const map = {};
  for (const m of src.matchAll(/import\s*(?:type\s*)?\{([^}]+)\}\s*from\s*["']([^"']+)["']/g)) {
    const target = resolveImport(file, m[2]);
    if (!target) continue;
    for (const part of m[1].split(",")) {
      const [orig, alias] = part.trim().split(/\s+as\s+/);
      if (orig) map[(alias || orig).trim()] = { file: target, name: orig.trim() };
    }
  }
  return map;
}

// Pulls in the text of any imported function the handler calls, one level deep.
function handlerText(file, src, method) {
  let text = extractFunction(src, method);
  if (!text) {
    // `export { GET } from "..."` or `export const { GET } = handlers` – fall back to the whole file
    text = src;
  }
  const imports = namedImports(file, src);
  let extra = "";
  for (const [ident, { file: target, name }] of Object.entries(imports)) {
    if (!new RegExp(`\\b${ident}\\s*\\(`).test(text)) continue;
    const targetSrc = fs.readFileSync(target, "utf8");
    const fn = extractFunction(targetSrc, name);
    if (fn && fn.length < 60000) extra += "\n" + fn;
  }
  return text + extra;
}

function bodyFields(text) {
  const fields = new Set();
  const bodyVars = new Set(["body"]);
  for (const m of text.matchAll(/(?:const|let)\s+(\w+)\s*=\s*await\s+\w+\.json\(\)/g)) bodyVars.add(m[1]);
  const sources = [String.raw`await\s+\w+\.json\(\)`, ...[...bodyVars].map((v) => `${v}\\b(?!\\.)`)];
  const re = new RegExp(String.raw`(?:const|let)\s*\{([^}]*)\}\s*=\s*(?:${sources.join("|")})`, "g");
  for (const m of text.matchAll(re)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().replace(/^\.\.\./, "").split(/[:=]/)[0].trim();
      if (/^\w+$/.test(name)) fields.add(name);
    }
  }
  for (const v of bodyVars) {
    for (const m of text.matchAll(new RegExp(`\\b${v}\\.(\\w+)`, "g"))) fields.add(m[1]);
  }
  return [...fields];
}

function queryParams(text) {
  return [...new Set([...text.matchAll(/searchParams\.get\(\s*["'`](\w+)["'`]\s*\)/g)].map((m) => m[1]))];
}

function usesFormData(text) {
  return /\.formData\(\)/.test(text);
}

function guessType(field) {
  if (/^(is|has|can|should)[A-Z]|^(active|enabled|published|featured)$/.test(field)) return { type: "boolean" };
  if (/^(number|count|amount|total|score|page|limit|price|year|age|quantity)/i.test(field) || /(Count|Amount|Score|Total)$/.test(field))
    return { type: "number" };
  if (/(Ids|s)$/.test(field) && /Ids$|children|items|subjects|students|classes|permissions|answers|questions|images|tags/i.test(field))
    return { type: "array", items: {} };
  if (/email/i.test(field)) return { type: "string", format: "email" };
  if (/password/i.test(field)) return { type: "string", format: "password" };
  if (/date|At$/i.test(field)) return { type: "string", format: "date-time" };
  return { type: "string" };
}

function titleCase(slug) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function leadingComment(src, method) {
  const idx = src.search(new RegExp(`export\\s+(?:async\\s+)?(?:function\\s+${method}\\b|const\\s+${method}\\s*=)`));
  if (idx === -1) return null;
  const before = src.slice(0, idx).trimEnd().split("\n");
  const lines = [];
  for (let i = before.length - 1; i >= 0; i--) {
    const line = before[i].trim();
    if (!line.startsWith("//") && !line.startsWith("*") && !line.startsWith("/*")) break;
    lines.unshift(line.replace(/^(\/\/+|\/\*+|\*+\/?)\s?/, "").trim());
  }
  const text = lines.filter(Boolean).filter((l) => !/^(GET|POST|PUT|PATCH|DELETE)\s+\/api/i.test(l)).join(" ");
  return text || null;
}

// ---------------------------------------------------------------------------

const paths = {};
const tags = new Set();

for (const file of walk(API_DIR).sort()) {
  const src = fs.readFileSync(file, "utf8");
  const apiPath = toApiPath(file);
  const exported = METHODS.filter((m) =>
    new RegExp(`export\\s+(?:async\\s+)?(?:function\\s+${m}\\b|const\\s+${m}\\b)|export\\s*\\{[^}]*\\b${m}\\b[^}]*\\}`).test(src),
  );
  if (!exported.length) continue;

  const tag = titleCase(apiPath.split("/")[2] || "root");
  tags.add(tag);
  const pathParams = [...apiPath.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  paths[apiPath] = {};

  for (const method of exported) {
    if (method === "OPTIONS" || method === "HEAD") continue;
    const text = handlerText(file, src, method);
    const key = `${method} ${apiPath}`;
    const override = OVERRIDES[key] || {};

    const parameters = [
      ...pathParams.map((name) => ({ name, in: "path", required: true, schema: { type: "string" } })),
      ...queryParams(text).map((name) => ({ name, in: "query", required: false, schema: guessType(name) })),
    ];

    const op = {
      tags: [tag],
      summary: override.summary || leadingComment(src, method) || `${method} ${apiPath}`,
      operationId: `${method.toLowerCase()}${apiPath.replace(/[{}]/g, "").replace(/\/(\w)/g, (_, c) => c.toUpperCase()).replace(/[^\w]/g, "")}`,
      ...(override.description && { description: override.description }),
      ...(parameters.length && { parameters }),
      responses: override.responses || {
        200: { description: "Success", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
        400: { description: "Invalid request" },
        ...(AUTH_PATTERN.test(text) && { 401: { description: "Missing or invalid token" }, 403: { description: "Not allowed for this role" } }),
        500: { description: "Server error" },
      },
    };

    if (!AUTH_PATTERN.test(text)) op.security = [];

    if (override.requestBody) {
      op.requestBody = override.requestBody;
    } else if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      if (usesFormData(text)) {
        op.requestBody = {
          content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } },
        };
      } else {
        const fields = bodyFields(text);
        if (fields.length) {
          op.requestBody = {
            content: {
              "application/json": {
                schema: { type: "object", properties: Object.fromEntries(fields.map((f) => [f, guessType(f)])) },
              },
            },
          };
        }
      }
    }

    paths[apiPath][method.toLowerCase()] = op;
  }
}

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Kiddies Check API",
    version: pkg.version,
    description:
      "REST API for Kiddies Check.\n\n1. Call `POST /api/auth/login` to get a token.\n2. Click **Authorize** and paste the token.\n3. Use **Try it out** on any endpoint.\n\n_Generated from `src/app/api` by `npm run docs:generate`._",
  },
  // Same-origin only: an absolute URL for another host (e.g. kiddiescheck.org vs
  // www.kiddiescheck.org) makes the browser send a CORS preflight, which fails
  // on Vercel's apex -> www redirect.
  servers: [{ url: "/", description: "Current host" }],
  tags: [...tags].sort().map((name) => ({ name })),
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {},
        },
      },
    },
  },
  paths,
};

fs.writeFileSync(OUT_FILE, JSON.stringify(spec, null, 2) + "\n");
const opCount = Object.values(paths).reduce((n, p) => n + Object.keys(p).length, 0);
console.log(`swagger.json: ${Object.keys(paths).length} paths, ${opCount} operations -> ${path.relative(ROOT, OUT_FILE)}`);
