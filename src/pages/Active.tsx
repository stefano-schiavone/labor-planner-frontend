import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ServerSchedule } from "../types/scheduling";
import Timeline from "../components/Scheduling/Timeline";
import "../styles/Active.css";
import "../index.css";
import { apiFetch } from "../utils/api";

/**
 * Utilities: ISO week number + week range (Monday..next Monday) calculation.
 *
 * Uses the ISO-8601 week definition (weeks start Monday). The algorithm shifts the date
 * to the nearest Thursday and computes the week number from there.
 */
function getISOWeekInfo(date: Date): { week: number; year: number; weekStart: Date; weekEnd: Date } {
   // work in UTC to avoid timezone surprises
   const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
   // getUTCDay: 0 (Sun) .. 6 (Sat). For ISO we want Mon=1..Sun=7
   const day = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
   // shift to nearest Thursday (ISO anchor)
   d.setUTCDate(d.getUTCDate() + 4 - day);
   const year = d.getUTCFullYear();
   const yearStart = new Date(Date.UTC(year, 0, 1));
   // number of days between d and yearStart
   const days = Math.floor((d.getTime() - yearStart.getTime()) / 86400000);
   const week = Math.ceil((days + 1) / 7);

   // compute Monday of that week: take the Thursday (d) and subtract 3 days
   const thursday = new Date(d);
   const monday = new Date(thursday);
   monday.setUTCDate(thursday.getUTCDate() - 3);
   monday.setUTCHours(0, 0, 0, 0);

   const nextMonday = new Date(monday);
   nextMonday.setUTCDate(monday.getUTCDate() + 7);
   nextMonday.setUTCHours(0, 0, 0, 0);

   return { week, year, weekStart: monday, weekEnd: nextMonday };
}

function formatWeekId(week: number, year: number) {
   return `Week${week}-${year}`;
}

const Active: React.FC = () => {
   const navigate = useNavigate();

   // compute "current" week based on today (week starts Monday). If today is Sunday,
   // ISO week logic gives the previous Monday/week as expected.
   const today = useMemo(() => new Date(), []);
   const iso = useMemo(() => getISOWeekInfo(today), [today]);
   const initialWeekId = useMemo(() => formatWeekId(iso.week, iso.year), [iso.week, iso.year]);

   const [weekId] = useState<string>(initialWeekId);
   const [weekStartISO, setWeekStartISO] = useState<string>("");
   const [weekEndISO, setWeekEndISO] = useState<string>("");
   const [schedule, setSchedule] = useState<ServerSchedule | null>(null);
   const [loading, setLoading] = useState<boolean>(true);
   const [error, setError] = useState<string | null>(null);
   const [generating, setGenerating] = useState(false);

   useEffect(() => {
      // compute ISO week range (start/end as ISO strings)
      const { weekStart, weekEnd } = getISOWeekInfo(today);
      setWeekStartISO(weekStart.toISOString());
      setWeekEndISO(weekEnd.toISOString());
   }, [today]);

   useEffect(() => {
      let canceled = false;
      async function load() {
         setLoading(true);
         setError(null);
         setSchedule(null);
         try {
            const resp = await apiFetch("/api/schedules/for-week", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ weekStart: weekStartISO, weekEnd: weekEndISO }),
            });
            if (!resp.ok) {
               const txt = await resp.text().catch(() => "");
               throw new Error(`Request failed: ${resp.status} ${txt}`);
            }
            const data = await resp.json();
            if (!canceled) {
               if (data.exists) {
                  setSchedule(data.schedule ?? null);
               } else {
                  setSchedule(null);
               }
            }
         } catch (err: any) {
            if (!canceled) {
               console.error(err);
               setError("Failed to load active schedule.");
            }
         } finally {
            if (!canceled) setLoading(false);
         }
      }

      // don't call until we have weekStart/weekEnd
      if (weekStartISO && weekEndISO) load();

      return () => {
         canceled = true;
      };
   }, [weekStartISO, weekEndISO]);

   // UI handlers
   const handleManageJobs = () => {
      navigate(`/scheduling/${encodeURIComponent(weekId)}/Jobs`);
   };

   const handleViewFullSchedule = () => {
      // reuse the SchedulingView route which expects state
      if (!schedule) return;
      navigate("/scheduling/view", {
         state: { schedule, weekId },
      });
   };

   return (
      <main className="p-6 space-y-6 min-h-[calc(100vh-64px)]">
         <div className="flex items-start justify-between gap-4">
            <div>
               <h1 className="text-2xl font-semibold text-slate-900">Active — {weekId}</h1>
               <div className="text-sm text-slate-500 mt-1">
                  Week start: {weekStartISO ? new Date(weekStartISO).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"}
               </div>
            </div>

            <div className="flex items-center gap-3">
               <button onClick={handleManageJobs} className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-[#1F4FD6]">
                  Manage Jobs
               </button>

               <button onClick={handleViewFullSchedule} className="px-3 py-1.5 rounded-lg bg-[#10B981] text-white hover:bg-[#0ea66f]" disabled={!schedule}>
                  Open schedule view
               </button>
            </div>
         </div>

         <section>
            {loading && <div className="text-sm text-slate-500">Loading active schedule…</div>}
            {!loading && error && <div className="text-sm text-red-600">{error}</div>}

            {!loading && !error && schedule && (
               <div>
                  {/* render the schedule inline just like SchedulingView */}
                  <Timeline schedule={schedule} />
               </div>
            )}

            {!loading && !error && !schedule && (
               <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">No schedule for this week</h2>
                  <p className="text-sm text-slate-500 mb-4">
                     There is no saved schedule for the current week ({weekId}). You can generate a schedule or manage candidate jobs for this week.
                  </p>

                  <div className="flex gap-3">
                     <button onClick={handleManageJobs} className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-[#1F4FD6]">
                        Manage Jobs for this week
                     </button>

                     <button
                        onClick={async () => {
                           setGenerating(true)
                           // attempt to generate a schedule and navigate to result if success
                           try {
                              const res = await apiFetch("/api/schedules/solve-for-week", {
                                 method: "POST",
                                 headers: { "Content-Type": "application/json" },
                                 body: JSON.stringify({ weekStart: weekStartISO, weekEnd: weekEndISO }),
                              });
                              if (!res.ok) {
                                 const txt = await res.text().catch(() => "");
                                 if (txt.includes("No jobs found for selected week")) {
                                    window.alert("No jobs for this week");
                                    setGenerating(false)
                                 } else {
                                    throw new Error(txt || `Failed (${res.status})`);
                                 }
                                 return;
                              }
                              const data = await res.json();
                              if (data.exists) {
                                 // navigate to schedule view page
                                 navigate("/scheduling/view", { state: { schedule: data.schedule, scheduledJobs: data.scheduledJobs ?? [], startISO: weekStartISO, endISO: weekEndISO, weekId } });
                              } else {
                                 // no schedule created — navigate to jobs page instead (candidate jobs)
                                 navigate(`/scheduling/${encodeURIComponent(weekId)}/Jobs`, { state: { candidateJobs: data.candidateJobs ?? [], startISO: weekStartISO, endISO: weekEndISO } });
                              }
                           } catch (err) {
                              console.error(err);
                              window.alert("Failed to generate schedule for this week.");
                           }
                           setGenerating(false)
                        }}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-[#1F4FD6]"
                     >
                        {generating && (
                           <svg
                              className="animate-spin h-4 w-4 mr-2 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                           >
                              <circle
                                 className="opacity-25"
                                 cx="12"
                                 cy="12"
                                 r="10"
                                 stroke="currentColor"
                                 strokeWidth="4"
                              ></circle>
                              <path
                                 className="opacity-75"
                                 fill="currentColor"
                                 d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8h4l-3 3 3 3h-4z"
                              ></path>
                           </svg>
                        )}
                        {generating ? "Generating…" : "Generate schedule for this week"}
                     </button>
                  </div>
               </div>
            )}
         </section>
      </main>
   );
};

export default Active;
