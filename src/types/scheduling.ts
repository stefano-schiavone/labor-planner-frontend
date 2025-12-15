// shared types for scheduling (partial, matching your shapes)
export type Machine = {
   machineUuid: string;
   name?: string;
   description?: string;
   type?: { name?: string; machineTypeUuid?: string } | null;
};

export type ServerJob = {
   jobUuid: string;
   name: string;
   description?: string;
   durationMinutes?: number;
   assignedTimeGrain: StartingTimeGrain;
   duration?: string;
   deadline?: string;
   requiredMachineTypeUuid?: string;
};

export type StartingTimeGrain = {
   grainIndex: number;
   startingMinuteOfDay: number;
   date: string; // e.g. "2025-12-15"
};

export type ScheduledJob = {
   scheduledJobUuid: string;
   job: ServerJob;
   assignedMachine?: Machine | null;
   startingTimeGrain?: StartingTimeGrain;
   durationInGrains?: number | null;
   endTimeGrainIndex?: number | null;
};

export type ServerSchedule = {
   scheduleUuid: string;
   weekStartDate: string; // ISO
   lastModifiedDate?: string;
   createdByUser?: { name?: string; lastName?: string; email?: string } | null;
   machineList?: Machine[] | null;
   scheduledJobList?: ScheduledJob[] | null;
   score?: any;
};
