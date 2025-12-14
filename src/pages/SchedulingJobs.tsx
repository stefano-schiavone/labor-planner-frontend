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
  // API now prefers integer minutes
  durationMinutes?: number;
  // fallback (older clients) might still return ISO string
  duration?: string;
  deadline?: string;
  requiredMachineTypeUuid?: string;
}

interface Job {
  uuid: string;
  name: string;
  description?: string;
  // internal representation for UI: whole minutes preferred
  durationMinutes?: number;
  // keep duration for backwards compatibility if needed
  duration?: string;
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
 * Parse an ISO-8601 PT... duration string into whole minutes.
 * Returns undefined if parsing fails.
 */
function parseIsoDurationToMinutes(duration?: string): number | undefined {
  if (!duration) return undefined;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
  if (!match) return undefined;
  const [, hours, minutes, seconds] = match;
  const h = hours ? parseInt(hours, 10) : 0;
  const m = minutes ? parseInt(minutes, 10) : 0;
  const s = seconds ? parseInt(seconds, 10) : 0;
  // convert to whole minutes (round down any seconds)
  return h * 60 + m + Math.floor(s / 60);
}

/**
 * Format minutes for table display: "90 min" or "" if undefined.
 */
function formatMinutesForTable(minutes?: number): string {
  if (minutes == null || isNaN(minutes)) return "";
  return `${minutes} min`;
}

const SchedulingJobs: React.FC = () => {
  const navigate = useNavigate();
  const { week } = useParams<{ week?: string }>();
  const [generating, setGenerating] = useState(false);

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
      })()
  );

  useEffect(() => {
    if (decodedWeek) setSelectedWeekStart(decodedWeek);
  }, [decodedWeek]);

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

  const fetchWeekJobs = useCallback(() => {
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

if (weekStartISO && weekEndISO) {
  const jobsRes = await fetch(
    `/api/jobs/by-deadline?start=${encodeURIComponent(weekStartISO)}&end=${encodeURIComponent(weekEndISO)}`
  );
          if (jobsRes.ok) {
            const data: ServerJob[] = await jobsRes.json();
            setCandidateJobs(data || []);
            setJobs(
              (data || []).map((j) => {
                const minutes = j.durationMinutes ?? parseIsoDurationToMinutes(j.duration);
                return {
                  uuid: j.jobUuid,
                  name: j.name,
                  description: j.description,
                  durationMinutes: minutes,
                  duration: j.duration,
                  deadline: j.deadline,
                  machineType: mtList.find((t) => t.uuid === j.requiredMachineTypeUuid)?.name ?? "Unknown",
                };
              })
            );
          } else {
            await fetchWeekJobs();
          }
        } else {
          await fetchWeekJobs();
        }
        setLoading(false);
    },
    [isoInfo, selectedWeekStart, weekStartISO, weekEndISO, machineTypes, fetchWeekJobs]
  );

  useEffect(() => {
    fetchMachineTypes().then((mapped) => {
      loadForWeek(mapped);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeekStart]);

  useEffect(() => {
    if (rawJobs.length > 0 && (candidateJobs.length === 0 && scheduledJobs.length === 0)) {
      const mapped = rawJobs.map((j) => {
        const mt = machineTypes.find((t) => t.uuid === j.requiredMachineTypeUuid);
        const minutes = j.durationMinutes ?? parseIsoDurationToMinutes(j.duration);
        return {
          uuid: j.jobUuid,
          name: j.name,
          description: j.description,
          durationMinutes: minutes,
          duration: j.duration,
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

  const handleCreateJob = useCallback(
    (payload: { name: string; description?: string; duration?: string; deadline?: string; requiredMachineTypeUuid?: string; durationMinutes?: number; machineTypeUuid?: string }) => {
      const body: any = {
        name: payload.name,
        description: payload.description,
        // send integer minutes (preferred) instead of an ISO string
        durationMinutes: payload.durationMinutes,
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

  const handleGoToSchedule = async () => {
    if (!weekStartISO || !weekEndISO) return alert("Invalid week");
    try {
      const res = await fetch("/api/schedules/for-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: weekStartISO, weekEnd: weekEndISO}),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.exists) {
        navigate("/scheduling/view", {
          state: { schedule: data.schedule, scheduledJobs: data.scheduledJobs ?? [], startISO: weekStartISO, endISO: weekEndISO, weekId: selectedWeekStart,},
        });
      } else {
        alert("No current schedule for this week");
      }
    } catch {
      alert("Failed to check schedule");
    }
  };

  const [sortAsc, setSortAsc] = useState(true);
  const handleSort = useCallback(() => {
    setSortAsc((prev) => {
      const next = !prev;
      setJobs((list) => [...list].sort((a, b) => (next ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))));
      return next;
    });
  }, []);

/**
 * Format ISO date string for table display: e.g., "11/27/2025, 9:30 PM"
 */
function formatDeadlineForTable(isoDate?: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

  const jobRows = useMemo(
    () =>
      jobs.map((j) => [
        j.name,
        // Always show minutes in the table
        formatMinutesForTable(j.durationMinutes),
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
  onClick={async () => {
  setGenerating(true);

  try {
    const res = await fetch("/api/schedules/solve-for-week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: weekStartISO, weekEnd: weekEndISO }),
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      data = null; // JSON parse failed
    }

    if (!res.ok) {
      const message =
        data?.type === "INFEASIBLE_SCHEDULE"
          ? data.message ?? "Schedule is infeasible for this week."
          : "Failed to generate schedule";
      alert(message);
      return;
    }

    // Successful response
    navigate("/scheduling/result", { state: { schedule: data } });
  } catch (err) {
    console.error(err);
    alert("Failed to generate schedule");
  } finally {
    setGenerating(false);
  }
}}
  className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg bg-[#2563EB] text-white hover:bg-[#1F4FD6] disabled:opacity-60"
  disabled={generating}
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
  {generating ? "Generating…" : "Generate schedule"}
</button>
            <button
            onClick={handleGoToSchedule}
            className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg bg-[#2563EB] text-white hover:bg-[#1F4FD6]"
          >
            View Current Schedule
          </button>
            </div>
          </div>
        </div>
      </section>

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
