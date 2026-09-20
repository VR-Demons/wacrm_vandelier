"use client";

import { ArrowRight, Activity, Database, Shield } from "lucide-react";

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-900 text-white selection:bg-indigo-500/30">
      {/* Animated Background Orbs */}
      <div className="animate-blob mix-blend-multiply filter blur-2xl opacity-20 absolute -left-4 top-0 h-72 w-72 rounded-full bg-indigo-500" />
      <div className="animate-blob animation-delay-2000 mix-blend-multiply filter blur-2xl opacity-20 absolute -right-4 top-0 h-72 w-72 rounded-full bg-emerald-500" />
      <div className="animate-blob animation-delay-4000 mix-blend-multiply filter blur-2xl opacity-20 absolute -bottom-8 left-20 h-72 w-72 rounded-full bg-rose-500" />

      <div className="animate-fade-in-up z-10 max-w-3xl px-6 text-center">
        <div className="mb-8 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur-md">
          <Activity size={48} className="text-indigo-400" />
        </div>

        <h1 className="mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
          Vandelier AI
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-xl font-light leading-relaxed text-slate-300 md:text-2xl">
          Intelligent collection management. Automated workflows. Actionable insights.
        </p>

        <div className="mb-12 grid grid-cols-1 gap-6 text-left md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <Activity className="mb-4 text-indigo-400" size={24} />
            <h3 className="mb-2 text-lg font-semibold">Live Monitoring</h3>
            <p className="text-sm text-slate-400">Track automation workflows and KPI metrics in real-time.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <Database className="mb-4 text-emerald-400" size={24} />
            <h3 className="mb-2 text-lg font-semibold">Data Ingestion</h3>
            <p className="text-sm text-slate-400">Process Excel and CSV files locally with dynamic parsing.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <Shield className="mb-4 text-rose-400" size={24} />
            <h3 className="mb-2 text-lg font-semibold">Secure Control</h3>
            <p className="text-sm text-slate-400">Safely toggle backend bots and manage edge cases securely.</p>
          </div>
        </div>

        <button
          onClick={onEnter}
          className="group inline-flex items-center gap-3 rounded-full bg-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Enter Dashboard
          <ArrowRight className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
