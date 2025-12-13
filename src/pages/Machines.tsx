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
   status: string;
}

interface ServerMachineType {
   machineTypeUuid: string;
   name: string;
}
interface ServerMachineStatus {
   machineStatusUuid: string;
   name: string;
}

interface ServerMachine {
   machineUuid: string;
   name: string;
   description?: string;
   machineTypeUuid: string;
   machineStatusUuid: string;
}

// TODO: Active/Inactive counting is done wrong
// For now: if a machine is "running" or "active", it counts as ACTIVE; otherwise INACTIVE.
const Machines: React.FC = () => {
   // List of machines shown in the UI
   const [machines, setMachines] = useState<Machine[]>([]);

   // Selection of individual machines (keyed by machine uuid)
   const [selected, setSelected] = useState<Record<string, boolean>>({});

   // Selection for machine types (keyed by machineType uuid)
   const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({});

   const [loading, setLoading] = useState(false);
   const [sortAsc, setSortAsc] = useState(true);

   const [showAddMachine, setShowAddMachine] = useState(false);
   const [showAddType, setShowAddType] = useState(false);

   // All machine types recognized by the system. Using useState I define it like the interface MachineTypeOption
   const [machineTypes, setMachineTypes] = useState<{ uuid: string; name: string }[]>([]);

   // All Machine status options. define like interface MachineStatusOption
   const [statusOptions, setStatusOptions] = useState<{ uuid: string; name: string }[]>([]);

   // Machine Object gotten from Server
   const [rawMachines, setRawMachines] = useState<ServerMachine[]>([]);

   const fetchStatusOptions = useCallback(() => {
      return fetch("/api/machine-statuses")
         .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch machine statuses: ${res.status}`);
            return res.json();
         })
         .then((data: ServerMachineStatus[]) => {
            const mapped = (data || []).map((s) => ({ uuid: s.machineStatusUuid, name: s.name }));
            setStatusOptions(mapped);
            return mapped;
         })
         .catch((err) => {
            console.error(err);
            setMachineTypes([]);
            return [] as { uuid: string; name: string }[];
         });
   }, []);

   // Fetch all machine types from the API
   const fetchMachineTypes = useCallback(() => {
      return fetch("/api/machine-types")
         .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch machine types: ${res.status}`);
            return res.json();
         })
         .then((data: ServerMachineType[]) => {
            // Convert server shape to the simpler client shape
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
         .then((res) => res.json())
         .then(setRawMachines) // just store raw data
         .finally(() => setLoading(false));
   }, []);

   useEffect(() => {
      const mapped = rawMachines.map((m) => {
         const typeObj = machineTypes.find((t) => t.uuid === m.machineTypeUuid);
         const statusObj = statusOptions.find((s) => s.uuid === m.machineStatusUuid);

         return {
            uuid: m.machineUuid,
            name: m.name,
            description: m.description,
            type: typeObj ? typeObj.name : "Unknown",
            status: statusObj ? statusObj.name : "Unknown",
         };
      });

      setMachines(mapped);
   }, [rawMachines, machineTypes, statusOptions]);

   useEffect(() => {
      // Load machine types first so that when machines load,
      // their type names can be compared against the known list.
      fetchStatusOptions();
      fetchMachineTypes().then(() => fetchMachines());
   }, [fetchMachines, fetchMachineTypes, fetchStatusOptions]);



   // Toggle selection for a machine
   const toggleSelect = useCallback((uuid: string) => {
      setSelected((s) => ({ ...s, [uuid]: !s[uuid] }));
   }, []);

   // Toggle selection for a machine type
   const toggleSelectType = useCallback((typeUuid: string) => {
      setSelectedTypes((s) => ({ ...s, [typeUuid]: !s[typeUuid] }));
   }, []);

   // Clear all selections (useful after deleting)
   const clearSelection = useCallback(() => {
      setSelected({});
      setSelectedTypes({});
   }, []);

   // Show the "Add Machine" modal, but only if we have machine types
   const handleShowAddMachine = useCallback(() => {
      if (machineTypes.length === 0) return; // prevent adding machines before types exist
      setShowAddMachine(true);
   }, [machineTypes]);

   const handleShowAddType = useCallback(() => setShowAddType(true), []);

   // Create a new machine type
   const handleCreateType = useCallback(
      (name: string) => {
         return fetch("/api/machine-types", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
         })
            .then((res) => {
               if (!res.ok) throw new Error(`Create type failed: ${res.status}`);
               // Refresh both lists so everything stays up to date
               return fetchMachineTypes().then(() => fetchMachines());
            })
            .catch((err) => {
               console.error(err);
               throw err;
            });
      },
      [fetchMachineTypes, fetchMachines]
   );

   // Create a new machine
   const handleCreateMachine = useCallback(
      (payload: { name: string; description?: string; machineTypeUuid: string; statusOptionUuid: string }) => {
         // Build server request shape
         const body = {
            name: payload.name,
            description: payload.description,
            machineTypeUuid: payload.machineTypeUuid,
            machineStatusUuid: payload.statusOptionUuid,
         };

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

   // Delete all selected machines
   const handleDeleteMachines = useCallback(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

   // Delete all selected machine types
   const handleDeleteTypes = useCallback(() => {
      const uuids = Object.entries(selectedTypes).filter(([_, v]) => v).map(([k]) => k);

      if (uuids.length === 0) {
         window.alert("No machine types selected for deletion.");
         return Promise.resolve();
      }

      if (!window.confirm(`Delete ${uuids.length} selected machine type(s)?`)) return Promise.resolve();

      return Promise.all(
         uuids.map((uuid) =>
            fetch(`/api/machine-types/${encodeURIComponent(uuid)}`, {
               method: "DELETE",
            }).then((res) => {
               if (!res.ok) throw new Error(`Delete failed for type ${uuid}: ${res.status}`);
            })
         )
      )
         .then(() => {
            clearSelection();
            // Refresh both lists because removing a type may affect machines
            return fetchMachineTypes().then(() => fetchMachines());
         })
         .catch((err) => {
            console.error(err);
            window.alert("Failed to delete machine types.");
         });
   }, [selectedTypes, fetchMachineTypes, fetchMachines, clearSelection]);

   // Toggle sort order by machine name
   const handleSort = useCallback(() => {
      setSortAsc((prev) => {
         const next = !prev;
         setMachines((list) =>
            [...list].sort((a, b) => (next ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)))
         );
         return next;
      });
   }, []);

   // Build a summary of machine types showing totals/active/inactive counts
   const machineTypesSummary = useMemo(() => {
      const map: Record<string, { total: number; active: number; inactive: number }> = {};

      // First add all known machine types from the server
      // so they always appear even if no machines use them.
      for (const t of machineTypes) {
         map[t.name] = { total: 0, active: 0, inactive: 0 };
      }

      // Now count machines grouped by their type name.
      //
      // IMPORTANT:
      //  - If a machine uses a type name not found in machineTypes,
      //    I still include it. These represent "unofficial" types that exist
      //    only in machine data (e.g., old data, typos, or removed types).
      //
      //  - If a machine has no type at all (null/undefined),
      //    I use the string "Unknown".
      for (const m of machines) {
         const key = m.type || "Unknown";

         // If the type doesn't already exist in the map (because it's not in the
         // official list), create an entry for it.
         if (!map[key]) {
            map[key] = { total: 0, active: 0, inactive: 0 };
         }

         map[key].total += 1;
         if ((m.status || "").toLowerCase() === "active") map[key].active += 1;
         else map[key].inactive += 1;
      }

      return map;
   }, [machines, machineTypes]);

   // Build table rows for machine types
   const typeRows = useMemo(
      () =>
         Object.entries(machineTypesSummary).map(([type, stats]) => {
            // Try to match this type name to the official machineTypes list.
            //
            // If found:
            //   - It has a UUID
            //   - It is a real system-defined machine type
            //   - User can select/delete it
            //
            // If NOT found:
            //   - This type name only exists because machines use it
            //   - There is no official type record for it
            //   - No UUID exists, so deleting it is impossible
            const typeObj = machineTypes.find((t) => t.name === type);
            const typeUuid = typeObj?.uuid;

            const selectCell = typeUuid ? (
               // Valid type: checkbox is enabled
               <input
                  key={typeUuid}
                  type="checkbox"
                  checked={!!selectedTypes[typeUuid]}
                  onChange={() => toggleSelectType(typeUuid)}
                  aria-label={`Select ${type}`}
               />
            ) : (
               // Unknown/unofficial type: checkbox disabled
               <input key={type} type="checkbox" disabled aria-label={`Select ${type} (not deletable)`} />
            );

            return [type, String(stats.total), String(stats.active), String(stats.inactive), selectCell] as Array<
               string | React.ReactNode
            >;
         }),
      [machineTypesSummary, machineTypes, selectedTypes, toggleSelectType]
   );

   // Build machine rows for the DataTable
   const machineRows = useMemo(
      () =>
         machines.map((m) => [
            m.name,
            m.type,
            <span className="capitalize" key={`status-${m.uuid}`}>
               {m.status}
            </span>,
            // Checkbox for machine row selection
            <input
               key={m.uuid}
               type="checkbox"
               checked={!!selected[m.uuid]}
               onChange={() => toggleSelect(m.uuid)}
               aria-label={`Select ${m.name}`}
            />,
         ]),
      [machines, selected, toggleSelect]
   );

   const typeDeleteEnabled = useMemo(() => Object.values(selectedTypes).some(Boolean), [selectedTypes]);
   const machineDeleteEnabled = useMemo(() => Object.values(selected).some(Boolean), [selected]);

   return (
      <div className="overflow-hidden space-y-8 px-4 py-6">
         <section id="machineType-section" className="space-y-3">
            <div className="w-full flex justify-center">
               <div className="max-w-5xl w-full px-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-lg font-semibold text-slate-900">Machine Types</h2>
                     <ButtonGroup
                        onAdd={handleShowAddType}
                        onDelete={handleDeleteTypes}
                        onSort={handleSort}
                        addEnabled={true}
                        deleteEnabled={typeDeleteEnabled}
                        sortEnabled={machineTypes.length > 0}
                     />
                  </div>
               </div>
            </div>

            <DataTable columns={["Type", "Total", "Active", "Inactive", "Select"]} data={typeRows} maxHeight="14vh" />
         </section>

         <section id="machine-section" className="space-y-3">
            <div className="w-full flex justify-center">
               <div className="max-w-5xl w-full px-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-lg font-semibold text-slate-900">Machines</h2>
                     <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500">
                           {loading ? "Loading..." : `${machines.length} machines`}
                        </div>
                        <ButtonGroup
                           onAdd={handleShowAddMachine}
                           onDelete={handleDeleteMachines}
                           onSort={handleSort}
                           addEnabled={machineTypes.length > 0}
                           deleteEnabled={machineDeleteEnabled}
                           sortEnabled={machines.length > 0}
                        />
                     </div>
                  </div>
               </div>
            </div>

            <DataTable columns={["Machine", "Type", "Status", "Select"]} data={machineRows} maxHeight="60vh" />
         </section>

         {/* Modals */}
         <AddMachineModal
            open={showAddMachine}
            onClose={() => setShowAddMachine(false)}
            machineTypes={machineTypes}
            statusOptions={statusOptions}
            onCreate={handleCreateMachine}
         />
         <AddMachineTypeModal open={showAddType} onClose={() => setShowAddType(false)} onCreate={handleCreateType} />
      </div>
   );
};

export default Machines;

