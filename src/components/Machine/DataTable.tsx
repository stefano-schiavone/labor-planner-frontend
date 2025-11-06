import React from "react";

interface TableProps {
   columns: string[];
   // cells may be strings or React nodes (for checkboxes, buttons, etc.)
   data: Array<Array<string | React.ReactNode>>;
   // Optional maxHeight for the scrollable table body (CSS value like '220px' or '48rem')
   maxHeight?: string;
   // Optional flag to disable internal scrolling (makes table expand to fit)
   noScroll?: boolean;
}

/**
 * DataTable:
 * - If maxHeight is provided and noScroll is false, tbody becomes scrollable with its own scroll.
 * - Uses table-fixed + colgroup (keeps column alignment consistent).
 */
const DataTable: React.FC<TableProps> = ({ columns, data, maxHeight, noScroll }) => {
   const colWidth = `${100 / columns.length}%`;

   return (
      <div className="w-full flex justify-center">
         <div
            className="
          max-w-5xl
          w-full
          bg-white
          border border-slate-200
          rounded-2xl
          shadow-sm
          overflow-hidden
        "
         >
            <div className="overflow-x-auto">
               <table className="min-w-full table-fixed text-left divide-y divide-slate-200">
                  <colgroup>
                     {columns.map((_, i) => (
                        <col key={i} style={{ width: colWidth }} />
                     ))}
                  </colgroup>

                  <thead className="bg-slate-50">
                     <tr>
                        {columns.map((col) => (
                           <th
                              key={col}
                              scope="col"
                              className="px-4 py-3 text-sm font-semibold tracking-wide text-slate-700 uppercase truncate"
                           >
                              {col}
                           </th>
                        ))}
                     </tr>
                  </thead>

                  {noScroll || !maxHeight ? (
                     <tbody className="bg-white">
                        {data.map((row, i) => (
                           <tr
                              key={i}
                              className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50"
                                 } hover:bg-slate-100 transition-colors duration-150`}
                           >
                              {row.map((cell, j) => (
                                 <td
                                    key={j}
                                    className="px-4 py-3 align-middle text-sm text-slate-700 truncate"
                                 // allow any node inside
                                 >
                                    {cell}
                                 </td>
                              ))}
                           </tr>
                        ))}
                     </tbody>
                  ) : (
                     // Scrollable body: keep header visible, body scrolls within a fixed-height container
                     <tbody>
                        <tr className="h-0">
                           <td colSpan={columns.length} className="p-0">
                              <div style={{ maxHeight }} className="overflow-y-auto">
                                 <table className="min-w-full table-fixed">
                                    <colgroup>
                                       {columns.map((_, i) => (
                                          <col key={i} style={{ width: colWidth }} />
                                       ))}
                                    </colgroup>
                                    <tbody className="bg-white">
                                       {data.map((row, i) => (
                                          <tr
                                             key={i}
                                             className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50"
                                                } hover:bg-slate-100 transition-colors duration-150`}
                                          >
                                             {row.map((cell, j) => (
                                                <td
                                                   key={j}
                                                   className="px-4 py-3 align-middle text-sm text-slate-700 truncate"
                                                >
                                                   {cell}
                                                </td>
                                             ))}
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           </td>
                        </tr>
                     </tbody>
                  )}
               </table>
            </div>
         </div>
      </div>
   );
};

export default DataTable;
