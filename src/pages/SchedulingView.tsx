import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ServerSchedule, ScheduledJob, ServerJob } from "../types/scheduling";
import Timeline from "../components/Scheduling/Timeline";
import { deriveGrainLength, buildMachinesFromSchedule, formatTimeFromMinutes, normalizeDateOnlyIso } from "../utils/schedulingUtils";
import {
   VISIBLE_MINUTES_PER_DAY,
   BUSINESS_START_MINUTES,
} from "../utils/schedulingUtils";

const StatCard: React.FC<{ title: string; value: React.ReactNode; hint?: string }> = ({ title, value, hint }) => (
   <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
   </div>
);

const SchedulingView: React.FC = () => {
   const location = useLocation();
   const navigate = useNavigate();

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

   const grainLengthMinutes = useMemo(() => deriveGrainLength(schedule), [schedule]);

   const weekStartIso = useMemo(() => {
      const raw = normalizeDateOnlyIso(schedule.weekStartDate ?? null);
      return raw ?? schedule.weekStartDate;
   }, [schedule]);

   // Calculate All Week Jobs
   const [allWeekJobs, setAllWeekJobs] = useState<ServerJob[]>([]);


   // WEEK START AND END CALCULATION
   const weekStartISO = useMemo(() => {
      const raw = normalizeDateOnlyIso(schedule.weekStartDate ?? null);
      if (!raw) return null;

      const d = new Date(`${raw}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 1); // add 1 day to week start
      return d.toISOString();
   }, [schedule]);

   const weekEndISO = useMemo(() => {
      if (!weekStartISO) return null;

      const d = new Date(weekStartISO);
      d.setUTCDate(d.getUTCDate() + 7);
      return d.toISOString();
   }, [weekStartISO]);
   // FIX: INSANE BAND AID

   useEffect(() => {
      if (!weekStartISO || !weekEndISO) return;

      fetch(
         `/api/jobs/by-deadline?start=${encodeURIComponent(weekStartISO)}&end=${encodeURIComponent(weekEndISO)}`
      )
         .then(res => (res.ok ? res.json() : []))
         .then(setAllWeekJobs)
         .catch(() => setAllWeekJobs([]));
   }, [weekStartISO, weekEndISO]);

   const machines = useMemo(() => buildMachinesFromSchedule(schedule), [schedule]);

   const totalJobs = (schedule.scheduledJobList || []).length;
   const totalMachines = machines.length;
   const createdBy = schedule.createdByUser ? `${schedule.createdByUser.name ?? ""} ${schedule.createdByUser.lastName ?? ""}`.trim() : "—";

   const { totalMinutes, avgMinutes, assignedCount, unassignedCount, utilizationPercent } = useMemo(() => {
      const sj = schedule.scheduledJobList ?? [];
      let total = 0;
      let assigned = 0;
      for (const s of sj) {
         const duration =
            s.job?.durationMinutes ??
            (s.durationInGrains != null ? s.durationInGrains * grainLengthMinutes : 0);
         total += duration;
         if (s.assignedMachine?.machineUuid) assigned += 1;
      }
      const avg = sj.length > 0 ? Math.round(total / sj.length) : 0;
      const unassigned = allWeekJobs.length - sj.length;
      const totalAvailable = Math.max(1, machines.length) * VISIBLE_MINUTES_PER_DAY;
      const util = Math.round((total / totalAvailable) * 100);
      return { totalMinutes: total, avgMinutes: avg, assignedCount: assigned, unassignedCount: unassigned, utilizationPercent: util };
   }, [schedule, grainLengthMinutes, machines.length, allWeekJobs]);

   // Prepare scheduled jobs list for the right column
   const scheduledList = useMemo(() => {
      const list = (schedule.scheduledJobList || []).slice();
      list.sort((a: ScheduledJob, b: ScheduledJob) => {
         const da = normalizeDateOnlyIso(a.startingTimeGrain?.date ?? "") ?? "";
         const db = normalizeDateOnlyIso(b.startingTimeGrain?.date ?? "") ?? "";
         if (da !== db) return da.localeCompare(db);
         const ga = a.startingTimeGrain?.startingMinuteOfDay ?? 0;
         const gb = b.startingTimeGrain?.startingMinuteOfDay ?? 0;
         return ga - gb;
      });
      return list;
   }, [schedule]);

   return (
      <div className="p-6 space-y-6 min-h-[calc(100vh-64px)]">
         {/* Header */}
         <div className="flex items-start gap-4">
            <div className="flex-1">
               <h1 className="text-2xl font-semibold text-slate-900">Schedule {weekId ? `— ${weekId}` : ""}</h1>
               <div className="text-sm text-slate-500 mt-1">
                  Week start: {weekStartIso ? new Date(`${weekStartIso}T00:00:00Z`).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"} • Last updated: {schedule.lastModifiedDate ? new Date(schedule.lastModifiedDate).toLocaleString() : "—"} • Created by: {createdBy}
               </div>
            </div>

            <div className="flex items-center gap-3">
               <button onClick={() => navigate('/scheduling')} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50">
                  Back
               </button>
               <button onClick={() => navigate(`/scheduling/${encodeURIComponent(weekId)}/Jobs`)} className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-[#1F4FD6]">
                  Manage Jobs
               </button>
            </div>
         </div>

         {/* Summary / Insights (Apple-style cards) */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Jobs scheduled" value={<span>{totalJobs}</span>} hint={`${assignedCount} assigned • ${unassignedCount} unassigned`} />
            <StatCard title="Total scheduled time" value={<span>{totalMinutes} min</span>} hint={`Avg ${avgMinutes} min / job`} />
            <StatCard title="Machines" value={<span>{totalMachines}</span>} hint="Available this schedule" />
            <StatCard title="Utilization" value={<span>{utilizationPercent}%</span>} hint="Percent of business-hours used" />
         </div>

         {/* Main content: Timeline + Scheduled jobs aside */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline (left, spans 2 columns on large screens) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
               <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-slate-900">Machine timeline</h2>
                  <div className="text-sm text-slate-500">Grain: {grainLengthMinutes} min</div>
               </div>

               <div>
                  <Timeline schedule={schedule} />
               </div>
            </div>

            {/* Right column: Scheduled jobs */}
            <aside className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
               <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">Scheduled jobs</h3>
                  <div className="text-sm text-slate-500">{totalJobs}</div>
               </div>

               <div className="space-y-2 max-h-[60vh] overflow-auto pr-2">
                  {scheduledList.length === 0 && <div className="text-sm text-slate-500">No scheduled jobs for this week.</div>}

                  {scheduledList.map((sj) => {
                     const relStart = sj.startingTimeGrain?.startingMinuteOfDay ?? 0; // relative to business window
                     const displayStartMin = BUSINESS_START_MINUTES + relStart;
                     const displayTime = formatTimeFromMinutes(displayStartMin);
                     const day = sj.startingTimeGrain?.date ? normalizeDateOnlyIso(sj.startingTimeGrain.date) ?? sj.startingTimeGrain.date : "—";
                     const durationMins = sj.job?.durationMinutes ?? (sj.durationInGrains != null ? sj.durationInGrains * grainLengthMinutes : 0);

                     return (
                        <div key={sj.scheduledJobUuid} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 hover:shadow-sm transition-shadow">
                           <div className="w-9 h-9 rounded-md bg-[rgba(37,99,235,0.12)] text-[#2563EB] flex items-center justify-center font-semibold text-sm">
                              {sj.job?.name?.charAt(0).toUpperCase() ?? "J"}
                           </div>

                           <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900 truncate">{sj.job?.name}</div>
                              <div className="text-xs text-slate-500 truncate">
                                 {sj.assignedMachine?.name ?? "Unassigned"} • {day} • {displayTime}
                              </div>
                           </div>

                           <div className="text-right">
                              <div className="text-sm font-semibold text-slate-900">{durationMins}m</div>
                              <div className="text-xs text-slate-500">{sj.job?.requiredMachineTypeUuid ? "Spec" : ""}</div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </aside>
         </div>
      </div>
   );
};

export default SchedulingView;
