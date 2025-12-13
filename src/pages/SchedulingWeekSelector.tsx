import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * SchedulingWeekSelector
 *
 * Prominent, vertically-centered week picker. When the user confirms a week:
 * - It queries the backend to check whether a schedule exists for that week.
 * - If a schedule exists it navigates to /scheduling/result and passes the schedule + week bounds
 *   in navigation state so you can render the generated schedule there.
 * - If no schedule exists it navigates to /scheduling/{weekId}/Jobs so the Jobs page can show
 *   candidate jobs (by deadline) and let the user create / manage jobs for that week.
 *
 * This keeps the UX bookmarkable and ensures the initial choice determines the next page.
 */
const SchedulingWeekSelector: React.FC = () => {
   const navigate = useNavigate();

   const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
      const now = new Date();
      const { week, year } = getISOWeek(now);
      return `Week${week}-${year}`;
   });

   const [loading, setLoading] = useState(false);

   function getISOWeek(date: Date): { week: number; year: number } {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const day = d.getUTCDay() || 7; // Monday=1...Sunday=7

      // Shift to nearest Thursday (ISO anchor)
      d.setUTCDate(d.getUTCDate() + 4 - day);

      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const week = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);

      return { week, year: d.getUTCFullYear() };
   }

   function getWeekRangeISO(week: number, year: number): { startISO: string; endISO: string; startDate: Date; endDate: Date } {
      // Algorithm: find Thursday of the desired week, then subtract 3 days to get Monday.
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const dayOfWeekJan4 = jan4.getUTCDay() || 7; // Mon=1..Sun=7
      const thursdayOfWeek1 = new Date(jan4);
      thursdayOfWeek1.setUTCDate(jan4.getUTCDate() + (4 - dayOfWeekJan4));

      const thursdayOfRequestedWeek = new Date(thursdayOfWeek1);
      thursdayOfRequestedWeek.setUTCDate(thursdayOfWeek1.getUTCDate() + (week - 1) * 7);

      const monday = new Date(thursdayOfRequestedWeek);
      monday.setUTCDate(thursdayOfRequestedWeek.getUTCDate() - 3);
      monday.setUTCHours(0, 0, 0, 0);

      const nextMonday = new Date(monday);
      nextMonday.setUTCDate(monday.getUTCDate() + 7);
      nextMonday.setUTCHours(0, 0, 0, 0);

      return { startISO: monday.toISOString(), endISO: nextMonday.toISOString(), startDate: monday, endDate: nextMonday };
   }

   const weekOptions = useMemo(() => {
      const options: { value: string; label: string }[] = [];
      const firstWeekStart = getISOWeekStart(new Date());
      for (let i = 0; i < 8; i++) {
         const d = new Date(firstWeekStart);
         d.setDate(firstWeekStart.getDate() + i * 7);
         const { week, year } = getISOWeek(d);
         const isoId = `Week${week}-${year}`;
         const label = `Week ${week} (${year}) – ${d.toDateString()}`;
         options.push({ value: isoId, label });
      }
      return options;
   }, []);

   function getISOWeekStart(date: Date): Date {
      const d = new Date(date);
      const day = d.getDay(); // Sunday=0..Saturday=6
      const diff = day === 0 ? -6 : 1 - day; // shift to Monday
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
   }

   function parseISOWeekId(id: string): { week: number; year: number } | null {
      // Expect formats like "Week46-2025"
      const match = /^Week(\d+)-(\d{4})$/.exec(id);
      if (!match) return null;
      return {
         week: parseInt(match[1], 10),
         year: parseInt(match[2], 10),
      };
   }


   const handleConfirm = async () => {
   const weekId = selectedWeekStart;
   const iso = parseISOWeekId(weekId);
   let weekStartISO = "";
   let weekEndISO = "";

   if (iso) {
      const { startISO, endISO } = getWeekRangeISO(iso.week, iso.year);
      weekStartISO = startISO;
      weekEndISO = endISO;
   }

   setLoading(true);
   try {
            const res = await fetch("/api/schedules/for-week", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weekStart: weekStartISO, weekEnd: weekEndISO }),
            });

            if (!res.ok) throw new Error("Failed to check schedule");

            const data = await res.json();

            if (data.exists) {
    navigate("/scheduling/view", {
        state: { schedule: data.schedule, scheduledJobs: data.scheduledJobs ?? [], startISO: weekStartISO, endISO: weekEndISO, weekId: selectedWeekStart },
    });
} else {
    navigate(`/scheduling/${encodeURIComponent(selectedWeekStart)}/Jobs`, {
        state: { candidateJobs: data.candidateJobs ?? [], startISO: weekStartISO, endISO: weekEndISO },
    });
}
        } catch (err) {
            console.error(err);
            alert("Failed to check schedule. Please try again.");
        } finally {
            setLoading(false);
        }
};


   return (
      <div className="overflow-hidden px-4 py-6 min-h-[calc(100vh-48px)] flex flex-col">
         <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold">Scheduling</h1>
         </div>

         {/* vertically centered area */}
         <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-2xl px-4">
               <div className="bg-white border border-slate-200 rounded-2xl px-8 py-12 shadow-sm flex flex-col items-stretch gap-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                     <label htmlFor="week" className="text-base text-slate-700 w-full md:w-auto">
                        Select a week
                     </label>

                     <div className="relative flex-1">
                        {/* keep the simple native control here or reuse your Combobox — it's fine to keep the Combobox in your app */}
                        <select
                           id="week"
                           value={selectedWeekStart}
                           onChange={(e) => setSelectedWeekStart(e.target.value)}
                           className="
                    appearance-none
                    w-full
                    pr-10
                    pl-4
                    py-3
                    text-base
                    bg-white/80
                    backdrop-blur-sm
                    border
                    border-slate-200
                    rounded-2xl
                    shadow-sm
                    hover:shadow
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[rgba(37,99,235,0.14)]
                    transition
                    duration-150
                    ease-in-out
                  "
                           aria-label="Select week"
                        >
                           {weekOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                 {opt.label}
                              </option>
                           ))}
                        </select>

                        <svg
                           className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                           width="18"
                           height="18"
                           viewBox="0 0 24 24"
                           fill="none"
                           xmlns="http://www.w3.org/2000/svg"
                           aria-hidden
                        >
                           <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                     </div>

                     <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`inline-flex items-center px-5 py-3 bg-[#2563EB] text-white rounded-lg text-sm md:text-base hover:bg-[#1F4FD6] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#60A5FA] ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                     >
                        {loading ? "Checking…" : "Confirm"}
                     </button>
                  </div>

                  <p className="mt-2 text-sm text-slate-500 text-center">
                     After confirming a week you'll be taken to the schedule if one exists, or to the Jobs page to manage candidate jobs for that week.
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default SchedulingWeekSelector;
