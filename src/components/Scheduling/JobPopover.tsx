import React, { useMemo } from "react";
import type { ScheduledJob } from "../../types/scheduling";
import { BUSINESS_START_MINUTES } from "../../utils/schedulingUtils";

/**
 * Renders a small fixed-position popover near an anchorRect (DOMRect in viewport coords).
 * Styling is intentionally small and neutral; tweak to match your design system.
 */

type Props = {
   job: ScheduledJob;
   anchorRect: DOMRect;
   onClose: () => void;
};

const JobPopover: React.FC<Props> = ({ job, anchorRect, onClose }) => {
   // compute position: prefer showing below the anchor; if not enough space, show above
   const style = useMemo(() => {
      const margin = 8;
      const popoverWidth = 320;
      const popoverHeightApprox = 180;

      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      // default left aligned to anchor left, but ensure visible on screen
      let left = anchorRect.left;
      if (left + popoverWidth + margin > viewportW) {
         left = Math.max(margin, viewportW - popoverWidth - margin);
      }

      // prefer below
      let top = anchorRect.bottom + margin;
      if (top + popoverHeightApprox + margin > viewportH) {
         // show above anchor
         top = Math.max(margin, anchorRect.top - popoverHeightApprox - margin);
      }

      return {
         left,
         top,
         width: popoverWidth,
      } as React.CSSProperties;
   }, [anchorRect]);

   // const startDate = job.startingTimeGrain?.date ?? "—";
   // const startTime = (job.startingTimeGrain?.startingMinuteOfDay != null)
   // ?`${String(Math.floor((job.startingTimeGrain!.startingMinuteOfDay + 60 * 7) / 60)).padStart(2, "0")}:${String((job.startingTimeGrain!.startingMinuteOfDay % 60)).padStart(2, "0")}` // quick calc (may be adjusted)
   // : "—";
   const formatScheduled = (job: ScheduledJob) => {
      console.log(job.startingTimeGrain?.date)
      if (!job.startingTimeGrain?.date || job.startingTimeGrain.startingMinuteOfDay == null) return "—";

      const minutesOfDay = BUSINESS_START_MINUTES + job.startingTimeGrain.startingMinuteOfDay;
      const [hours, mins] = [Math.floor(minutesOfDay / 60), minutesOfDay % 60];
      const timeStr = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

      const date = new Date(`${job.startingTimeGrain.date}T00:00:00Z`);
      const dateStr = date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

      return `${dateStr} — ${timeStr}`;
   };

   const formatDateTime = (isoString?: string) => {
      if (!isoString) return "—";
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
         year: "numeric",
         month: "short",
         day: "numeric",
         hour: "numeric",
         minute: "2-digit",
      });
   };

   return (
      <div
         className="fixed z-50"
         style={{ left: style.left, top: style.top, width: style.width }}
         role="dialog"
         aria-modal="false"
      >
         <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
            <div className="flex items-start justify-between px-4 py-3 border-b border-slate-100">
               <div>
                  <div className="text-sm font-semibold text-slate-900">{job.job?.name ?? "Unnamed job"}</div>
                  <div className="text-xs text-slate-500">{job.job?.description ?? ""}</div>
               </div>
               <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 ml-3"
                  aria-label="Close"
               >
                  ✕
               </button>
            </div>

            <div className="px-4 py-3 text-sm text-slate-700 space-y-2">
               <div className="flex justify-between">
                  <div className="text-xs text-slate-500">Scheduled</div>
                  <div className="font-medium">{formatScheduled(job)}</div>
               </div>

               <div className="flex justify-between">
                  <div className="text-xs text-slate-500">Duration</div>
                  <div className="font-medium">{job.job?.durationMinutes ?? (job.durationInGrains != null ? `${job.durationInGrains} grain(s)` : "—")} minutes</div>
               </div>

               <div className="flex justify-between">
                  <div className="text-xs text-slate-500">Deadline</div>
                  <div className="font-medium">{formatDateTime(job.job?.deadline)}</div>
               </div>

               <div className="flex justify-between">
                  <div className="text-xs text-slate-500">Assigned machine</div>
                  <div className="font-medium">{job.assignedMachine?.name ?? job.assignedMachine?.machineUuid ?? "Unassigned"}</div>
               </div>

               <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">IDs</div>
                  <div className="text-[13px] text-slate-700 break-all">
                     <div><span className="font-medium">Job:</span> {job.job?.jobUuid ?? "—"}</div>
                     <div><span className="font-medium">Scheduled:</span> {job.scheduledJobUuid ?? "—"}</div>
                  </div>
               </div>
            </div>

            <div className="px-4 py-2 bg-slate-50 text-right">
               <button onClick={onClose} className="px-3 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-sm">
                  Close
               </button>
            </div>
         </div>
      </div>
   );
};

export default JobPopover;
