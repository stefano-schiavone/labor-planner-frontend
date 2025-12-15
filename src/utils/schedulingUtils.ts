// contents of file
import type { ServerSchedule, ScheduledJob, Machine } from "../types/scheduling";
/* Helpers */

export function normalizeDateOnlyIso(input?: string | null): string | null {
   if (!input) return null;
   const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.exec(input);
   if (dateOnlyMatch) return input;
   const iso = input.includes("T") ? input : `${input}T00:00:00`;
   const d = new Date(iso);
   if (isNaN(d.getTime())) return null;
   return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
}

export function startOfWeekIso(dateIso?: string | null): string | null {
   // dateIso must be YYYY-MM-DD
   if (!dateIso) return null;
   const d = new Date(`${dateIso}T00:00:00Z`);
   if (isNaN(d.getTime())) return null;
   // JS getUTCDay: 0 = Sunday, 1 = Monday, ... 6 = Saturday
   const day = d.getUTCDay();
   // compute how many days to subtract to get Monday:
   // if Monday (1) -> 0, Tuesday(2)->1, ..., Sunday(0)->6
   const daysSinceMonday = (day + 6) % 7;
   d.setUTCDate(d.getUTCDate() - daysSinceMonday);
   return d.toISOString().slice(0, 10);
}

export function formatDayLabel(isoDate: string) {
   const d = new Date(`${isoDate}T00:00:00`);
   return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function formatTimeFromMinutes(minOfDay: number) {
   const hours = Math.floor(minOfDay / 60);
   const mins = minOfDay % 60;
   return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function deriveGrainLength(schedule: ServerSchedule): number {
   const sj = schedule.scheduledJobList || [];
   for (const s of sj) {
      const minutes = s.job?.durationMinutes;
      const grains = s.durationInGrains;
      if (minutes != null && grains != null && grains > 0) {
         return Math.max(1, Math.round(minutes / grains));
      }
   }
   return 5;
}

export function normalizeId(id?: unknown): string {
   if (id == null) return "unassigned";
   return String(id).toLowerCase().trim();
}

/* Layout constants */
export const PIXELS_PER_MINUTE = 0.6; // tweak to zoom
export const LEFT_COL_WIDTH = 200;
export const ROW_HEIGHT = 64;

// Business window: 07:00 - 18:00
export const BUSINESS_START_MINUTES = 7 * 60; // 420
export const BUSINESS_END_MINUTES = 18 * 60; // 1080
export const VISIBLE_MINUTES_PER_DAY = BUSINESS_END_MINUTES - BUSINESS_START_MINUTES; // 660

/* small util to build machines list like before */
export function buildMachinesFromSchedule(schedule?: ServerSchedule): Machine[] {
   if (!schedule) return [];
   const map = new Map<string, Machine>();

   if (Array.isArray(schedule.machineList)) {
      schedule.machineList.forEach((m) => {
         const key = normalizeId(m.machineUuid);
         if (!map.has(key)) map.set(key, m);
      });
   }

   (schedule.scheduledJobList || []).forEach((sj) => {
      // note: some payloads use `machine` or `assignedMachine`; try both gracefully
      const raw = (sj.assignedMachine ?? (sj as ScheduledJob).assignedMachine) ?? { machineUuid: "unassigned", name: "Unassigned" } as Machine;
      const key = normalizeId(raw.machineUuid);
      if (!map.has(key)) map.set(key, raw);
   });

   const needsUnassigned = (schedule.scheduledJobList || []).some((sj) => !(sj.assignedMachine ?? (sj as ScheduledJob).assignedMachine)?.machineUuid);
   if (needsUnassigned && !map.has("unassigned")) {
      map.set("unassigned", { machineUuid: "unassigned", name: "Unassigned" });
   }

   const arr = Array.from(map.values());
   arr.sort((a, b) => (a?.name ?? "").localeCompare(b?.name ?? ""));
   return arr;
}

/* get scheduled jobs for a machine key */
export function jobsForMachine(all: ScheduledJob[], machine: { machineUuid: string }) {
   const key = normalizeId(machine?.machineUuid);
   return all.filter((sj) => normalizeId((sj.assignedMachine ?? (sj as ScheduledJob).assignedMachine)?.machineUuid) === key);
}
