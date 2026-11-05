/**
 * Read-only audit: learning specialists linked to more than one school.
 *
 * Learning specialists belong to a single school (User.schoolId). This lists accounts
 * whose data still points at other schools, so they can be cleaned up by hand:
 *   1. managedSchools containing any school other than their own
 *   2. active school memberships in more than one school
 *   3. no school at all (they will be refused everywhere)
 *   4. no User.schoolId yet, but one active membership (fixed automatically at next login)
 *
 * It only runs find/aggregate queries and never writes to the database.
 *
 * Usage:  node scripts/check-learning-specialist-schools.mjs
 * Reads MONGODB_URI from .env.local or .env (or the environment).
 */
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set (looked in the environment, .env.local and .env).");
  process.exit(1);
}

const idStr = (id) => (id ? String(id) : null);

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db();

  const specialists = await db
    .collection("users")
    .find(
      { role: "learning-specialist" },
      { projection: { firstName: 1, lastName: 1, email: 1, isActive: 1, schoolId: 1, managedSchools: 1 } }
    )
    .toArray();

  const memberships = await db
    .collection("schoolmembers")
    .find(
      { user: { $in: specialists.map((u) => u._id) }, status: "active" },
      { projection: { user: 1, school: 1, role: 1 } }
    )
    .toArray();

  const schoolIds = new Set();
  for (const u of specialists) {
    if (u.schoolId) schoolIds.add(idStr(u.schoolId));
    for (const s of u.managedSchools ?? []) schoolIds.add(idStr(s));
  }
  for (const m of memberships) schoolIds.add(idStr(m.school));

  const schools = await db
    .collection("schools")
    .find(
      { _id: { $in: [...schoolIds].filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id)) } },
      { projection: { name: 1 } }
    )
    .toArray();
  const schoolName = new Map(schools.map((s) => [idStr(s._id), s.name]));
  const label = (id) => `${schoolName.get(idStr(id)) ?? "(school not found)"} [${idStr(id)}]`;

  const membershipsByUser = new Map();
  for (const m of memberships) {
    const key = idStr(m.user);
    if (!membershipsByUser.has(key)) membershipsByUser.set(key, []);
    membershipsByUser.get(key).push(m);
  }

  const extraManaged = [];
  const multipleMemberships = [];
  const noSchool = [];
  const fixedAtLogin = [];

  for (const u of specialists) {
    const own = idStr(u.schoolId);
    const userMemberships = membershipsByUser.get(idStr(u._id)) ?? [];
    const memberSchools = [...new Set(userMemberships.map((m) => idStr(m.school)))];

    const otherManaged = (u.managedSchools ?? []).map(idStr).filter((id) => id !== own);
    if (otherManaged.length) extraManaged.push({ u, own, otherManaged });

    if (memberSchools.length > 1) multipleMemberships.push({ u, own, memberSchools });

    if (!own && memberSchools.length === 0) noSchool.push({ u });
    else if (!own && memberSchools.length === 1) fixedAtLogin.push({ u, school: memberSchools[0] });
  }

  const who = (u) =>
    `${[u.firstName, u.lastName].filter(Boolean).join(" ") || "(no name)"} <${u.email ?? "no email"}>` +
    `${u.isActive === false ? " (inactive)" : ""} [${idStr(u._id)}]`;

  console.log(`Learning specialists found: ${specialists.length}\n`);

  console.log(`1. managedSchools includes schools other than their own: ${extraManaged.length}`);
  for (const { u, own, otherManaged } of extraManaged) {
    console.log(`   - ${who(u)}`);
    console.log(`       own school (User.schoolId): ${own ? label(own) : "none"}`);
    for (const id of otherManaged) console.log(`       extra: ${label(id)}`);
  }

  console.log(`\n2. Active memberships in more than one school: ${multipleMemberships.length}`);
  for (const { u, own, memberSchools } of multipleMemberships) {
    console.log(`   - ${who(u)}`);
    console.log(`       own school (User.schoolId): ${own ? label(own) : "none"}`);
    for (const id of memberSchools) console.log(`       member of: ${label(id)}${id === own ? " (own)" : ""}`);
  }

  console.log(`\n3. No school at all (will be refused everywhere): ${noSchool.length}`);
  for (const { u } of noSchool) console.log(`   - ${who(u)}`);

  console.log(`\n4. No User.schoolId yet; saved automatically at next login: ${fixedAtLogin.length}`);
  for (const { u, school } of fixedAtLogin) console.log(`   - ${who(u)} -> ${label(school)}`);

  const needsAttention = extraManaged.length + multipleMemberships.length + noSchool.length;
  console.log(`\n${needsAttention === 0 ? "No accounts need attention." : `${needsAttention} finding(s) in sections 1-3 need attention.`}`);
} catch (error) {
  console.error("Audit failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
