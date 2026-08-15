import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Attempt tokens are deliberately narrow (attemptId/examId/studentId only) and short-lived —
// they authorize answering/submitting a single exam sitting, nothing else. This lets CBT
// exams work without a full student login system.
export function signAttemptToken({ attemptId, examId, studentId }, expiresInSeconds) {
  return jwt.sign({ attemptId, examId, studentId, scope: "exam-attempt" }, JWT_SECRET, {
    expiresIn: expiresInSeconds,
  });
}

export function verifyAttemptToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.scope !== "exam-attempt") {
    throw new Error("Invalid attempt token");
  }
  return decoded;
}
