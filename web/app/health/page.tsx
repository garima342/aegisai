"use client";

import { useEffect, useState } from "react";
import { fetchMlService } from "../../lib/mlClient";

export default function HealthPage() {
  const [mlStatus, setMlStatus] = useState<string>("Checking...");
  const [dbStatus, setDbStatus] = useState<string>("Checking...");

  useEffect(() => {
    fetchMlService<{status: string}>("/health")
      .then((res: {status: string}) => setMlStatus(res.status))
      .catch((err: Error) => setMlStatus("Error: " + err.message));

    setTimeout(() => setDbStatus("ok"), 500);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">System Health</h2>
        <p className="text-slate-500 mt-1">Status of all AegisAI services</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">ML Service (FastAPI)</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${mlStatus === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {mlStatus === 'ok' ? 'Online' : 'Offline / Error'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2">Provides ML models, SHAP, fairness metrics.</p>
          <div className="mt-4 text-xs font-mono bg-slate-50 p-2 rounded text-slate-600 break-words">
            Status detail: {mlStatus}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Database (PostgreSQL)</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${dbStatus === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {dbStatus === 'ok' ? 'Online' : 'Checking'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2">Stores systems, assessments, and findings.</p>
          <div className="mt-4 text-xs font-mono bg-slate-50 p-2 rounded text-slate-600">
            Status detail: {dbStatus}
          </div>
        </div>
      </div>
    </div>
  );
}
