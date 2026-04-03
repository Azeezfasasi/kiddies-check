import AIChat from '@/components/AIChat';

export default function ReuseAbleAiChat() {
  const studentData = {
    name: "John Doe",
    gradeLevel: "Grade 5",
    subjects: ["Math", "English"],
    recentPerformance: "Strong in reading..."
  };

  return (
    <div className="">
        <AIChat
            userRole="parent"
            studentData={studentData}
            title="Ask About Learning"
        />
    </div>
  );
}