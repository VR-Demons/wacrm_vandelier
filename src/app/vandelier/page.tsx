"use client";

import { useState } from "react";
import { LandingPage } from "@/components/vandelier/LandingPage";
import { Header } from "@/components/vandelier/Header";
import { KpiDashboard } from "@/components/vandelier/KpiDashboard";
import { FlowChart } from "@/components/vandelier/FlowChart";
import { SpecialCases } from "@/components/vandelier/SpecialCases";
import { Accordion } from "@/components/vandelier/Accordion";
import { ReportsDashboard } from "@/components/vandelier/ReportsDashboard";
import { DatabaseViewer } from "@/components/vandelier/DatabaseViewer";

export default function VandelierPage() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!showDashboard) {
    return <LandingPage onEnter={() => setShowDashboard(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 animate-fade-in">
        <Accordion title="System Overview" defaultOpen={true}>
          <KpiDashboard />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-full">
              <FlowChart />
            </div>
            <div className="h-full">
              <SpecialCases />
            </div>
          </div>
        </Accordion>

        <Accordion title="Data Ingestion" defaultOpen={false}>
          <ReportsDashboard onDataUpdated={handleDataUpdated} />
        </Accordion>

        <Accordion title="Database Explorer" defaultOpen={true}>
          <DatabaseViewer refreshTrigger={refreshTrigger} />
        </Accordion>
      </main>
    </div>
  );
}
