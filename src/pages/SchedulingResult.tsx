import { useLocation, useNavigate } from "react-router-dom";
import type { ServerSchedule } from "../types/scheduling";
import Timeline from "../components/Scheduling/Timeline";

const SchedulingResult: React.FC = () => {
   const location = useLocation();
   const navigate = useNavigate();

   // schedule is passed in location.state.schedule (like your original)
   const schedule = (location.state as { schedule?: ServerSchedule })?.schedule;
   const weekId = (location.state as any)?.weekId ?? null;

   if (!schedule) {
      return (
         <div className="p-6 space-y-4">
            <h1 className="text-xl font-semibold">Schedule</h1>
            <p className="text-red-600">No schedule data found. Generate a schedule first.</p>
            <button onClick={() => navigate("/scheduling")} className="px-4 py-2 rounded bg-[#2563EB] text-white">
               Back to Scheduling
            </button>
         </div>
      );
   }

   return (
      <div className="p-6 space-y-6 min-h-[calc(100vh-64px)]">
         {/* Header */}
         <div className="flex items-start gap-4">
            <div className="flex-1">
               <h1 className="text-2xl font-semibold text-slate-900">Schedule {weekId ? `— ${weekId}` : ""}</h1>
               <div className="text-sm text-slate-500 mt-1">
                  Week start: {new Date(schedule.weekStartDate).toLocaleDateString(undefined, {
                     year: 'numeric',
                     month: 'long',
                     day: 'numeric'
                  })} • Last updated: {schedule.lastModifiedDate ? new Date(schedule.lastModifiedDate).toLocaleString() : "—"}
               </div>
            </div>

            <div className="flex items-center gap-3">
               <button onClick={() => {
                  // Navigate to the jobs page for the same week
                  navigate(`/scheduling/${encodeURIComponent(weekId)}/Jobs`);
               }} className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-[#1F4FD6]">
                  Manage Jobs
               </button>
            </div>
         </div>

         {/* Only Timeline (no summary / compact list) */}
         <Timeline schedule={schedule} />
      </div>
   );
};

export default SchedulingResult;
