import { TrendingUp, Users, CheckCircle, AlertTriangle } from "lucide-react";

export function KpiDashboard() {
  const kpis = [
    { title: "Active Cases", value: "1,248", change: "+12%", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Recovery Rate", value: "68.5%", change: "+5.2%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Completed Today", value: "342", change: "-2%", icon: CheckCircle, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Pending Review", value: "28", change: "Requires Action", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">{kpi.title}</p>
              <h3 className="text-3xl font-bold text-slate-800">{kpi.value}</h3>
            </div>
            <div className={`rounded-lg p-3 ${kpi.bg}`}>
              <kpi.icon size={24} className={kpi.color} />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span
              className={
                kpi.change.includes("+")
                  ? "font-medium text-emerald-600"
                  : kpi.change.includes("-")
                  ? "font-medium text-rose-600"
                  : "font-medium text-amber-600"
              }
            >
              {kpi.change}
            </span>
            <span className="ml-2 text-slate-400">vs last week</span>
          </div>
        </div>
      ))}
    </div>
  );
}
