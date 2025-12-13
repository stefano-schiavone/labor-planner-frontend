import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SchedulingView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // The schedule was passed via navigate(..., { state: { schedule } })
  const schedule = (location.state as { schedule?: any })?.schedule;
  const weekId = location.state?.weekId;

  if (!schedule) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Scheduling Result</h1>
        <p className="text-red-600">
          No schedule data found. Please generate a schedule first.
        </p>
        <button
          onClick={() => navigate("/scheduling")}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Back to Scheduling
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Current {weekId} Schedule</h1>

      {/* Pretty-printed JSON */}
      <pre className="bg-slate-100 border border-slate-300 rounded p-4 overflow-auto text-sm">
        {JSON.stringify(schedule, null, 2)}
      </pre>

      <button
  onClick={() => {
    // Navigate to the jobs page for the same week
      navigate(`/scheduling/${encodeURIComponent(weekId)}/Jobs`);
  }}
  className="px-4 py-2 rounded bg-blue-600 text-white"
>
  Back to Scheduling
</button>
    </div>
  );
};

export default SchedulingView;

