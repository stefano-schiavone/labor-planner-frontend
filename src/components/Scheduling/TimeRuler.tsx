import React from "react";
import { VISIBLE_MINUTES_PER_DAY, BUSINESS_START_MINUTES, BUSINESS_END_MINUTES } from "../../utils/schedulingUtils";

type Day = { iso: string; label: string };

type Props = {
   days: Day[];
   trackWidth: number;
   pixelsPerMinute: number;
};

/*
  TimeRuler is now part of the same scroll container as the rows.
  - left cell is sticky horizontally (position: sticky; left:0)
  - the ruler wrapper is sticky vertically (position: sticky; top:0) so it stays visible when scrolling vertically
*/
const TimeRuler: React.FC<Props> = ({ days, trackWidth, pixelsPerMinute }) => {
   const startHour = Math.floor(BUSINESS_START_MINUTES / 60);
   const endHour = Math.floor(BUSINESS_END_MINUTES / 60); // 18
   const hoursCount = endHour - startHour; // 11

   return (
      <div className="flex border-b border-slate-100" style={{ position: "relative" }}>
         {/* Left column (sticky horizontally) */}
         <div
            style={{ width: 200, minWidth: 200, position: "sticky", left: 0, zIndex: 30, background: "white" }}
            className="px-3 py-2 text-sm text-slate-500 border-r border-slate-100"
         >
            Machine
         </div>

         {/* Track area (part of the scrolling content). The whole ruler wrapper is sticky at top. */}
         <div
            style={{ minWidth: trackWidth, position: "sticky", top: 0, zIndex: 20, background: "white" }}
            className="relative"
         >
            <div className="absolute top-0 left-0 h-8 w-full">
               {days.map((d, i) => {
                  const left = i * VISIBLE_MINUTES_PER_DAY * pixelsPerMinute;
                  return (
                     <div
                        key={d.iso}
                        className="absolute text-xs font-medium text-slate-700 px-2"
                        style={{ left: left + 6, width: VISIBLE_MINUTES_PER_DAY * pixelsPerMinute }}
                     >
                        {d.label}
                     </div>
                  );
               })}
            </div>

            <div className="absolute top-8 left-0 right-0 h-6">
               {days.map((d, dayIdx) => {
                  // for each day, render hour ticks within business window
                  return Array.from({ length: hoursCount + 1 }).map((_, hIdx) => {
                     const hour = startHour + hIdx;
                     const minutesFromWindowStart = hour * 60 - BUSINESS_START_MINUTES;
                     const left = (dayIdx * VISIBLE_MINUTES_PER_DAY + minutesFromWindowStart) * pixelsPerMinute;
                     const isDayStart = hIdx === 0;
                     return <div key={`${d.iso}-${hour}`} style={{ left }} className={`absolute top-0 ${isDayStart ? "bg-slate-200" : "bg-slate-100"} w-px h-6`} />;
                  });
               })}

               {days.map((d, dayIdx) => {
                  return Array.from({ length: hoursCount }).map((_, idx) => {
                     const hour = startHour + idx;
                     const left = (dayIdx * VISIBLE_MINUTES_PER_DAY + (hour * 60 - BUSINESS_START_MINUTES)) * pixelsPerMinute;
                     const label = String(hour % 24).padStart(2, "0") + ":00";
                     return (
                        <div key={`${d.iso}-lbl-${hour}`} style={{ left }} className="absolute top-0 text-[11px] text-slate-400 px-1">
                           {label}
                        </div>
                     );
                  });
               })}
            </div>
         </div>
      </div>
   );
};

export default TimeRuler;
