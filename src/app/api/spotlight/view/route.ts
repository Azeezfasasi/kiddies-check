import type { NextRequest } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@/app/server/lib/requireAccess";
import { resolveScope, inScope } from "@/app/server/lib/spotlight/scope";
import { loadCalendar, resolvePeriod, toKey, type PeriodType } from "@/app/server/lib/spotlight/period";
import { networkView, schoolView, armView } from "@/app/server/lib/spotlight/metrics";
import School from "@/app/server/models/School";
import Class from "@/app/server/models/Class";

const PERIODS: PeriodType[] = ["day", "week", "term"];
const fail = (error: string, status: number) => Response.json({ success: false, error }, { status });

/**
 * GET /api/spotlight/view
 * One Spotlight dashboard view: KPIs with comparison and chart series, the
 * rows to drill into, the team, and the info panel for the entity in view.
 *
 * Query params
 *   level   network | school | arm (default network)
 *   id      school id (level=school) or class id (level=arm)
 *   period  day | week | term (default day)
 *   date    YYYY-MM-DD anchor inside the period (default today)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if ("response" in auth) return auth.response;
    const { user } = auth;

    const scope = await resolveScope(user);
    if (!scope) return fail("Spotlight is available to school leaders, directors and administrators.", 403);

    const params = req.nextUrl.searchParams;
    const level = params.get("level") || "network";
    const id = params.get("id");
    const periodType = (PERIODS.includes(params.get("period") as PeriodType) ? params.get("period") : "day") as PeriodType;
    const dateParam = params.get("date");
    const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : toKey(new Date());

    const period = resolvePeriod(periodType, date, await loadCalendar());
    const networkCrumb = scope.network ? [{ level: "network", id: null, name: "All schools" }] : [];

    if (level === "network") {
      if (!scope.network) return fail("You only have access to one school", 403);
      const view = await networkView(user, scope, period);
      return Response.json({ success: true, data: { ...view, period, breadcrumbs: networkCrumb } });
    }

    if (!id || !Types.ObjectId.isValid(id)) return fail("A valid id is required", 400);

    if (level === "school") {
      if (!inScope(scope, id)) return fail("You do not have access to this school", 403);
      const view = await schoolView(new Types.ObjectId(id), period);
      if (!view) return fail("School not found", 404);
      return Response.json({
        success: true,
        data: { ...view, period, breadcrumbs: [...networkCrumb, { level: "school", id, name: view.entity.name }] },
      });
    }

    if (level === "arm") {
      const cls = await Class.findById(id).select("school").lean();
      if (!cls) return fail("Arm not found", 404);
      if (!inScope(scope, cls.school)) return fail("You do not have access to this school", 403);
      const view = await armView(new Types.ObjectId(id), period);
      if (!view) return fail("Arm not found", 404);
      const school = await School.findById(cls.school).select("name").lean();
      return Response.json({
        success: true,
        data: {
          ...view,
          period,
          breadcrumbs: [
            ...networkCrumb,
            { level: "school", id: String(cls.school), name: school?.name ?? "School" },
            { level: "arm", id, name: view.entity.name },
          ],
        },
      });
    }

    return fail("level must be network, school or arm", 400);
  } catch (error) {
    console.error("[Spotlight View Error]", error);
    return fail(error.message || "Failed to load Spotlight view", 500);
  }
}
