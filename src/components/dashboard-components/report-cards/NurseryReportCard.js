
"use client";

import React from "react";

const RATING_LABELS = ["Excellent", "Good", "Fair", "Poor"];

const defaultReportData = [
  { type: "section", label: "SOCIAL AND EMOTIONAL LEARNING" },
  { type: "question", label: "Adjusting to Nur. Experiments?", rating: 0 },
  { type: "question", label: "Get along with other?", rating: 0 },
  { type: "question", label: "Very Shy?", rating: 3 },
  { type: "question", label: "Fights Often?", rating: 3 },
  { type: "question", label: "Ready to share with others", rating: 1 },
  { type: "question", label: "Considerate to others", rating: 0 },
  { type: "question", label: "Self Confident?", rating: 0 },
  { type: "question", label: "Punctual?", rating: 1 },
  {
    type: "question",
    label: (
      <>
        Cross Motor Skills-throwing Balls,
        <br />
        running, jumping, climbing?
      </>
    ),
    rating: 1,
  },
  {
    type: "question",
    label: (
      <>
        Participate in mutual work e.g
        <br />
        gardening?
      </>
    ),
    rating: 0,
  },
  {
    type: "question",
    label: (
      <>
        <strong className="mb-0.5 block text-[13px] font-semibold">Physical defects - Easily fatigued?</strong>
        <span className="text-xs leading-tight">
          difficulty with reading picture, and
          <br />
          Letters, hard of hearing always
          <br />
          sleeping, running nose, headache, ear
          <br />
          ache, stomach pain
        </span>
      </>
    ),
    rating: 3,
  },
  { type: "subsection", label: "Language Learning" },
  {
    type: "question",
    label: (
      <>
        Skill in (listening and understanding
        <br />
        Spoken Language Skills
      </>
    ),
    rating: 1,
  },
  { type: "section", label: "INTELLECTUAL DEVELOPMENT" },
  { type: "question", label: "able to solve problems", rating: 1 },
  { type: "question", label: "able to seek relationships", rating: 0 },
  { type: "question", label: "able to extend his experience", rating: 1 },
  { type: "question", label: "able to gain information", rating: 0 },
  { type: "section", label: "PHYSICAL DEVELOPMENT" },
  {
    type: "question",
    label: (
      <>
        <strong className="mb-0.5 block font-semibold">Fine Motor Skills: Handling small toys</strong>
        drawing, crayon, writing
      </>
    ),
    rating: 2,
  },
  { type: "question", label: "Attention Span - Short Average, Longs,", rating: 1 },
  {
    type: "question",
    label: (
      <>
        <strong className="mb-0.5 block font-semibold">Personal Attractiveness Neatness - Clothes</strong>
        Shoes, Hair, Teeth, Nails Skin.
      </>
    ),
    rating: 0,
  },
];

const defaultComments = [
  "A calm and cooperative child who continues to improve steadily across the term.",
  "Shows good confidence and participates well in classroom activities.",
  "Continues to need support with fine motor tasks and mindful classroom routines.",
];

function FilledField({ label, value }) {
  return (
    <div className="flex items-end">
      <span className="whitespace-nowrap">{label}:</span>
      <div className="relative ml-2 w-full">
        <div className="border-b border-blue-900 h-5" />
        <span className="absolute bottom-0.5 left-1 text-sm font-normal text-blue-900">{value}</span>
      </div>
    </div>
  );
}

export default function NurseryReportCard({ data = {}, studentName = "", className = "", teacher = "", term = "", academicYear = "" }) {
  const childInfo = {
    name: data.childName || studentName || "",
    className: data.className || className || "",
    teacher: data.teacher || teacher || "",
    term: data.term || term || "",
    academicYear: data.academicYear || academicYear || "",
  };

  const reportData = data.ratingData?.length ? data.ratingData : defaultReportData;
  const generalComments = data.generalComments?.length ? data.generalComments : defaultComments;

  return (
    <div className="mx-auto my-4 max-w-[850px] border border-gray-300 bg-white p-8 font-sans text-[13px] text-blue-900 shadow-lg print:my-0 print:p-4 print:shadow-none">
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm font-semibold">
        <FilledField label="Name of Child" value={childInfo.name} />
        <div />
        <FilledField label="Class" value={childInfo.className} />
        <FilledField label="Teacher / Observer" value={childInfo.teacher} />
      </div>

      <div className="mt-6 mb-2 flex items-end justify-between">
        <div className="flex items-center gap-1 font-semibold text-blue-900">
          Instruction: Please tick (
          <span className="-mt-1 inline-block text-xl font-bold">✓</span>
          ) the appropriate column
        </div>
        <div className="pr-2 text-2xl font-black uppercase tracking-wider text-blue-950">Ratings</div>
      </div>

      <div className="overflow-hidden border-2 border-blue-900">
        <div className="grid grid-cols-12 border-b-2 border-blue-900 bg-blue-900 text-white">
          <div className="col-span-8 p-2 text-xs font-semibold uppercase tracking-wide">Assessment Area</div>
          {RATING_LABELS.map((label) => (
            <div key={label} className="col-span-1 border-l border-blue-700 p-1 text-center text-[10px] font-semibold leading-tight">
              {label}
            </div>
          ))}
        </div>

        <div className="divide-y divide-blue-900 [&>div]:grid [&>div]:grid-cols-12 [&>div]:divide-x-2 [&>div]:divide-blue-900">
          {reportData.map((row, index) => {
            if (row.type === "section") {
              return (
                <div key={`${row.label}-${index}`} className="bg-blue-50/40 !border-t-2">
                  <div className="col-span-8 p-2 text-sm font-black uppercase tracking-wide">{row.label}</div>
                  {RATING_LABELS.map((_, i) => (
                    <div key={i} className="col-span-1" />
                  ))}
                </div>
              );
            }

            if (row.type === "subsection") {
              return (
                <div key={`${row.label}-${index}`} className="bg-blue-50/20">
                  <div className="col-span-8 p-2 text-sm font-bold italic">{row.label}</div>
                  {RATING_LABELS.map((_, i) => (
                    <div key={i} className="col-span-1" />
                  ))}
                </div>
              );
            }

            return (
              <div key={`${row.label}-${index}`}>
                <div className="col-span-8 p-2 font-medium leading-tight">{row.label}</div>
                {RATING_LABELS.map((_, i) => (
                  <div key={i} className="col-span-1 flex items-center justify-center">
                    {Number(row.rating) === i ? <span className="text-lg font-bold text-blue-900">✓</span> : null}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
          <h3 className="text-base font-black uppercase tracking-wide text-blue-950">General comments</h3>
          <div className="text-xs text-blue-800">
            {childInfo.term ? `${childInfo.term}` : ""}
            {childInfo.academicYear ? ` • ${childInfo.academicYear}` : ""}
          </div>
        </div>
        {generalComments.map((line, i) => (
          <div key={`${line}-${i}`} className="mt-6 border-b-2 border-blue-900 pb-0.5 text-sm font-normal">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}