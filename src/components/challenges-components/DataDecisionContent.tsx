import React from 'react'

export default function DataDecisionContent() {
  return (
    <section className="w-full bg-white py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto px-4 sm:px-6 lg:px-12 max-w-5xl">
        
        {/* Introduction Content */}
        <div className="space-y-8 text-gray-700 text-lg leading-relaxed mb-16 pb-16 border-b border-gray-200">
          <p>
            KiddiesCheck changes this by turning everyday school activity into clear, usable insight. Every check-in, absence, late pickup, and parent interaction is captured as structured data—creating a reliable, real-time picture of what is actually happening in the school.
          </p>

          <p>
            Over time, this data reveals patterns that matter. Schools can see attendance trends, identify children with irregular routines, track pickup behaviors, and spot inconsistencies that may signal deeper issues. Instead of reacting late, school leaders can act early with confidence and evidence.
          </p>

          <p>
            Decisions become simpler and stronger. Whether it's improving punctuality, tightening safeguarding processes, or engaging parents more effectively, leaders are no longer guessing but responding to real signals.
          </p>

          <p>
            KiddiesCheck doesn't overwhelm schools with dashboards; they don't need more data. It gives them the right insights, at the right time, in a way that is easy to understand and act on.
          </p>

          <div className="bg-blue-50 p-6 rounded-lg">
            <p className="text-center text-lg font-semibold text-gray-900">
              Because better decisions start with seeing clearly what's really going on.
            </p>
          </div>
        </div>

        {/* Key Focus Areas */}
        <div className="space-y-12 mb-16">
          {/* Focus Area 1 */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Child Safeguarding & School Safety</h3>
            <p className="text-gray-700 text-lg leading-relaxed">
              At the heart of KiddiesCheck is one priority: keeping children safe. We focus on ensuring that every child is properly accounted for from arrival to departure, and that only authorized individuals can pick them up. This removes uncertainty from child movement and strengthens safeguarding systems in schools.
            </p>
          </div>

          {/* Focus Area 2 */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Attendance & Child Movement Tracking</h3>
            <p className="text-gray-700 text-lg leading-relaxed">
              Many schools still rely on manual attendance and informal tracking systems. KiddiesCheck digitizes this, completely capturing real-time check-ins, check-outs, lateness, and absence patterns—so schools always know who is in school, who is not, and when movement happens.
            </p>
          </div>

          {/* Focus Area 3 */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Parent Engagement & Real-Time Communication</h3>
            <p className="text-gray-700 text-lg leading-relaxed">
              Trust between schools and parents depends on communication. KiddiesCheck ensures parents are instantly informed about their child's arrival, departure, and key movements. This reduces anxiety, builds transparency, and strengthens school–home relationships.
            </p>
          </div>

          {/* Focus Area 4 */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Data & Decision Intelligence</h3>
            <p className="text-gray-700 text-lg leading-relaxed">
              Schools generate daily data but rarely use it effectively. KiddiesCheck transforms routine activity into clear, actionable insights—helping school leaders understand attendance trends, identify risks early, and make better operational and safeguarding decisions based on real evidence.
            </p>
          </div>
        </div>

        {/* Closing Statement */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-8 rounded-lg text-center">
          <p className="text-xl font-semibold text-gray-900">
            KiddiesCheck sits at the intersection of safety, communication, and school intelligence
          </p>
        </div>

      </div>
    </section>
  )
}
