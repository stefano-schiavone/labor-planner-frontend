import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";

const Layout: React.FC = () => {
   const [collapsed, setCollapsed] = useState(false);

   return (
      <div className="flex">
         <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
         {/* Make the main container fill the viewport and be scrollable by default.
          Individual pages can opt out of scrolling by using overflow-hidden on their root. */}
         <main
            className={`flex-1 bg-slate-50 h-screen transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}
            style={{ overflow: "auto" }}
            aria-live="polite"
         >
            <Outlet />
         </main>
      </div>
   );
};

export default Layout;
