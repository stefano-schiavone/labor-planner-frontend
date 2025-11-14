import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ButtonGroup from "../components/Machine/ButtonGroup";
import DataTable from "../components/Machine/DataTable";
import AddJobModal from "../components/Job/AddJobModal";

interface MachineTypeOption {
   uuid: string;
   name: string;
}

interface ServerJob {
   jobUuid: string;
   name: string;
   description?: string;
   duration?: string; // ISO-8601 duration e.g. "PT60M" when returned from server
   durationMinutes?: number; // fallback shapes
   deadline?: string; // ISO string or local string
   requiredMachineTypeUuid?: string;
}

interface Job {
   uuid: string;
   name: string;
   description?: string;
   duration?: string; // ISO-8601 duration
   deadline?: string;
   machineType: string;
}

/** Server shapes for schedules/scheduled jobs (partial) */
interface ServerSchedule {
   scheduleUuid: string;
   weekStartDate: string; // ISO
   lastModifiedDate?: string;
}

interface ServerScheduledJob {
   scheduledJobUuid: string;
   startTime?: string;
   endTime?: string;
   job: ServerJob;
   machine?: { machineUuid: string; name?: string } | null;
}

/**
 * SchedulingJobs
 *
 * Renders the Jobs management UI for a specific week.
 * Route: /scheduling/:week/Jobs
 *
 * Key fixes:
 * - handleCreateJob now sends payload fields that match the backend DTO names:
 *   { name, description, duration (ISO-8601 string), deadline (local datetime string), requiredMachineTypeUuid }
 * - Fixed operator precedence when falling back to durationMinutes so we don't end up with "PTundefinedM"
 * - Ensure loadForWeek can accept freshly fetched machineTypes to avoid "Unknown" machine type lookups
 */

function parseISODuration(duration?: string): string {
   if (!duration) return "";
   // ISO-8601 regex for hours, minutes, seconds
   const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
   if (!match) return duration; // fallback if format is unexpected
   const [, hours, minutes, seconds] = match;
   const parts: string[] = [];
   if (hours) parts.push(`${hours}h`);
   if (minutes) parts.push(`${minutes}m`);
   if (seconds) parts.push(`${seconds}s`);
   return parts.join(" ") || "0m";
}

function getDurationIso(duration?: string, minutes?: number): string | undefined {
   if (duration) return duration;
   if (typeof minutes === "number" && !isNaN(minutes)) return `PT${minutes}M`;
   return undefined;
}

/**
 * Format a deadline string (ISO or local) into:
 *   "11/27/2025, 9:30 PM"
 * (date using toLocaleDateString + time using toLocaleTimeString without seconds)
 */
function formatDeadlineForTable(deadline?: string): string {
   if (!deadline) return "";
   const d = new Date(deadline);
   if (isNaN(d.getTime())) return String(deadline);
   const datePart = d.toLocaleDateString();
   const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
   return `${datePart}, ${timePart}`;
}

const SchedulingJobs: React.FC = () => {
   const navigate = useNavigate();
   const { week } = useParams<{ week?: string }>();

   const decodedWeek = useMemo(() => {
      if (!week) return "";
      try {
         return decodeURIComponent(week);
      } catch {
         return week;
      }
   }, [week]);

   const [selectedWeekStart, setSelectedWeekStart] = useState<string>(
      decodedWeek ||
      (() => {
         const now = new Date();
         now.setHours(0, 0, 0, 0);
         return now.toISOString().slice(0, 10);
      })
   );

   // sync with route param
   useEffect(() => {
      if (decodedWeek) setSelectedWeekStart(decodedWeek);
   }, [decodedWeek]);

   // --- Week utilities: parse WeekNN-YYYY and compute week start (Monday) and end (next Monday) ---
   function parseISOWeekId(id: string): { week: number; year: number } | null {
      const match = /^Week(\d+)-(\d{4})$/.exec(id);
      if (!match) return null;
      return {
         week: parseInt(match[1], 10),
         year: parseInt(match[2], 10),
      };
   }

   function getWeekRangeISO(week: number, year: number): { startISO: string; endISO: string; startDate: Date; endDate: Date } {
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const dayOfWeekJan4 = jan4.getUTCDay() || 7;
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

   const isoInfo = parseISOWeekId(selectedWeekStart);
   const [weekStartISO, weekEndISO, weekStartDateString] = useMemo(() => {
      if (!isoInfo) return ["", "", "Invalid week"];
      const { startISO, endISO, startDate } = getWeekRangeISO(isoInfo.week, isoInfo.year);
      return [startISO, endISO, startDate.toDateString()];
   }, [selectedWeekStart]);

   // Jobs state
   const [jobs, setJobs] = useState<Job[]>([]);
   const [rawJobs, setRawJobs] = useState<ServerJob[]>([]);
   const [scheduledJobs, setScheduledJobs] = useState<ServerScheduledJob[]>([]);
   const [candidateJobs, setCandidateJobs] = useState<ServerJob[]>([]);
   const [selected, setSelected] = useState<Record<string, boolean>>({});
   const [loading, setLoading] = useState(false);
   const [showAddJob, setShowAddJob] = useState(false);
   const [machineTypes, setMachineTypes] = useState<MachineTypeOption[]>([]);

   const fetchMachineTypes = useCallback(() => {
      return fetch("/api/machine-types")
         .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch machine types: ${res.status}`);
            return res.json();
         })
         .then((data: Array<{ machineTypeUuid: string; name: string }>) => {
            const mapped = (data || []).map((t) => ({ uuid: t.machineTypeUuid, name: t.name }));
            setMachineTypes(mapped);
            return mapped;
         })
         .catch((err) => {
            console.error(err);
            setMachineTypes([]);
            return [] as MachineTypeOption[];
         });
   }, []);

   const fetchAllJobs = useCallback(() => {
      setLoading(true);
      return fetch("/api/jobs")
         .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
            return res.json();
         })
         .then((data: ServerJob[]) => {
            setRawJobs(data || []);
         })
         .catch((err) => {
            console.error(err);
            setRawJobs([]);
         })
         .finally(() => setLoading(false));
   }, []);

   // Main loader for week: tries combined endpoint then falls back
   // Accept an optional machineTypes list to use immediately after fetching machine types,
   // so we don't need to rely on React state update timing.
   const loadForWeek = useCallback(
      async (machineTypeList?: MachineTypeOption[]) => {
         const mtList = machineTypeList ?? machineTypes;

         if (!isoInfo) {
            setScheduledJobs([]);
            setCandidateJobs([]);
            setRawJobs([]);
            setJobs([]);
            return;
         }

         setLoading(true);
         setScheduledJobs([]);
         setCandidateJobs([]);
         setRawJobs([]);

         const weekId = selectedWeekStart;

         try {
            const combinedRes = await fetch(`/api/schedules/for-week?week=${encodeURIComponent(weekId)}`);
            if (combinedRes.ok) {
               const data: { schedule?: ServerSchedule | null; scheduledJobs?: ServerScheduledJob[]; candidateJobs?: ServerJob[] } =
                  await combinedRes.json();
               setScheduledJobs(data.scheduledJobs || []);
               setCandidateJobs(data.candidateJobs || []);
               if (data.scheduledJobs && data.scheduledJobs.length > 0) {
                  setJobs(
                     data.scheduledJobs.map((sj) => ({
                        uuid: sj.job.jobUuid,
                        name: sj.job.name,
                        description: sj.job.description,
                        duration: sj.job.duration ?? (sj.job.durationMinutes ? `PT${sj.job.durationMinutes}M` : undefined),
                        deadline: sj.job.deadline,
                        machineType: mtList.find((t) => t.uuid === sj.job.requiredMachineTypeUuid)?.name ?? "Unknown",
                     }))
                  );
               } else {
                  setJobs(
                     (data.candidateJobs || []).map((j) => ({
                        uuid: j.jobUuid,
                        name: j.name,
                        description: j.description,
                        duration: j.duration ?? (j.durationMinutes ? `PT${j.durationMinutes}M` : undefined),
                        deadline: j.deadline,
                        machineType: mtList.find((t) => t.uuid === j.requiredMachineTypeUuid)?.name ?? "Unknown",
                     }))
                  );
               }

               setLoading(false);
               return;
            }

            const scheduleRes = await fetch(`/api/schedules/${encodeURIComponent(weekId)}`);
            if (scheduleRes.ok) {
               const data: { schedule: ServerSchedule; scheduledJobs: ServerScheduledJob[] } = await scheduleRes.json();
               setScheduledJobs(data.scheduledJobs || []);
               setJobs(
                  (data.scheduledJobs || []).map((sj) => ({
                     uuid: sj.job.jobUuid,
                     name: sj.job.name,
                     description: sj.job.description,
                     duration: sj.job.duration ?? (sj.job.durationMinutes ? `PT${sj.job.durationMinutes}M` : undefined),
                     deadline: sj.job.deadline,
                     machineType: mtList.find((t) => t.uuid === sj.job.requiredMachineTypeUuid)?.name ?? "Unknown",
                  }))
               );
               setLoading(false);
               return;
            }

            if (weekStartISO && weekEndISO) {
               const jobsRes = await fetch(
                  `/api/jobs?deadlineFrom=${encodeURIComponent(weekStartISO)}&deadlineTo=${encodeURIComponent(weekEndISO)}`
               );
               if (jobsRes.ok) {
                  const data: ServerJob[] = await jobsRes.json();
                  setCandidateJobs(data || []);
                  setJobs(
                     (data || []).map((j) => ({
                        uuid: j.jobUuid,
                        name: j.name,
                        description: j.description,
                        duration: j.duration ?? (j.durationMinutes ? `PT${j.durationMinutes}M` : undefined),
                        deadline: j.deadline,
                        machineType: mtList.find((t) => t.uuid === j.requiredMachineTypeUuid)?.name ?? "Unknown",
                     }))
                  );
               } else {
                  await fetchAllJobs();
               }
            } else {
               await fetchAllJobs();
            }
         } catch (err) {
            console.error(err);
            await fetchAllJobs();
         } finally {
            setLoading(false);
         }
      },
      [isoInfo, selectedWeekStart, weekStartISO, weekEndISO, machineTypes, fetchAllJobs]
   );

   useEffect(() => {
      // fetch machine types first, then call loadForWeek with the freshly fetched list
      fetchMachineTypes().then((mapped) => {
         // pass mapped list so the initial mapping has access to machine type names
         loadForWeek(mapped);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [selectedWeekStart]);

   useEffect(() => {
      if (rawJobs.length > 0 && (candidateJobs.length === 0 && scheduledJobs.length === 0)) {
         const mapped = rawJobs.map((j) => {
            const mt = machineTypes.find((t) => t.uuid === j.requiredMachineTypeUuid);
            return {
               uuid: j.jobUuid,
               name: j.name,
               description: j.description,
               duration: j.duration ?? (j.durationMinutes ? `PT${j.durationMinutes}M` : undefined),
               deadline: j.deadline,
               machineType: mt ? mt.name : "Unknown",
            } as Job;
         });
         setJobs(mapped);
      }
   }, [rawJobs, machineTypes, candidateJobs.length, scheduledJobs.length]);

   const toggleSelect = useCallback((uuid: string) => {
      setSelected((s) => ({ ...s, [uuid]: !s[uuid] }));
   }, []);

   const clearSelection = useCallback(() => {
      setSelected({});
   }, []);

   const handleShowAddJob = useCallback(() => {
      if (machineTypes.length === 0) return;
      setShowAddJob(true);
   }, [machineTypes]);

   // Updated to accept the sanitized payload from the AddJobModal and send exactly what the backend expects.
   const handleCreateJob = useCallback(
      (payload: { name: string; description?: string; duration?: string; deadline?: string; requiredMachineTypeUuid?: string; machineTypeUuid?: string }) => {
         const body = {
            name: payload.name,
            description: payload.description,
            // duration should be an ISO-8601 duration string e.g. "PT60M"
            // If payload.duration is already ISO string it'll be used, otherwise if durationMinutes was supplied use that.
            duration: getDurationIso(payload.duration, (payload as any).durationMinutes),
            // backend expects a LocalDateTime-like string (no Z). The modal provides that (e.g. "2025-11-17T09:30")
            deadline: payload.deadline,
            // server DTO field name
            requiredMachineTypeUuid: payload.requiredMachineTypeUuid ?? payload.machineTypeUuid,
         };

         return fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
         })
            .then((res) => {
               if (!res.ok) throw new Error(`Create job failed: ${res.status}`);
               // refresh the view for the same week (use current machineTypes so display names resolve)
               return loadForWeek();
            })
            .catch((err) => {
               console.error(err);
               throw err;
            });
      },
      [loadForWeek]
   );

   const handleDeleteJobs = useCallback(() => {
      const uuids = Object.entries(selected).filter(([_, v]) => v).map(([k]) => k);
      if (uuids.length === 0) {
         window.alert("No jobs selected for deletion.");
         return Promise.resolve();
      }
      if (!window.confirm(`Delete ${uuids.length} selected job(s)?`)) return Promise.resolve();

      return Promise.all(
         uuids.map((uuid) =>
            fetch(`/api/jobs/${encodeURIComponent(uuid)}`, {
               method: "DELETE",
            }).then((res) => {
               if (!res.ok) throw new Error(`Delete failed for ${uuid}: ${res.status}`);
            })
         )
      )
         .then(() => {
            clearSelection();
            return loadForWeek();
         })
         .catch((err) => {
            console.error(err);
            window.alert("Failed to delete jobs.");
         });
   }, [selected, loadForWeek, clearSelection]);

   const [sortAsc, setSortAsc] = useState(true);
   const handleSort = useCallback(() => {
      setSortAsc((prev) => {
         const next = !prev;
         setJobs((list) => [...list].sort((a, b) => (next ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))));
         return next;
      });
   }, []);

   const jobRows = useMemo(
      () =>
         jobs.map((j) => [
            j.name,
            parseISODuration(j.duration),
            j.machineType,
            // Format deadline without seconds: "11/27/2025, 9:30 PM"
            j.deadline ? formatDeadlineForTable(j.deadline) : "",
            <input
               key={j.uuid}
               type="checkbox"
               checked={!!selected[j.uuid]}
               onChange={() => toggleSelect(j.uuid)}
               aria-label={`Select ${j.name}`}
            />,
         ]),
      [jobs, selected, toggleSelect]
   );

   const deleteEnabled = useMemo(() => Object.values(selected).some(Boolean), [selected]);

   const handleChangeWeek = () => {
      navigate("/scheduling");
   };

   return (
      <div className="overflow-hidden space-y-8 px-4 py-6 min-h-[calc(100vh-48px)]">
         <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold">Scheduling</h1>
         </div>

         {/* Selected week card centered horizontally */}
         <section className="space-y-3">
            <div className="flex justify-center">
               <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-4">
                  <div>
                     <div className="text-sm text-slate-700">Selected week</div>
                     <div className="text-sm font-medium text-slate-900">{weekStartDateString}</div>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                     <button
                        onClick={handleChangeWeek}
                        className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
                     >
                        Change week
                     </button>

                     <button
                        onClick={() =>
                           navigate("/scheduling/result", { state: { weekStart: selectedWeekStart, weekStartISO, weekEndISO } })
                        }
                        className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg bg-[#2563EB] text-white hover:bg-[#1F4FD6]"
                     >
                        Generate schedule (placeholder)
                     </button>
                  </div>
               </div>
            </div>
         </section>

         {/* Jobs section */}
         <section id="jobs-section" className="space-y-3">
            <div className="w-full flex justify-center">
               <div className="max-w-5xl w-full px-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-lg font-semibold text-slate-900">Jobs</h2>
                     <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500">{loading ? "Loading..." : `${jobs.length} jobs`}</div>
                        <ButtonGroup
                           onAdd={handleShowAddJob}
                           onDelete={handleDeleteJobs}
                           onSort={handleSort}
                           addEnabled={machineTypes.length > 0}
                           deleteEnabled={deleteEnabled}
                           sortEnabled={jobs.length > 0}
                        />
                     </div>
                  </div>
               </div>
            </div>

            <DataTable columns={["Name", "Duration", "MachineType", "Deadline", "Select"]} data={jobRows} maxHeight="60vh" />
         </section>

         <AddJobModal
            open={showAddJob}
            onClose={() => setShowAddJob(false)}
            machineTypes={machineTypes}
            onCreate={async (p) => {
               await handleCreateJob(p);
               setShowAddJob(false);
            }}
            weekStartISO={weekStartISO}
            weekEndISO={weekEndISO}
         />
      </div>
   );
};

export default SchedulingJobs;
