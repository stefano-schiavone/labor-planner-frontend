// contents of file
import React, { useMemo } from "react";
import type { ServerSchedule } from "../../types/scheduling";
import { normalizeDateOnlyIso, deriveGrainLength, startOfWeekIso } from "../../utils/schedulingUtils";
import { VISIBLE_MINUTES_PER_DAY, PIXELS_PER_MINUTE, LEFT_COL_WIDTH } from "../../utils/schedulingUtils";
import TimeRuler from "./TimeRuler";
import MachineRow from "./MachineRow";
import { buildMachinesFromSchedule, jobsForMachine } from "../../utils/schedulingUtils";

type Day = { iso: string; label: string };

type Props = {
   schedule: ServerSchedule;
};

const Timeline: React.FC<Props> = ({ schedule }) => {
   const grainLengthMinutes = useMemo(() => deriveGrainLength(schedule), [schedule]);

   // normalize schedule.weekStartDate and snap to Monday (UTC)
   const weekStartIso = useMemo(() => {
      const norm = normalizeDateOnlyIso(schedule?.weekStartDate ?? null);
      if (!norm) return null;
      return startOfWeekIso(norm);
   }, [schedule]);

   const days: Day[] = useMemo(() => {
      if (!weekStartIso) return [];
      return Array.from({ length: 7 }).map((_, i) => {
         const d = new Date(`${weekStartIso}T00:00:00Z`);
         d.setUTCDate(d.getUTCDate() + i + 7);
         const iso = d.toISOString().slice(0, 10);
         return { iso, label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) };
      });
   }, [weekStartIso]);

   const dayIndexMap = useMemo(() => {
      const m: Record<string, number> = {};
      days.forEach((d, i) => (m[d.iso] = i));
      return m;
   }, [days]);

   const machines = useMemo(() => buildMachinesFromSchedule(schedule), [schedule]);

   const scheduledJobs = schedule.scheduledJobList || [];

   // trackWidth computed from visible minutes per day (business hours)
   const trackWidth = useMemo(() => days.length * VISIBLE_MINUTES_PER_DAY * PIXELS_PER_MINUTE, [days.length]);

   if (!weekStartIso) {
      return <div className="p-6">No valid week start date in schedule</div>;
   }

   return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
         <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
            <div className="text-sm text-slate-500">Zoom: {Math.round(PIXELS_PER_MINUTE * 100) / 100}px/min</div>
         </div>

         {/* Single scroll container that holds the ruler + rows.
          The inner content has minWidth = LEFT_COL_WIDTH + trackWidth so horizontal scrolling works.
          The ruler will be sticky at top; the left column in ruler and rows will be sticky at left.
      */}
         <div className="max-h-[60vh] overflow-auto" style={{ overflowX: "auto" }}>
            <div style={{ minWidth: LEFT_COL_WIDTH + trackWidth }}>
               {/* Ruler row: the left "Machine" cell stays sticky horizontally (via TimeRuler) and the ruler track scrolls with the container */}
               <TimeRuler days={days} trackWidth={trackWidth} />

               {/* Rows */}
               {machines.map((m) => {
                  const machineJobs = jobsForMachine(scheduledJobs, m);
                  return (
                     <MachineRow
                        key={(m.machineUuid ?? "unassigned").toLowerCase()}
                        machine={m}
                        machineJobs={machineJobs}
                        days={days}
                        dayIndexMap={dayIndexMap}
                        trackWidth={trackWidth}
                        grainLengthMinutes={grainLengthMinutes}
                     />
                  );
               })}
            </div>
         </div>
      </div>
   );
};

export default Timeline;
