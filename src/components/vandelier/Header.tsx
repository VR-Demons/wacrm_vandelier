"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

export function Header() {
  const [isBotActive, setIsBotActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingState, setPendingState] = useState(false);

  const handleToggleClick = () => {
    setPendingState(!isBotActive);
    setShowModal(true);
  };

  const confirmToggle = () => {
    setIsBotActive(pendingState);
    setShowModal(false);
    // Ideally this will call the n8n webhook to activate/deactivate
  };

  return (
    <>
      <header className="sticky top-0 z-40 mb-8 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
            <span className="text-xl font-bold text-white">V</span>
          </div>
          <div>
            <h1 className="leading-tight text-xl font-bold text-slate-800">Vandelier AI</h1>
            <p className="text-xs font-medium text-slate-500">Control Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold ${isBotActive ? "text-green-600" : "text-slate-500"}`}
            >
              {isBotActive ? "Bot Active" : "Bot Paused"}
            </span>
            <button
              onClick={handleToggleClick}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${
                isBotActive ? "bg-green-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isBotActive ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 animate-fade-in-up rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-slate-900">
              {pendingState ? "Activate" : "Deactivate"} Bot?
            </h3>
            <p className="mb-6 text-slate-600">
              Are you sure you want to {pendingState ? "activate" : "deactivate"} the n8n automation workflow?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg px-4 py-2 font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggle}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-colors ${
                  pendingState
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {pendingState ? <Check size={18} /> : <X size={18} />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
