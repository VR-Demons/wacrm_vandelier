import { GitCommit, GitPullRequest, GitMerge } from "lucide-react";

export function FlowChart() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-bold text-slate-800">Workflow Status</h3>
      
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute bottom-8 left-[1.3rem] top-8 w-0.5 bg-slate-200" />
        
        <div className="relative space-y-8">
          <div className="flex gap-4">
            <div className="z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-4 border-white bg-emerald-100 shadow-sm">
              <GitCommit size={20} className="text-emerald-600" />
            </div>
            <div className="pt-2">
              <h4 className="font-semibold text-slate-800">Data Ingestion</h4>
              <p className="mt-1 text-sm text-slate-500">Files parsed and standardized successfully.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-100 shadow-sm">
              <GitPullRequest size={20} className="text-blue-600" />
            </div>
            <div className="pt-2">
              <h4 className="font-semibold text-slate-800">n8n Processing</h4>
              <p className="mt-1 text-sm text-slate-500">Automation executing follow-up sequences.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-4 border-white bg-slate-100 shadow-sm">
              <GitMerge size={20} className="text-slate-400" />
            </div>
            <div className="pt-2">
              <h4 className="font-semibold text-slate-500">Report Generation</h4>
              <p className="mt-1 text-sm text-slate-400">Pending batch completion.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
