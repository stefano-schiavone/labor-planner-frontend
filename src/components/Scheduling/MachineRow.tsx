import React from "react";
import type { Machine, ScheduledJob } from "../../types/scheduling";
import {
   LEFT_COL_WIDTH,
   ROW_HEIGHT,
   VISIBLE_MINUTES_PER_DAY,
   BUSINESS_START_MINUTES,
} from "../../utils/schedulingUtils";
import { normalizeDateOnlyIso, formatTimeFromMinutes } from "../../utils/schedulingUtils";

type Day = { iso: string; label: string };

type Props = {
   machine: Machine;
   machineJobs: ScheduledJob[];
   days: Day[];
   dayIndexMap: Record<string, number>;
   trackWidth: number;
   grainLengthMinutes: number;
   pixelsPerMinute: number;
};

/*
  MachineRow now renders its left column as sticky left:0 so the left column remains visible
  while the track scrolls horizontally inside the shared scroll container.
*/
const MachineRow: React.FC<Props> = ({ machine, machineJobs, days, dayIndexMap, trackWidth, grainLengthMinutes, pixelsPerMinute }) => {
   const machineId = (machine?.machineUuid ?? "unassigned").toLowerCase();

   return (
      <div key={machineId} className="flex items-center border-b last:border-b-0 border-slate-100">
         {/* Left column (sticky horizontally) */}
         <div
            style={{ width: LEFT_COL_WIDTH, minWidth: LEFT_COL_WIDTH, position: "sticky", left: 0, zIndex: 10, background: "white" }}
            className="flex items-center gap-3 px-3 py-3"
         >
            <div className="w-10 h-10 rounded-md bg-[rgba(37,99,235,0.12)] text-[#2563EB] flex items-center justify-center font-semibold">
               {machine.name ? machine.name.charAt(0).toUpperCase() : "M"}
            </div>
            <div className="min-w-0">
               <div className="font-medium text-slate-900 truncate">{machine.name ?? "Unnamed"}</div>
               <div className="text-xs text-slate-500 truncate">{machine.type?.name ?? machine.description ?? ""}</div>
            </div>
         </div>

         {/* Track area */}
         <div className="relative" style={{ height: ROW_HEIGHT, flex: `0 0 ${trackWidth}px` }}>
            <div className="absolute inset-0 flex">
               {days.map((_, i) => (
                  <div key={i} style={{ width: VISIBLE_MINUTES_PER_DAY * pixelsPerMinute }} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"} />
               ))}
            </div>

            {Array.from({ length: days.length + 1 }).map((_, i) => {
               const left = i * VISIBLE_MINUTES_PER_DAY * pixelsPerMinute;
               return <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-200" style={{ left }} />;
            })}

            {machineJobs.map((sj) => {
               const rawDay = normalizeDateOnlyIso(sj.startingTimeGrain?.date ?? null) ?? days[0]?.iso;
               const dayIndex = typeof dayIndexMap[rawDay] === "number" ? dayIndexMap[rawDay] : 0;
               const clampedDayIndex = Math.max(0, Math.min(days.length - 1, dayIndex));

               // startingMinuteOfDay is relative to business window (0 => BUSINESS_START_MINUTES)
               const startRelative = sj.startingTimeGrain?.startingMinuteOfDay ?? 0;
               const durationMinutes =
                  sj.job?.durationMinutes ??
                  (sj.durationInGrains != null ? sj.durationInGrains * grainLengthMinutes : Math.min(8 * 60, VISIBLE_MINUTES_PER_DAY));

               const jobStartRel = startRelative;
               const jobEndRel = jobStartRel + durationMinutes;

               // compute visible intersection with business window (in relative minutes)
               const visibleStartRel = Math.max(0, jobStartRel);
               const visibleEndRel = Math.min(VISIBLE_MINUTES_PER_DAY, jobEndRel);

               // if the job is completely outside the business window, skip rendering
               if (visibleEndRel <= visibleStartRel) return null;

               // left is relative to day block (which starts at business-window start)
               const dayBase = clampedDayIndex * VISIBLE_MINUTES_PER_DAY;
               const leftWithinVisible = visibleStartRel;
               const left = (dayBase + leftWithinVisible) * pixelsPerMinute;

               const visibleDuration = visibleEndRel - visibleStartRel;
               const width = Math.max(10, visibleDuration * pixelsPerMinute);

               const maxWidth = Math.max(0, (days.length * VISIBLE_MINUTES_PER_DAY * pixelsPerMinute) - left);
               const finalWidth = Math.min(width, maxWidth);

               // convert displayed time back to clock minutes by adding BUSINESS_START_MINUTES
               const displayStartClockMin = BUSINESS_START_MINUTES + Math.max(0, jobStartRel);
               const displayStartClockForVisible = BUSINESS_START_MINUTES + visibleStartRel;
               // const displayEndClockMin = BUSINESS_START_MINUTES + visibleEndRel;

               return (
                  <div
                     key={sj.scheduledJobUuid}
                     className="absolute top-3 rounded-md text-white text-xs font-medium overflow-hidden shadow"
                     style={{
                        left,
                        width: finalWidth,
                        height: ROW_HEIGHT - 18,
                        background: "#2563EB",
                        padding: "6px 8px",
                     }}
                     title={`${sj.job?.name} — ${rawDay} ${formatTimeFromMinutes(displayStartClockMin)} • ${durationMinutes}m`}
                  >
                     <div className="truncate">{sj.job?.name}</div>
                     <div className="text-[11px] opacity-90 truncate">{formatTimeFromMinutes(displayStartClockForVisible)} • {formatTimeFromMinutes(BUSINESS_START_MINUTES + visibleEndRel)}</div>
                  </div>
               );
            })}
         </div>
      </div>
   );
};

export default MachineRow;
