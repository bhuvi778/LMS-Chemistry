import { AlertCircle, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

export default function ReportedQuestions() {
  const reportedList = [
    {
      id: 101,
      testName: 'Electrochemistry Concept Quiz',
      questionText: 'Which of the following describes the function of a salt bridge in a galvanic cell?',
      issue: 'Option A and C contain identical statements about ion neutralization.',
      date: '28 June 2026',
      status: 'resolved',
      adminReply: 'Thank you for reporting this! We have updated Option C to read "to maintain electrical neutrality by allowing flow of anions towards anode". The test has been re-graded.'
    },
    {
      id: 102,
      testName: 'JEE Advanced Mock Test 3',
      questionText: 'Determine the major product formed when phenol reacts with CHCl3 in presence of NaOH.',
      issue: 'The structure in chemical equation formula was cropped and illegible.',
      date: '29 June 2026',
      status: 'under-review',
      adminReply: null
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Reported Questions</h1>
          <p className="text-sm text-slate-500 mt-1">Track issues or error corrections you reported in the practice tests.</p>
        </div>
      </div>

      {reportedList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <AlertCircle size={28} />
          </div>
          <h3 className="font-bold text-slate-700 text-lg">No Reported Issues</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            You haven't reported any question issues. If you find errors or typos in questions, let us know!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {reportedList.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
              {/* Header block */}
              <div className="flex justify-between items-start gap-3 border-b border-slate-50 pb-3 flex-wrap">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    TEST: {item.testName}
                  </span>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Reported on {item.date}</p>
                </div>
                
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase flex items-center gap-1 ${
                  item.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {item.status === 'resolved' ? (
                    <>
                      <CheckCircle2 size={11} />
                      <span>RESOLVED</span>
                    </>
                  ) : (
                    <>
                      <Clock size={11} />
                      <span>UNDER REVIEW</span>
                    </>
                  )}
                </span>
              </div>

              {/* Question summary info */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-slate-400">Question Text</p>
                <p className="font-semibold text-slate-700 leading-relaxed italic">"{item.questionText}"</p>
              </div>

              {/* Student feedback reason */}
              <div className="text-xs space-y-1 text-slate-700">
                <span className="font-bold text-slate-800">Your Feedback Reason:</span>
                <p className="leading-relaxed bg-brand-50/20 p-3 rounded-2xl border border-brand-100/10">
                  {item.issue}
                </p>
              </div>

              {/* Admin reply if present */}
              {item.adminReply && (
                <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl flex gap-3 text-xs text-emerald-800 items-start">
                  <MessageSquare size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-emerald-950">Official Response from Academics</h5>
                    <p className="mt-1 leading-relaxed text-emerald-700 font-semibold">{item.adminReply}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
