import jwt, { type JwtPayload } from "jsonwebtoken";

export interface AttemptTokenClaims {
  attemptId: string;
  examId: string;
  studentId: string;
}

export type AttemptTokenPayload = AttemptTokenClaims & JwtPayload & { scope: "exam-attempt" };

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Attempt tokens are deliberately narrow (attemptId/examId/studentId only) and short-lived —
// they authorize answering/submitting a single exam sitting, nothing else. This lets CBT
// exams work without a full student login system.
export function signAttemptToken({ attemptId, examId, studentId }: AttemptTokenClaims, expiresInSeconds: number): string {
  return jwt.sign({ attemptId, examId, studentId, scope: "exam-attempt" }, JWT_SECRET, {
    expiresIn: expiresInSeconds,
  });
}

export function verifyAttemptToken(token: string): AttemptTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as AttemptTokenPayload | string;
  if (typeof decoded === "string" || decoded.scope !== "exam-attempt") {
    throw new Error("Invalid attempt token");
  }
  return decoded;
}
