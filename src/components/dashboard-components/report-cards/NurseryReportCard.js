"use client";

import React from "react";

export default function NurseryReportCard() {
  // Empty array to help render rating columns structurally
  const ratingCols = Array.from({ length: 4 });

  return (
    <div className="mx-auto my-8 max-w-[850px] bg-white p-8 font-sans text-[13px] text-blue-900 border border-gray-300 shadow-lg print:my-0 print:p-4 print:shadow-none">
      
      {/* TOP META FIELDS */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 font-semibold text-sm">
        <div className="flex items-end">
          <span className="whitespace-nowrap">Name of Child:</span>
          <div className="border-b border-blue-900 w-full ml-2 h-5"></div>
        </div>
        <div className="flex items-end">
          <span className="whitespace-nowrap"></span>
        </div>
        <div className="flex items-end">
          <span className="whitespace-nowrap">Class</span>
          <div className="border-b border-blue-900 w-full ml-2 h-5"></div>
        </div>
        <div className="flex items-end">
          <span className="whitespace-nowrap">Teacher / Observer</span>
          <div className="border-b border-blue-900 w-full ml-2 h-5"></div>
        </div>
      </div>

      {/* INSTRUCTION & RATINGS HEADER */}
      <div className="flex justify-between items-end mt-6 mb-2">
        <div className="font-semibold text-blue-900 flex items-center gap-1">
          Instruction: Please tick (
          <span className="text-xl inline-block -mt-1 font-bold">✓</span>
          ) the appropriate column
        </div>
        <div className="text-2xl font-black uppercase tracking-wider pr-16 text-blue-950">
          Ratings
        </div>
      </div>

      {/* MAIN RATINGS BLOCK / GRID SYSTEM */}
      <div className="border-2 border-blue-900 overflow-hidden">
        
        {/* ROW: SOCIAL AND EMOTIONAL LEARNING TITLE */}
        <div className="grid grid-cols-12 border-b-2 border-blue-900 bg-blue-50/40">
          <div className="col-span-6 p-2 font-black uppercase tracking-wide text-sm">
            SOCIAL AND EMOTIONAL LEARNING
          </div>
          {ratingCols.map((_, i) => (
            <div key={i} className="col-span-1 border-l-2 border-blue-900"></div>
          ))}
        </div>

        {/* ASSESSMENT ROWS */}
        <div className="divide-y border-blue-900 [&>div]:grid [&>div]:grid-cols-12 [&>div]:divide-x-2 [&>div]:divide-blue-900">
          
          <div>
            <div className="col-span-6 p-2 font-medium">Adjusting to Nur. Experiments?</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium">Get along with other?</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium">Very Shy?</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium">Fights Often?</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium">Ready to share with others</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium">Considerate to others</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium">Self Confident?</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium">Punctual?</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium leading-tight">
              Cross Motor Skills-throwing Balls,<br />running, jumping, climbing?
            </div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium leading-tight">
              Participate in mutual work e.g<br />gardening?
            </div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium text-xs leading-tight">
              <strong className="block text-[13px] font-semibold mb-0.5">Physical defects - Easily fatigued?</strong>
              difficulty with reading picture, and<br />
              Letters, hard of hearing always<br />
              sleeping, running nose, headache, ear<br />
              ache, stomach pain
            </div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          {/* LANGUAGE LEARNING SUBHEAD */}
          <div className="bg-blue-50/20">
            <div className="col-span-6 p-2 font-bold italic text-sm">Language Learning</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium leading-tight">
              Skill in (listening and understanding<br />Spoken Language Skills
            </div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          {/* INTELLECTUAL DEVELOPMENT TITLE */}
          <div className="bg-blue-50/40 !border-t-2">
            <div className="col-span-6 p-2 font-black uppercase tracking-wide text-sm">
              INTELLECTUAL DEVELOPMENT
            </div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium">able to solve problems</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium">able to seek relationships</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium">able to extend his experience</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium">able to gain information</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          {/* PHYSICAL DEVELOPMENT TITLE */}
          <div className="bg-blue-50/40 !border-t-2">
            <div className="col-span-6 p-2 font-black uppercase tracking-wide text-sm">
              PHYSICAL DEVELOPMENT
            </div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium leading-tight">
              <strong className="font-semibold block mb-0.5">Fine Motor Skills: Handling small toys</strong>
              drawing, crayon, writing
            </div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium">Attention Span - Short Average, Longs,</div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

          <div>
            <div className="col-span-6 p-2 font-medium leading-tight">
              <strong className="font-semibold block mb-0.5">Personal Attractiveness Neatness - Clothes</strong>
              Shoes, Hair, Teeth, Nails Skin.
            </div>
            {ratingCols.map((_, i) => <div key={i} className="col-span-1"></div>)}
          </div>

        </div>
      </div>

      {/* GENERAL COMMENTS SECTION */}
      <div className="mt-8">
        <h3 className="text-base font-black uppercase tracking-wide text-blue-950">
          General comments
        </h3>
        <div className="border-b-2 border-blue-900 w-full mt-6"></div>
        <div className="border-b-2 border-blue-900 w-full mt-6"></div>
        <div className="border-b-2 border-blue-900 w-full mt-6"></div>
      </div>

    </div>
  );
}