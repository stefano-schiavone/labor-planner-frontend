import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar.tsx";

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`flex-1 p-8 transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
