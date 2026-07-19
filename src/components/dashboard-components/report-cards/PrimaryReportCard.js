"use client";

const defaultAttendanceData = [
  { label: "No. of Times School Opened/Activities Held", school: 120, sports: 18, activities: 6 },
  { label: "No. of Times Present", school: 116, sports: 18, activities: 6 },
  { label: "No. of Times Punctual", school: 110, sports: 17, activities: 5 },
];

const defaultConductData = {
  greenNumber: "",
  greenDeed: "",
  redNumber: "",
  redDeed: "",
  comments: "",
  remarks: "",
};

const defaultPhysicalData = {
  heightStart: "-",
  heightEnd: "-",
  weightStart: "-",
  weightEnd: "-",
  illnessDays: "",
  illnessNature: "",
  cleanliness: "",
  cleanlinessRemarks: "",
};

const defaultSubjectPerformance = [
  { subject: "English Language", continuousAssess: 78, testScore: 82, total: 80 },
  { subject: "Mathematics", continuousAssess: 74, testScore: 80, total: 76 },
  { subject: "Verbal Reasoning", continuousAssess: 72, testScore: 78, total: 74 },
  { subject: "Basic Science and Tech.", continuousAssess: 76, testScore: 81, total: 78 },
  { subject: "Vocational Studies", continuousAssess: 70, testScore: 75, total: 72 },
  { subject: "National Value", continuousAssess: 79, testScore: 84, total: 81 },
  { subject: "Nigerian Language", continuousAssess: 73, testScore: 77, total: 75 },
  { subject: "Creative Arts", continuousAssess: 82, testScore: 86, total: 84 },
  { subject: "Physical & Health Educ.", continuousAssess: 77, testScore: 80, total: 78 },
  { subject: "Phonics", continuousAssess: 81, testScore: 83, total: 82 },
  { subject: "Practical Agric.", continuousAssess: 69, testScore: 74, total: 71 },
  { subject: "Home Economics", continuousAssess: 75, testScore: 79, total: 76 },
  { subject: "French", continuousAssess: 68, testScore: 72, total: 70 },
  { subject: "Music", continuousAssess: 80, testScore: 85, total: 82 },
  { subject: "Computer Studies", continuousAssess: 76, testScore: 80, total: 78 },
  { subject: "Writing", continuousAssess: 84, testScore: 88, total: 86 },
];

const defaultSportsData = {
  level: "",
  comments: "",
};

const defaultClubData = [
  { organization: "School Debate Club", office: "Member", contribution: "Participated in weekly discussions and presented ideas confidently." },
  { organization: "Science Club", office: "Assistant Prefect", contribution: "Supported group experiments and helped tidy the lab after practicals." },
];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function PrimaryReportCard({ data = {}, studentName = "", className = "", teacher = "", term = "", academicYear = "", date = "" }) {
  const childInfo = {
    name: data.childName || studentName || "",
    className: data.className || className || "",
    teacher: data.teacher || teacher || "",
    year: data.academicYear || academicYear || "",
    date: data.date || date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    term: data.term || term || "",
  };

  const attendanceRows = Array.isArray(data.attendance) && data.attendance.length ? data.attendance : defaultAttendanceData;
  const conductData = {
    greenNumber: data.conduct?.greenNumber ?? defaultConductData.greenNumber,
    greenDeed: data.conduct?.greenDeed ?? defaultConductData.greenDeed,
    redNumber: data.conduct?.redNumber ?? defaultConductData.redNumber,
    redDeed: data.conduct?.redDeed ?? defaultConductData.redDeed,
    comments: data.conduct?.comments ?? defaultConductData.comments,
    remarks: data.conduct?.remarks ?? defaultConductData.remarks,
  };

  const physicalData = {
    heightStart: data.physical?.heightStart ?? defaultPhysicalData.heightStart,
    heightEnd: data.physical?.heightEnd ?? defaultPhysicalData.heightEnd,
    weightStart: data.physical?.weightStart ?? defaultPhysicalData.weightStart,
    weightEnd: data.physical?.weightEnd ?? defaultPhysicalData.weightEnd,
    illnessDays: data.physical?.illnessDays ?? defaultPhysicalData.illnessDays,
    illnessNature: data.physical?.illnessNature ?? defaultPhysicalData.illnessNature,
    cleanliness: data.physical?.cleanliness ?? defaultPhysicalData.cleanliness,
    cleanlinessRemarks: data.physical?.cleanlinessRemarks ?? defaultPhysicalData.cleanlinessRemarks,
  };

  const subjectPerformance = Array.isArray(data.subjects) && data.subjects.length ? data.subjects : defaultSubjectPerformance;
  const sportsData = {
    level: data.sports?.level ?? defaultSportsData.level,
    comments: data.sports?.comments ?? defaultSportsData.comments,
  };

  const clubData = Array.isArray(data.clubs) && data.clubs.length ? data.clubs : defaultClubData;

  return (
    <div className="mx-auto my-4 max-w-[850px] border border-gray-300 bg-white p-6 font-serif text-xs text-black shadow-lg print:my-0 print:p-4 print:shadow-none">
      <div className="space-y-0.5 text-center font-bold uppercase tracking-wide">
        <h1 className="text-base">{childInfo.term}</h1>
        <h2>1. Attendance</h2>
        <p className="text-[11px] font-normal lowercase italic">(Regularity & Punctuality)</p>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
        <span>Name of Child: {childInfo.name}</span>
        <span>Class: {childInfo.className}</span>
      </div>
      <div className="mt-1 text-[11px] font-semibold">Teacher / Observer: {childInfo.teacher}</div>

      <div className="mt-4 flex justify-between font-bold">
        <div>YEAR: {childInfo.year}</div>
        <div>DATE: {childInfo.date}</div>
      </div>

      <table className="mt-2 w-full border-collapse border-2 border-black text-center font-semibold">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="w-1/2 border-r-2 border-black"></th>
            <th className="w-1/6 border-r border-black p-1">School</th>
            <th className="w-1/6 border-r border-black p-1">Sports</th>
            <th className="w-1/6 p-1 text-[10px] leading-tight">Other Organized Activities</th>
          </tr>
        </thead>
        <tbody>
          {attendanceRows.map((row) => (
            <tr key={row.label} className="h-7 border-b border-black last:border-b-0">
              <td className="border-r-2 border-black px-2 text-left">{row.label}</td>
              <td className="border-r border-black">{row.school}</td>
              <td className="border-r border-black">{row.sports}</td>
              <td>{row.activities}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 border-2 border-black">
        <div className="grid grid-cols-2 border-b-2 border-black bg-gray-50 text-center font-bold">
          <div className="border-r-2 border-black p-1 uppercase">Special Reports During the Half-Term</div>
          <div className="p-1 uppercase">2. Conduct</div>
        </div>

        <div className="grid grid-cols-2">
          <div className="flex flex-col border-r-2 border-black">
            <div className="grid grid-cols-2 border-b border-black bg-green-50/50 text-center text-[10px] font-bold">
              <div className="border-r p-1 text-green-700">GREEN for Exemplary conduct</div>
              <div className="p-1 text-red-700 bg-red-50/50">RED for Bad Conduct</div>
            </div>
            <div className="grid grid-cols-4 border-b border-black text-center font-bold">
              <div className="border-r p-0.5">Number</div>
              <div className="col-span-2 border-r p-0.5">Deed</div>
              <div className="p-0.5">Number</div>
            </div>
            <div className="grid h-7 grid-cols-4 border-b border-black">
              <div className="border-r px-2 text-center">{conductData.greenNumber}</div>
              <div className="col-span-2 border-r px-2 text-left">{conductData.greenDeed}</div>
              <div className="px-2 text-center">{conductData.redNumber}</div>
            </div>
            <div className="grid h-7 grid-cols-4">
              <div className="border-r"></div>
              <div className="col-span-2 border-r"></div>
              <div></div>
            </div>
          </div>

          <div className="flex flex-col justify-between p-2">
            <div className="leading-relaxed">
              <div>Comments: {conductData.comments}</div>
              <div className="mt-3 w-full border-b border-dotted border-black"></div>
              <div className="mt-3 w-full border-b border-dotted border-black"></div>
            </div>
            <div className="font-bold">Remarks: {conductData.remarks}</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="border-x-2 border-t-2 border-black bg-gray-50 p-1 text-center font-bold uppercase">
          3. PHYSICAL DEVELOPMENT, HEALTH AND CLEANLINESS
        </div>
        <table className="w-full border-collapse border-2 border-black text-center font-semibold">
          <thead>
            <tr className="border-b border-black">
              <th colSpan={2} className="w-1/3 border-r-2 border-black p-1 uppercase">Height</th>
              <th colSpan={2} className="w-1/3 border-r-2 border-black p-1 uppercase">Weight</th>
              <th rowSpan={2} className="w-1/6 border-r border-black p-1 text-[10px] leading-tight">No of Days Absent Due to Illness</th>
              <th rowSpan={2} className="w-1/6 p-1 text-[10px] uppercase">Nature of illness</th>
            </tr>
            <tr className="border-b-2 border-black text-[10px]">
              <th className="border-r p-1">Beginning of Term</th>
              <th className="border-r-2 border-black p-1">End of Term</th>
              <th className="border-r p-1">Beginning of Term</th>
              <th className="border-r-2 border-black p-1">End of Term</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-6 border-b border-black font-normal text-gray-500">
              <td className="border-r">{physicalData.heightStart}</td>
              <td className="border-r-2 border-black">{physicalData.heightEnd}</td>
              <td className="border-r">{physicalData.weightStart}</td>
              <td className="border-r-2 border-black">{physicalData.weightEnd}</td>
              <td className="border-r border-black">{physicalData.illnessDays}</td>
              <td>{physicalData.illnessNature}</td>
            </tr>
            <tr className="h-8">
              <td colSpan={3} className="border-r border-black px-2 text-left font-bold">
                Cleanliness Rating: {physicalData.cleanliness}
              </td>
              <td colSpan={3} className="px-2 text-left font-bold">
                Remarks: {physicalData.cleanlinessRemarks}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <div className="border-x-2 border-t-2 border-black bg-gray-50 p-1 text-center font-bold uppercase">
          4. PERFORMANCE IN SUBJECTS
        </div>
        <table className="w-full border-collapse border-2 border-black text-center font-semibold">
          <thead>
            <tr className="h-44 border-b-2 border-black">
              <th className="w-32 border-r-2 border-black"></th>
              <th className="border-r border-black px-1 text-center">
                <div className="inline-block w-6 -rotate-90 transform whitespace-nowrap text-center font-bold tracking-tight">
                  Max Obtainable
                </div>
              </th>
              {subjectPerformance.map((subject, idx) => (
                <th key={`${subject.subject || "subject"}-${idx}`} className="border-r border-black px-0.5 text-center align-middle">
                  <div className="mt-8 inline-block max-h-36 w-4 -rotate-90 transform pr-2 text-left text-[10px] font-medium tracking-tight whitespace-nowrap">
                    {subject.subject}
                  </div>
                </th>
              ))}
              <th className="w-10 text-center font-bold">
                <div className="inline-block w-4 -rotate-90 transform whitespace-nowrap">Total</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-7 border-b border-black text-left">
              <td className="border-r-2 border-black px-2 font-bold">Cont. Assess. Scores</td>
              <td className="border-r border-black text-center font-bold">100</td>
              {subjectPerformance.map((subject, index) => (
                <td key={`ca-${index}`} className="border-r border-black text-center">
                  {subject.continuousAssess}
                </td>
              ))}
              <td className="text-center font-bold">{subjectPerformance.reduce((sum, item) => sum + toNumber(item.continuousAssess), 0)}</td>
            </tr>
            <tr className="h-7 border-b border-black text-left">
              <td className="border-r-2 border-black px-2 font-bold italic text-[11px]">Sum. Test Scores (If any)</td>
              <td className="border-r border-black text-center font-bold">100</td>
              {subjectPerformance.map((subject, index) => (
                <td key={`test-${index}`} className="border-r border-black text-center">
                  {subject.testScore}
                </td>
              ))}
              <td className="text-center font-bold">{subjectPerformance.reduce((sum, item) => sum + toNumber(item.testScore), 0)}</td>
            </tr>
            <tr className="h-7 bg-gray-50/50 text-left">
              <td className="border-r-2 border-black px-2 font-bold">Total (Weighted Average)</td>
              <td className="border-r border-black text-center font-bold">100</td>
              {subjectPerformance.map((subject, index) => (
                <td key={`total-${index}`} className="border-r border-black text-center">
                  {subject.total}
                </td>
              ))}
              <td className="text-center font-bold">{subjectPerformance.reduce((sum, item) => sum + toNumber(item.total), 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <div className="border-x-2 border-t-2 border-black bg-gray-50 p-0.5 text-center font-bold uppercase">
          5. SPORTS
        </div>
        <table className="w-full border-collapse border-2 border-black text-center font-semibold">
          <thead>
            <tr className="border-b border-black">
              <th className="w-1/5 border-r-2 border-black p-1 px-2 text-left">Events</th>
              <th className="w-1/5 border-r border-black p-1">Ball Games</th>
              <th className="w-1/5 border-r border-black p-1">Track</th>
              <th className="w-1/5 border-r border-black p-1">Jumps</th>
              <th className="w-1/5 border-r border-black p-1">Throws</th>
              <th className="w-1/5 p-1">Swimming</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-7 border-b border-black text-left">
              <td className="border-r-2 border-black px-2 font-bold">Level Attained</td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td>{sportsData.level}</td>
            </tr>
            <tr className="h-10 text-left">
              <td colSpan={6} className="px-2 pt-1 align-top font-bold">
                Comments: {sportsData.comments}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <div className="border-x-2 border-t-2 border-black bg-gray-50 p-0.5 text-center font-bold uppercase">
          6. CLUBS, YOUTH, ORGANIZATIONS ETC.
        </div>
        <table className="w-full border-collapse border-2 border-black text-center font-semibold">
          <thead>
            <tr className="border-b border-black">
              <th className="w-1/4 border-r-2 border-black p-1 uppercase">Organization</th>
              <th className="w-1/4 border-r-2 border-black p-1 uppercase">Office Held</th>
              <th className="w-1/2 p-1 uppercase">Significant Contributions</th>
            </tr>
          </thead>
          <tbody>
            {clubData.map((row, index) => (
              <tr key={`${row.organization}-${index}`} className={`h-7 ${index === clubData.length - 1 ? "" : "border-b border-black"}`}>
                <td className="border-r-2 border-black">{row.organization}</td>
                <td className="border-r-2 border-black">{row.office}</td>
                <td>{row.contribution}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-5 font-bold">
        <div>
          <p>Class Teacher&apos;s Comments............................................................................................................................................</p>
          <div className="mt-3.5 w-full border-b border-dotted border-black"></div>
          <div className="mt-2 flex justify-end">
            <span>Signature..........................................................................</span>
          </div>
        </div>

        <div>
          <p>Headmasters Comments................................................................................................................................................</p>
          <div className="mt-3.5 w-full border-b border-dotted border-black"></div>
          <div className="mt-2 flex justify-end">
            <span>Signature & Date/School Stamp........................................................</span>
          </div>
        </div>

        <div className="flex items-end justify-between pt-2">
          <div className="w-1/2">Parent&apos;s Name..........................................................................
          </div>
          <div className="w-1/2 text-right">Signature..........................................................................
          </div>
        </div>

        <div className="space-y-1 pt-1 text-[11px] font-medium italic">
          <p>Please return this card to the school on..........................................................................................................................</p>
          <p className="text-right">.........................................................................................................when next term begins</p>
        </div>
      </div>
    </div>
  );
}