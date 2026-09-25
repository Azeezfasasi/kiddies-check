import NurseryReportCard from '@/components/dashboard-components/report-cards/NurseryReportCard'

export default function NurseryReport() {
  return (
    <>
    {/* Laptop Report card */}
    <div className="hidden lg:block">
        <NurseryReportCard />
    </div>

    {/* Report card not available on mobile */}
    <div className="block lg:hidden">
        <div className="mx-auto my-8 max-w-[850px] bg-white p-8 font-sans text-[13px] text-blue-900 border border-gray-300 shadow-lg print:my-0 print:p-4 print:shadow-none">
            <div className="text-center text-lg font-bold text-blue-900">
                Nursery Report card cannot be viewed on mobile.
            </div>
            <div className="text-center text-sm text-blue-900 mt-2">
                Please switch to a laptop or desktop device to view the report card.
            </div>
        </div>
    </div>
    </>
  )
}
