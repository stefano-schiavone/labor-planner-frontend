import React, { useMemo, useState, useEffect } from "react";
import type { ServerSchedule, ScheduledJob, StartingTimeGrain } from "../../types/scheduling";
import { normalizeDateOnlyIso, deriveGrainLength, startOfWeekIso } from "../../utils/schedulingUtils";
import {
   VISIBLE_MINUTES_PER_DAY,
   LEFT_COL_WIDTH,
   DEFAULT_PIXELS_PER_MINUTE,
   MIN_PIXELS_PER_MINUTE,
   MAX_PIXELS_PER_MINUTE,
   BUSINESS_START_MINUTES,
} from "../../utils/schedulingUtils";
import TimeRuler from "./TimeRuler";
import MachineRow from "./MachineRow";
import { buildMachinesFromSchedule, jobsForMachine } from "../../utils/schedulingUtils";
import JobPopover from "./JobPopover";

type Day = { iso: string; label: string };

type Props = {
   schedule: ServerSchedule;
};

const clamp = (v: number) => Math.min(MAX_PIXELS_PER_MINUTE, Math.max(MIN_PIXELS_PER_MINUTE, v));

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

   // ----- Normalize scheduled jobs so MachineRow can rely on startingTimeGrain being populated and relative -----
   const normalizedScheduledJobs = useMemo(() => {
      // helper: normalize an incoming grain object
      function normalizeGrain(raw?: Partial<StartingTimeGrain> | null): StartingTimeGrain | undefined {
         if (!raw) return undefined;
         const dateIso = normalizeDateOnlyIso(raw.date ?? null) ?? null;
         // prefer provided startingMinuteOfDay if given, otherwise derive from grainIndex
         let startingMinuteOfDay = typeof raw.startingMinuteOfDay === "number" ? raw.startingMinuteOfDay : undefined;
         if (startingMinuteOfDay == null && typeof raw.grainIndex === "number") {
            startingMinuteOfDay = Math.round(raw.grainIndex * grainLengthMinutes);
         }
         if (startingMinuteOfDay == null) return undefined;

         // If server supplied absolute minutes-of-day (e.g. 480) convert to relative-to-business-window
         // so 0 corresponds to BUSINESS_START_MINUTES in the UI math.
         let relative = startingMinuteOfDay;
         if (startingMinuteOfDay >= BUSINESS_START_MINUTES && startingMinuteOfDay <= BUSINESS_START_MINUTES + VISIBLE_MINUTES_PER_DAY) {
            relative = startingMinuteOfDay - BUSINESS_START_MINUTES;
         } else if (startingMinuteOfDay > VISIBLE_MINUTES_PER_DAY && startingMinuteOfDay < BUSINESS_START_MINUTES) {
            // some weird values: clamp into visible window conservatively
            relative = Math.max(0, Math.min(VISIBLE_MINUTES_PER_DAY, startingMinuteOfDay - BUSINESS_START_MINUTES));
         }
         // clamp to visible day range
         relative = Math.max(-1440, Math.min(1440, relative));
         return {
            grainIndex: raw.grainIndex ?? Math.floor(relative / Math.max(1, grainLengthMinutes)),
            startingMinuteOfDay: relative,
            date: dateIso ?? "",
         } as StartingTimeGrain;
      }

      return scheduledJobs.map((sj) => {
         // look in multiple places for the assigned/starting info
         const candidate =
            sj.startingTimeGrain ??
            // job may carry the assigned grain (some API shapes)
            (sj.job as any)?.assignedTimeGrain ??
            (sj as any)?.assignedTimeGrain ??
            undefined;

         const norm = normalizeGrain(candidate as any) ?? undefined;

         // produce a shallow copy but with startingTimeGrain set if we found one
         return {
            ...sj,
            // if sj.startingTimeGrain was missing, set it from computed norm; otherwise keep original
            startingTimeGrain: sj.startingTimeGrain ?? norm ?? undefined,
         } as ScheduledJob;
      });
   }, [scheduledJobs, grainLengthMinutes]);

   // Zoom state (pixels per minute)
   const [pixelsPerMinute, setPixelsPerMinute] = useState<number>(DEFAULT_PIXELS_PER_MINUTE);

   const zoomIn = () => setPixelsPerMinute((p) => clamp(Math.round((p + 0.1) * 100) / 100));
   const zoomOut = () => setPixelsPerMinute((p) => clamp(Math.round((p - 0.1) * 100) / 100));
   const resetZoom = () => setPixelsPerMinute(DEFAULT_PIXELS_PER_MINUTE);
   const onSlider = (v: number) => setPixelsPerMinute(clamp(v));

   // trackWidth computed from visible minutes per day (business hours) and current zoom
   const trackWidth = useMemo(() => days.length * VISIBLE_MINUTES_PER_DAY * pixelsPerMinute, [days.length, pixelsPerMinute]);

   if (!weekStartIso) {
      return <div className="p-6">No valid week start date in schedule</div>;
   }

   // Popover state: selected job + anchor rect in viewport coordinates
   const [selected, setSelected] = useState<{ job: ScheduledJob; anchorRect: DOMRect } | null>(null);

   // Close on escape
   useEffect(() => {
      function onKey(e: KeyboardEvent) {
         if (e.key === "Escape") setSelected(null);
      }
      if (selected) {
         document.addEventListener("keydown", onKey);
         return () => document.removeEventListener("keydown", onKey);
      }
   }, [selected]);

   // Handler passed to MachineRow
   const handleJobClick = (job: ScheduledJob, anchorRect: DOMRect) => {
      setSelected({ job, anchorRect });
   };

   return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative">
         <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>

            <div className="flex items-center gap-3">
               <div className="text-sm text-slate-500 mr-3">
                  Zoom: {(Math.round((pixelsPerMinute / DEFAULT_PIXELS_PER_MINUTE) * 100)) - 100}%
               </div>
               <div className="flex items-center gap-2 bg-slate-50 p-2 rounded">
                  <button
                     onClick={zoomOut}
                     className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-sm"
                     aria-label="Zoom out"
                  >
                     −
                  </button>

                  <input
                     type="range"
                     min={MIN_PIXELS_PER_MINUTE}
                     max={MAX_PIXELS_PER_MINUTE}
                     step={0.01}
                     value={pixelsPerMinute}
                     onChange={(e) => onSlider(Number(e.target.value))}
                     className="w-48"
                     aria-label="Zoom level"
                  />

                  <button
                     onClick={zoomIn}
                     className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-sm"
                     aria-label="Zoom in"
                  >
                     +
                  </button>

                  <button
                     onClick={resetZoom}
                     className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-sm"
                     aria-label="Reset zoom"
                  >
                     Reset
                  </button>
               </div>
            </div>
         </div>

         {/* Single scroll container that holds the ruler + rows.
          The inner content has minWidth = LEFT_COL_WIDTH + trackWidth so horizontal scrolling works.
          The ruler will be sticky at top; the left column in ruler and rows will be sticky at left.
      */}
         <div className="max-h-[60vh] overflow-auto" style={{ overflowX: "auto" }}>
            <div style={{ minWidth: LEFT_COL_WIDTH + trackWidth }}>
               {/* Ruler row: the left "Machine" cell stays sticky horizontally (via TimeRuler) and the ruler track scrolls with the container */}
               <TimeRuler days={days} trackWidth={trackWidth} pixelsPerMinute={pixelsPerMinute} />

               {/* Rows */}
               {machines.map((m) => {
                  const machineJobs = jobsForMachine(normalizedScheduledJobs, m);
                  return (
                     <MachineRow
                        key={(m.machineUuid ?? "unassigned").toLowerCase()}
                        machine={m}
                        machineJobs={machineJobs}
                        days={days}
                        dayIndexMap={dayIndexMap}
                        trackWidth={trackWidth}
                        grainLengthMinutes={grainLengthMinutes}
                        pixelsPerMinute={pixelsPerMinute}
                        onJobClick={handleJobClick}
                     />
                  );
               })}
            </div>
         </div>

         {/* Job popover rendered fixed in viewport close to the anchor rect */}
         {selected && (
            <>
               {/* invisible backdrop to capture clicks and close popover */}
               <div
                  className="fixed inset-0 z-40"
                  onMouseDown={() => setSelected(null)}
                  aria-hidden
               />
               <JobPopover
                  job={selected.job}
                  anchorRect={selected.anchorRect}
                  onClose={() => setSelected(null)}
               />
            </>
         )}
      </div>
   );
};

export default Timeline;
