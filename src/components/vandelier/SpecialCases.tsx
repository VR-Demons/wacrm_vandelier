import { AlertCircle, Clock } from "lucide-react";

export function SpecialCases() {
  const cases = [
    { id: "CAS-092", user: "Maria G.", reason: "Invalid phone number format", time: "2h ago" },
    { id: "CAS-104", user: "Carlos R.", reason: "Missing contract ID", time: "4h ago" },
    { id: "CAS-112", user: "Elena M.", reason: "Duplicate entry detected", time: "5h ago" },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <AlertCircle size={20} className="text-amber-500" />
          Special Cases
        </h3>
        <p className="mt-1 text-sm text-slate-500">Requires manual intervention</p>
      </div>
      
      <div className="flex-1 divide-y divide-slate-100">
        {cases.map((c) => (
          <div key={c.id} className="p-4 transition-colors hover:bg-slate-50">
            <div className="mb-1 flex items-start justify-between">
              <span className="text-sm font-semibold text-slate-800">{c.id}</span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={12} /> {c.time}
              </span>
            </div>
            <p className="mb-2 text-sm text-slate-600">{c.user}</p>
            <span className="inline-flex items-center rounded border border-rose-100 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
              {c.reason}
            </span>
          </div>
        ))}
        {cases.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No special cases right now.
          </div>
        )}
      </div>
      
      <div className="border-t border-slate-100 bg-slate-50 p-4">
        <button className="w-full rounded-lg py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700">
          View all cases
        </button>
      </div>
    </div>
  );
}
