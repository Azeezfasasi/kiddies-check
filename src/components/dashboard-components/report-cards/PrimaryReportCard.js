"use client";

export default function PrimaryReportCard() {
  // Subjects list matching the vertical headers exactly in order
  const subjects = [
    "English Language",
    "Mathematics",
    "Verbal Reasoning",
    "Basic Science and Tech.",
    "Pre-Vocational Studies",
    "Religious and National Value Education",
    "Nigerian Language",
    "Cultural & Creative Arts",
    "Physical & Health Educ.",
    "Phonics",
    "Practical Agric.",
    "Home Economics",
    "French",
    "Music",
    "Computer Studies",
    "Writing",
  ];

  return (
    <div className="mx-auto my-8 max-w-[850px] bg-white p-6 font-serif text-xs text-black border border-gray-300 shadow-lg print:my-0 print:p-4 print:shadow-none">
      {/* HEADER SECTION */}
      <div className="text-center font-bold uppercase tracking-wide space-y-0.5">
        <h1 className="text-base">First Half Term</h1>
        <h2>1. Attendance</h2>
        <p className="text-[11px] lowercase italic font-normal">(Regularity & Punctuality)</p>
      </div>

      {/* YEAR & DATE */}
      <div className="flex justify-between mt-4 font-bold">
        <div>YEAR..........................................</div>
        <div>DATE ..........................................</div>
      </div>

      {/* 1. ATTENDANCE TABLE */}
      <table className="w-full mt-2 border-collapse border-2 border-black text-center font-semibold">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="w-1/2 border-r-2 border-black"></th>
            <th className="w-1/6 border-r border-black p-1">School</th>
            <th className="w-1/6 border-r border-black p-1">Sports</th>
            <th className="w-1/6 p-1 leading-tight text-[10px]">Other Organized Activities</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-black h-7">
            <td className="text-left px-2 border-r-2 border-black">No. of Times School Opened/Activities Held</td>
            <td className="border-r border-black"></td>
            <td className="border-r border-black"></td>
            <td></td>
          </tr>
          <tr className="border-b border-black h-7">
            <td className="text-left px-2 border-r-2 border-black">No. of Times Present</td>
            <td className="border-r border-black"></td>
            <td className="border-r border-black"></td>
            <td></td>
          </tr>
          <tr className="h-7">
            <td className="text-left px-2 border-r-2 border-black">No. of Times Punctual</td>
            <td className="border-r border-black"></td>
            <td className="border-r border-black"></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {/* 2. CONDUCT SECTION */}
      <div className="mt-4 border-2 border-black">
        <div className="grid grid-cols-2 border-b-2 border-black text-center font-bold bg-gray-50">
          <div className="border-r-2 border-black p-1 uppercase">Special Reports During the Half-Term</div>
          <div className="p-1 uppercase">2. Conduct</div>
        </div>
        
        <div className="grid grid-cols-2">
          {/* Left Column: Green/Red table */}
          <div className="border-r-2 border-black flex flex-col">
            <div className="grid grid-cols-2 text-center font-bold border-b border-black text-[10px]">
              <div className="border-r p-1 text-green-700 bg-green-50/50">GREEN for Exemplary conduct</div>
              <div className="p-1 text-red-700 bg-red-50/50">RED for Bad Conduct</div>
            </div>
            <div className="grid grid-cols-4 text-center font-bold border-b border-black">
              <div className="border-r p-0.5">Number</div>
              <div className="col-span-2 border-r p-0.5">Deed</div>
              <div className="p-0.5">Number</div>
            </div>
            <div className="grid grid-cols-4 h-7 border-b border-black">
              <div className="border-r"></div><div className="col-span-2 border-r"></div><div></div>
            </div>
            <div className="grid grid-cols-4 h-7">
              <div className="border-r"></div><div className="col-span-2 border-r"></div><div></div>
            </div>
          </div>

          {/* Right Column: Comments & Remarks */}
          <div className="p-2 space-y-4 flex flex-col justify-between">
            <div className="leading-relaxed">
              Comments...........................................................................................................................
              <div className="border-b border-dotted border-black w-full mt-3"></div>
              <div className="border-b border-dotted border-black w-full mt-3"></div>
            </div>
            <div className="font-bold">
              Remarks...........................................................................................................................
            </div>
          </div>
        </div>
      </div>

      {/* 3. PHYSICAL DEVELOPMENT, HEALTH AND CLEANLINESS */}
      <div className="mt-4">
        <div className="text-center font-bold uppercase p-1 border-t-2 border-x-2 border-black bg-gray-50">
          3. PHYSICAL DEVELOPMENT, HEALTH AND CLEANLINESS
        </div>
        <table className="w-full border-collapse border-2 border-black text-center font-semibold">
          <thead>
            <tr className="border-b border-black">
              <th colSpan={2} className="border-r-2 border-black w-1/3 p-1 uppercase">Height</th>
              <th colSpan={2} className="border-r-2 border-black w-1/3 p-1 uppercase">Weight</th>
              <th rowSpan={2} className="border-r border-black w-1/6 p-1 text-[10px] leading-tight">No of Days Absent Due to Illness</th>
              <th rowSpan={2} className="w-1/6 p-1 uppercase text-[10px]">Nature of illness</th>
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
              <td className="border-r">m</td>
              <td className="border-r-2 border-black">m</td>
              <td className="border-r">kg</td>
              <td className="border-r-2 border-black">kg</td>
              <td className="border-r border-black"></td>
              <td></td>
            </tr>
            <tr className="h-8">
              <td colSpan={3} className="text-left px-2 border-r border-black font-bold">
                Cleanliness Rating.........................................................................
              </td>
              <td colSpan={3} className="text-left px-2 font-bold">
                Remarks........................................................................................
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. PERFORMANCE IN SUBJECTS */}
      <div className="mt-4">
        <div className="text-center font-bold uppercase p-1 border-t-2 border-x-2 border-black bg-gray-50">
          4. PERFORMANCE IN SUBJECTS
        </div>
        <table className="w-full border-collapse border-2 border-black text-center font-semibold">
          <thead>
            <tr className="border-b-2 border-black h-44">
              {/* Row title column spacing */}
              <th className="border-r-2 border-black w-32"></th>
              <th className="border-r border-black px-1 text-center">
                <div className="whitespace-nowrap -rotate-90 transform origin-center inline-block w-6 font-bold tracking-tight">
                  Max Obtainable
                </div>
              </th>
              {/* Dynamic vertical rendering of subject titles */}
              {subjects.map((subject, idx) => (
                <th key={idx} className="border-r border-black px-0.5 text-center align-middle">
                  <div className="whitespace-nowrap -rotate-90 transform origin-center inline-block w-4 text-left font-medium tracking-tight text-[10px] max-h-36 pl-2">
                    {subject}
                  </div>
                </th>
              ))}
              <th className="w-10 text-center font-bold">
                <div className="whitespace-nowrap -rotate-90 transform origin-center inline-block w-4">
                  Total
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black h-7 text-left">
              <td className="font-bold px-2 border-r-2 border-black">Cont. Assess. Scores</td>
              {Array.from({ length: 18 }).map((_, i) => (
                <td key={i} className="border-r border-black last:border-r-0"></td>
              ))}
            </tr>
            <tr className="border-b border-black h-7 text-left">
              <td className="font-bold px-2 border-r-2 border-black italic text-[11px]">Sum. Test Scores (If any)</td>
              {Array.from({ length: 18 }).map((_, i) => (
                <td key={i} className="border-r border-black last:border-r-0"></td>
              ))}
            </tr>
            <tr className="h-7 text-left bg-gray-50/50">
              <td className="font-bold px-2 border-r-2 border-black">Total (Weighted Average)</td>
              <td className="border-r border-black font-bold text-center">100</td>
              {Array.from({ length: 17 }).map((_, i) => (
                <td key={i} className="border-r border-black last:border-r-0"></td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. SPORTS */}
      <div className="mt-4">
        <div className="text-center font-bold uppercase p-0.5 border-t-2 border-x-2 border-black bg-gray-50">
          5. SPORTS
        </div>
        <table className="w-full border-collapse border-2 border-black text-center font-semibold">
          <thead>
            <tr className="border-b border-black">
              <th className="w-1/5 border-r-2 border-black p-1 text-left px-2">Events</th>
              <th className="w-1/5 border-r border-black p-1">Ball Games</th>
              <th className="w-1/5 border-r border-black p-1">Track</th>
              <th className="w-1/5 border-r border-black p-1">Jumps</th>
              <th className="w-1/5 border-r border-black p-1">Throws</th>
              <th className="w-1/5 p-1">Swimming</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black h-7 text-left">
              <td className="font-bold px-2 border-r-2 border-black">Level Attained</td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td></td>
            </tr>
            <tr className="h-10 text-left">
              <td colSpan={6} className="px-2 font-bold align-top pt-1">
                Comments......................................................................................................................................................................
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. CLUBS, YOUTH, ORGANIZATIONS ETC. */}
      <div className="mt-4">
        <div className="text-center font-bold uppercase p-0.5 border-t-2 border-x-2 border-black bg-gray-50">
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
            <tr className="border-b border-black h-7">
              <td className="border-r-2 border-black"></td>
              <td className="border-r-2 border-black"></td>
              <td></td>
            </tr>
            <tr className="h-7">
              <td className="border-r-2 border-black"></td>
              <td className="border-r-2 border-black"></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTER SIGNATURES & COMMENTS SECTION */}
      <div className="mt-6 space-y-5 font-bold">
        <div>
          <p>Class Teacher&apos;s Comments............................................................................................................................................</p>
          <div className="border-b border-dotted border-black w-full mt-3.5"></div>
          <div className="flex justify-end mt-2">
            <span>Signature..........................................................................</span>
          </div>
        </div>

        <div>
          <p>Headmasters Comments................................................................................................................................................</p>
          <div className="border-b border-dotted border-black w-full mt-3.5"></div>
          <div className="flex justify-end mt-2">
            <span>Signature & Date/School Stamp........................................................</span>
          </div>
        </div>

        <div className="flex justify-between items-end pt-2">
          <div className="w-1/2">
            Parent&apos;s Name..........................................................................
          </div>
          <div className="w-1/2 text-right">
            Signature..........................................................................
          </div>
        </div>

        <div className="text-[11px] font-medium italic space-y-1 pt-1">
          <p>(Please return this card to the school on..........................................................................................................................</p>
          <p className="text-right">.........................................................................................................when next term begins</p>
        </div>
      </div>
    </div>
  );
}