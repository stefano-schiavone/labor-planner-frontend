import React, { useCallback, useEffect, useMemo, useState } from "react";
import ButtonGroup from "../components/Machine/ButtonGroup";
import DataTable from "../components/Machine/DataTable";
import AddMachineModal from "../components/Machine/AddMachineModal";
import AddMachineTypeModal from "../components/Machine/AddMachineTypeModal";

interface Machine {
   uuid: string;
   name: string;
   description?: string;
   type: string;
   status: "Active" | "Inactive" | string;
}

interface ServerMachineType {
   machineTypeUuid: string;
   name: string;
}

interface ServerMachine {
   machineUuid: string;
   name: string;
   description?: string;
   type?: ServerMachineType | string;
   status?: string;
}
// TODO: Get MachineStatus dynamically. If a machine has status running or active then it is counted in ACTIVE, otherwise INACTIVE
const Machines: React.FC = () => {
   const [machines, setMachines] = useState<Machine[]>([]);
   const [selected, setSelected] = useState<Record<string, boolean>>({});
   const [loading, setLoading] = useState(false);
   const [sortAsc, setSortAsc] = useState(true);

   const [showAddMachine, setShowAddMachine] = useState(false);
   const [showAddType, setShowAddType] = useState(false);

   const [machineTypes, setMachineTypes] = useState<{ uuid: string; name: string }[]>([]);

   // Fetch machine types
   const fetchMachineTypes = useCallback(() => {
      return fetch("/api/machine-types")
         .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch machine types: ${res.status}`);
            return res.json();
         })
         .then((data: ServerMachineType[]) => {
            // console.log(data);
            const mapped = (data || []).map((t) => ({ uuid: t.machineTypeUuid, name: t.name }));
            setMachineTypes(mapped);
            return mapped;
         })
         .catch((err) => {
            console.error(err);
            setMachineTypes([]);
            return [] as { uuid: string; name: string }[];
         });
   }, []);

   const fetchMachines = useCallback(() => {
      setLoading(true);
      return fetch("/api/machines")
         .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch machines: ${res.status}`);
            return res.json();
         })
         .then((data: ServerMachine[]) => {
            const mapped: Machine[] = (data || []).map((m) => {
               const typeName =
                  typeof m.type === "string" ? m.type : (m.type && (m.type as ServerMachineType).name) || "Unknown";
               return {
                  uuid: m.machineUuid,
                  name: m.name,
                  description: m.description,
                  type: typeName,
                  status: m.status || "Inactive",
               };
            });
            setMachines(mapped);
         })
         .catch((err) => {
            console.error(err);
         })
         .finally(() => setLoading(false));
   }, []);

   useEffect(() => {
      // fetch types then machines so we can translate uuids if necessary
      fetchMachineTypes().then(() => fetchMachines());
   }, [fetchMachines, fetchMachineTypes]);

   // Toggle selection for a machine uuid
   const toggleSelect = useCallback((uuid: string) => {
      setSelected((s) => ({ ...s, [uuid]: !s[uuid] }));
   }, []);

   // Clear selection (useful after delete)
   const clearSelection = useCallback(() => setSelected({}), []);

   // Show modals
   const handleShowAddMachine = useCallback(() => {
      if (machineTypes.length === 0) return; // prevent opening if machineTypes don't exist
      setShowAddMachine(true);
   }, [machineTypes]);
   const handleShowAddType = useCallback(() => setShowAddType(true), []);

   // Create machine type
   const handleCreateType = useCallback(
      (name: string) => {
         return fetch("/api/machine-types", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
         })
            .then((res) => {
               if (!res.ok) throw new Error(`Create type failed: ${res.status}`);
               // refresh types so the add-machine modal has the new entry
               return fetchMachineTypes().then(() => fetchMachines());
            })
            .catch((err) => {
               console.error(err);
               throw err;
            });
      },
      [fetchMachineTypes, fetchMachines]
   );

   // Create machine
   const handleCreateMachine = useCallback(
      (payload: { name: string; description?: string; machineTypeUuid?: string; status: string }) => {
         // Build server expected shape. Backend Machine includes nested MachineType; send reference by uuid.
         const body: any = {
            name: payload.name,
            description: payload.description,
            status: payload.status,
         };
         if (payload.machineTypeUuid) {
            body.type = { machineTypeUuid: payload.machineTypeUuid };
         }
         return fetch("/api/machines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
         })
            .then((res) => {
               if (!res.ok) throw new Error(`Create machine failed: ${res.status}`);
               return fetchMachines();
            })
            .catch((err) => {
               console.error(err);
               throw err;
            });
      },
      [fetchMachines]
   );

   // Delete - deletes all currently selected machines
   const handleDelete = useCallback(() => {
      const uuids = Object.entries(selected).filter(([_, v]) => v).map(([k]) => k);

      if (uuids.length === 0) {
         window.alert("No machines selected for deletion.");
         return Promise.resolve();
      }

      if (!window.confirm(`Delete ${uuids.length} selected machine(s)?`)) return Promise.resolve();

      return Promise.all(
         uuids.map((uuid) =>
            fetch(`/api/machines/${encodeURIComponent(uuid)}`, {
               method: "DELETE",
            }).then((res) => {
               if (!res.ok) throw new Error(`Delete failed for ${uuid}: ${res.status}`);
            })
         )
      )
         .then(() => {
            clearSelection();
            return fetchMachines();
         })
         .catch((err) => {
            console.error(err);
            window.alert("Failed to delete machines.");
         });
   }, [selected, fetchMachines, clearSelection]);

   // Sort - toggles sort order by machine name (uses functional updates to avoid stale state)
   const handleSort = useCallback(() => {
      setSortAsc((prev) => {
         const next = !prev;
         setMachines((list) =>
            [...list].sort((a, b) => (next ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)))
         );
         return next;
      });
   }, []);

   // Derived machine types summary
   // Fix: include all machineTypes (even with zero machines) by initializing map from the canonical types list
   const machineTypesSummary = useMemo(() => {
      const map: Record<string, { total: number; active: number; inactive: number }> = {};

      // Initialize from known machine types (so types with zero machines still show)
      for (const t of machineTypes) {
         map[t.name] = { total: 0, active: 0, inactive: 0 };
      }

      // Then tally actual machines (this will add any unknown/legacy names too)
      for (const m of machines) {
         const key = m.type || "Unknown";
         map[key] = map[key] || { total: 0, active: 0, inactive: 0 };
         map[key].total += 1;
         if ((m.status || "").toLowerCase() === "active") map[key].active += 1;
         else map[key].inactive += 1;
      }

      return map;
   }, [machines, machineTypes]);

   // DataTable accepts React nodes (needed for checkbox)
   const typeRows = useMemo(
      () =>
         Object.entries(machineTypesSummary).map(([type, stats]) => [
            type,
            String(stats.total),
            String(stats.active),
            String(stats.inactive),
         ]),
      [machineTypesSummary]
   );

   const machineRows = useMemo(
      () =>
         machines.map((m) => [
            m.name,
            m.type,
            m.status,
            // checkbox as React node to support selection
            <input key={m.uuid} type="checkbox" checked={!!selected[m.uuid]} onChange={() => toggleSelect(m.uuid)} aria-label={`Select ${m.name}`} />,
         ]),
      [machines, selected, toggleSelect]
   );

   return (
      <div className="overflow-hidden space-y-8 px-4 py-6">
         <section id="machineType-section" className="space-y-3">
            <div className="w-full flex justify-center">
               <div className="max-w-5xl w-full px-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-lg font-semibold text-slate-900">Machine Types</h2>
                     <ButtonGroup onAdd={handleShowAddType} onDelete={handleDelete} onSort={handleSort} addEnabled={true} deleteEnabled={machineTypes.length > 0} sortEnabled={machineTypes.length > 0} />
                  </div>
               </div>
            </div>

            <DataTable columns={["Type", "Total", "Active", "Inactive"]} data={typeRows} maxHeight="14vh" />
         </section>

         <section id="machine-section" className="space-y-3">
            <div className="w-full flex justify-center">
               <div className="max-w-5xl w-full px-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-lg font-semibold text-slate-900">Machines</h2>
                     <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500">{loading ? "Loading..." : `${machines.length} machines`}</div>
                        <ButtonGroup onAdd={handleShowAddMachine} onDelete={handleDelete} onSort={handleSort} addEnabled={machineTypes.length > 0} deleteEnabled={machines.length > 0} sortEnabled={machines.length > 0} />
                     </div>
                  </div>
               </div>
            </div>

            <DataTable columns={["Machine", "Type", "Status", "Select"]} data={machineRows} maxHeight="60vh" />
         </section>

         {/* Modals */}
         <AddMachineModal open={showAddMachine} onClose={() => setShowAddMachine(false)} machineTypes={machineTypes} onCreate={handleCreateMachine} />
         <AddMachineTypeModal open={showAddType} onClose={() => setShowAddType(false)} onCreate={handleCreateType} />
      </div>
   );
};

export default Machines;
