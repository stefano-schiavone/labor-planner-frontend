import { useState } from "react";
import "../index.css";

const Machines: React.FC = () => {

  return (
<main>
         <h1 className="text-2xl font-bold mb-4">Machines</h1>
         <p>List and manage your machines here.</p>

         {/* Example table */}
         <table className="min-w-full bg-white border border-gray-200 rounded-md mt-4">
         <thead>
         <tr className="bg-gray-100">
         <th className="py-2 px-4 border-b">ID</th>
         <th className="py-2 px-4 border-b">Name</th>
         <th className="py-2 px-4 border-b">Status</th>
         <th className="py-2 px-4 border-b">Actions</th>
         </tr>
         </thead>
         <tbody>
         <tr>
         <td className="py-2 px-4 border-b">1</td>
         <td className="py-2 px-4 border-b">Machine A</td>
         <td className="py-2 px-4 border-b">Active</td>
         <td className="py-2 px-4 border-b">
         <button className="text-blue-600 hover:underline">Edit</button>
         </td>
         </tr>
         {/* Add more rows here */}
         </tbody>
         </table>
      </main>
  );
}

export default Machines;
