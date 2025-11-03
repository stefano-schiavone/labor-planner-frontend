import React from "react";
import ButtonGroup from "../components/Machine/ButtonGroup";
import DataTable from "../components/Machine/DataTable";

const Machines: React.FC = () => {
   // Wire up with good logic
   const handleAdd = () => console.log("Add");
   const handleDelete = () => console.log("Delete");
   const handleSort = () => console.log("Sort");

   return (
      // prevent the outer Layout main from scrolling for this page; inner surfaces scroll instead
      <div className="overflow-hidden space-y-8 px-4 py-6">
         <section id="machineType-section" className="space-y-3">
            {/* header now uses the same centered max-w container as the table so contents align with table edges */}
            <div className="w-full flex justify-center">
               <div className="max-w-5xl w-full px-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-lg font-semibold text-slate-900">Machine Types</h2>
                     <ButtonGroup onAdd={handleAdd} onDelete={handleDelete} onSort={handleSort} />
                  </div>
               </div>
            </div>

            <DataTable
               columns={["Type", "Total", "Active", "Inactive"]}
               data={[
                  ["Type A", "10", "8", "2"],
                  ["Type B", "5", "3", "2"],
                  ["Type C", "2", "1", "1"]
               ]}
               maxHeight="14vh"
            />
         </section>

         <section id="machine-section" className="space-y-3">
            {/* same treatment for the Machines header */}
            <div className="w-full flex justify-center">
               <div className="max-w-5xl w-full px-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-lg font-semibold text-slate-900">Machines</h2>
                     <ButtonGroup onAdd={handleAdd} onDelete={handleDelete} onSort={handleSort} />
                  </div>
               </div>
            </div>

            <DataTable
               columns={["Machine", "Type", "Status", "Select"]}
               data={[
                  ["Machine 1", "Type A", "Active", "☑"],
                  ["Machine 2", "Type B", "Inactive", "☐"],
                  ["Machine 3", "Type A", "Active", "☑"]
               ]}
               maxHeight="60vh"
            />
         </section>
      </div>
   );
};

export default Machines;
