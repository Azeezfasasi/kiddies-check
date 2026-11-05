import ExamAttempt from "@/app/server/models/ExamAttempt";
import Assessment from "@/app/server/models/Assessment";

export function getGradeLevel(score) {
  if (score >= 75) return "A1";
  if (score >= 70) return "B2";
  if (score >= 65) return "C4";
  if (score >= 55) return "C5";
  if (score >= 50) return "C6";
  if (score >= 45) return "D7";
  if (score >= 40) return "E8";
  return "F";
}

export function examAssessmentRemarks(examTitle: string) {
  return `Auto-graded CBT exam: ${examTitle}`;
}

// Score an attempt's saved answers against the exam's current questions.
export function scoreAttempt(attempt, questions) {
  const answerByQuestion = new Map(attempt.answers.map((a) => [a.question.toString(), a.selectedOptionId?.toString() || null]));

  let score = 0;
  const maxScore = questions.reduce((sum, q) => sum + q.marks, 0);

  for (const q of questions) {
    const selectedOptionId = answerByQuestion.get(q._id.toString());
    if (!selectedOptionId) continue;
    const correctOption = q.options.find((o) => o.isCorrect);
    if (correctOption && correctOption._id.toString() === selectedOptionId) {
      score += q.marks;
    }
  }

  const percentageScore = maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0;
  return { score, maxScore, percentageScore };
}

// Re-grade every graded attempt after the answer key or marks were corrected, and keep the
// matching report-card Assessment in step. `previousTitle` locates Assessments written before
// they were linked to their attempt.
export async function regradeExamAttempts(exam, questions, previousTitle: string) {
  const attempts = await ExamAttempt.find({ exam: exam._id, status: "graded" });
  let regraded = 0;

  for (const attempt of attempts) {
    const { score, maxScore, percentageScore } = scoreAttempt(attempt, questions);
    const scoreChanged = attempt.score !== score || attempt.maxScore !== maxScore;
    const titleChanged = previousTitle !== exam.title;
    if (!scoreChanged && !titleChanged) continue;

    if (scoreChanged) {
      attempt.score = score;
      attempt.maxScore = maxScore;
      await attempt.save();
      regraded++;
    }

    const assessment =
      (await Assessment.findOne({ examAttempt: attempt._id })) ||
      (await Assessment.findOne({
        student: attempt.student,
        school: exam.school,
        subject: exam.subject,
        assessmentType: "exam",
        remarks: examAssessmentRemarks(previousTitle),
        date: attempt.submittedAt,
      }));

    if (assessment) {
      assessment.examAttempt = attempt._id;
      assessment.score = percentageScore;
      assessment.percentage = percentageScore;
      assessment.gradeLevel = getGradeLevel(percentageScore);
      assessment.remarks = examAssessmentRemarks(exam.title);
      assessment.updatedAt = new Date();
      await assessment.save();
    }
  }

  return regraded;
}
