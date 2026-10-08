export default function Home() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500 mt-1">Welcome to AegisAI. Start an audit or review recent assessments.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-600 text-sm">Active Systems</h3>
          <p className="text-4xl font-bold text-[#5C1A2B] mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-600 text-sm">Assessments in Progress</h3>
          <p className="text-4xl font-bold text-[#5C1A2B] mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-600 text-sm">Critical Findings</h3>
          <p className="text-4xl font-bold text-red-600 mt-2">0</p>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center py-20">
        <h3 className="text-xl font-medium text-slate-800">No Assessments Yet</h3>
        <p className="text-slate-500 mt-2 max-w-md">Register an AI system and start your first audit to see risk scores, security vulnerabilities, and compliance gaps.</p>
        <button className="mt-6 px-4 py-2 bg-[#5C1A2B] text-white rounded hover:bg-[#722136] transition shadow-md">
          New Assessment
        </button>
      </div>
    </div>
  );
}
