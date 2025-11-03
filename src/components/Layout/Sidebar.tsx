import React from "react";
import type { IconType } from "react-icons";
import { NavLink } from "react-router-dom";
import { useNavigate, useLocation } from "react-router";
import {
   IoMdMenu,
   IoMdSettings,
   IoMdHelpCircle,
   IoMdLogOut,
   IoMdPie,
   IoMdPeople,
   IoMdArrowDropdown,
   IoIosBuild,
   IoIosCalendar,
   IoIosCreate,
   IoIosTime
} from "react-icons/io";

interface SubmenuItem {
   name: string;
   path: string;
}

interface MenuItem {
   name: string;
   icon: IconType;
   path?: string;
   submenu?: SubmenuItem[];
}

interface SidebarProps {
   collapsed: boolean;
   setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

// Helper: initials from a name
const getInitials = (name: string) => {
   const names = name.split(" ");
   const initials =
      names.length === 1 ? names[0][0] : names[0][0] + names[names.length - 1][0];
   return initials.toUpperCase();
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
   const navigate = useNavigate();
   const location = useLocation();

   const [activeItem, setActiveItem] = React.useState<string | null>(null);
   const [expandedSubmenus, setExpandedSubmenus] = React.useState<string[]>([]);

   const menuItems: MenuItem[] = [
      { name: "Active", icon: IoIosCalendar, path: "/active" },
      { name: "Scheduling", icon: IoIosCreate, path: "/scheduling" },
      { name: "Upcoming", icon: IoIosTime, path: "/upcoming" },
      { name: "Manage Machines", icon: IoIosBuild, path: "/machines" },
      { name: "Manage Users", icon: IoMdPeople, path: "/users" },
      {
         name: "Settings",
         icon: IoMdSettings,
         submenu: [
            { name: "Profile", path: "/profile" },
            { name: "Security", path: "/security" },
            { name: "Preferences", path: "/preferences" }
         ]
      },
      {
         name: "Analytics",
         icon: IoMdPie,
         submenu: [
            { name: "Reports", path: "/reports" },
            { name: "Statistics", path: "/statistics" },
            { name: "Performance", path: "/performance" }
         ]
      },
      { name: "Support", icon: IoMdHelpCircle, path: "/support" }
   ];

   const toggleSubmenu = (itemName: string) =>
      setExpandedSubmenus((prev) =>
         prev.includes(itemName) ? prev.filter((i) => i !== itemName) : [...prev, itemName]
      );

   // Brand colors (blue)
   // const brand = {
   //    500: "#2563EB", // primary
   //    400: "#60A5FA", // focus/soft
   //    600: "#1F4FD6"  // hover
   // };

   return (
      <aside
         aria-label="Primary navigation"
         className={`fixed top-0 left-0 h-screen bg-white text-slate-900 flex flex-col justify-between shadow-xl transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-64"
            }`}
         role="navigation"
      >
         {/* Header */}
         <div
            className={`flex items-center p-4 border-b border-slate-100 ${collapsed ? "justify-center" : "justify-between"
               }`}
         >
            <div className={`${collapsed ? "hidden" : ""} text-sm font-semibold text-slate-800`}>
               PlanOps
               {/* title removed per request earlier; if you want the app name re-enable here */}
            </div>
            <button
               onClick={() => setCollapsed(!collapsed)}
               className="p-2 hover:bg-slate-50 rounded-lg transition-colors duration-200"
               aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
               <IoMdMenu size={20} className="text-slate-700" />
            </button>
         </div>

         {/* Navigation */}
         <nav className="mt-6 px-3 flex-1 overflow-y-auto">
            <ul className="space-y-1">
               {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const hasSubmenu = !!item.submenu;
                  const isExpanded = expandedSubmenus.includes(item.name);

                  return (
                     <li key={item.name} className="flex flex-col">
                        <NavLink
                           to={item.path ?? "#"}
                           onClick={() => {
                              if (hasSubmenu) toggleSubmenu(item.name);
                              if (!hasSubmenu) setActiveItem(item.name);
                           }}
                           className={`
                    flex items-center gap-3
                    ${collapsed ? "justify-center py-3 px-2" : "justify-start py-3 px-3"}
                    rounded-lg
                    transition-colors
                    ${isActive ? "bg-[rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.12)] text-[#2563EB]" : "hover:bg-slate-50 text-slate-700"}
                    ${collapsed ? "mx-2" : ""}
                  `}
                           aria-current={isActive ? "page" : undefined}
                        >
                           <item.icon size={18} className={isActive ? "text-[#2563EB]" : "text-slate-600"} />
                           {!collapsed && (
                              <>
                                 <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                                 {hasSubmenu && (
                                    <IoMdArrowDropdown
                                       size={16}
                                       className={`text-slate-400 transform transition-transform duration-200 ${isExpanded ? "rotate-180" : "rotate-0"}`}
                                       aria-hidden
                                    />
                                 )}
                              </>
                           )}
                        </NavLink>

                        {/* Submenu */}
                        {hasSubmenu && !collapsed && isExpanded && (
                           <ul className="mt-2 ml-8 mr-3 space-y-1">
                              {item.submenu!.map((sub) => {
                                 const subActive = location.pathname === sub.path || activeItem === sub.name;
                                 return (
                                    <li key={sub.name}>
                                       <NavLink
                                          to={sub.path}
                                          onClick={() => setActiveItem(sub.name)}
                                          className={`
                              flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                              ${subActive ? "bg-[rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.08)] text-[#2563EB]" : "hover:bg-slate-50 text-slate-700"}
                              transition-colors
                            `}
                                          aria-current={subActive ? "page" : undefined}
                                       >
                                          <span className="w-2 h-2 rounded-full bg-slate-300" aria-hidden />
                                          <span className="truncate">{sub.name}</span>
                                       </NavLink>
                                    </li>
                                 );
                              })}
                           </ul>
                        )}
                     </li>
                  );
               })}
            </ul>
         </nav>

         {/* Footer */}
         <div className="border-t border-slate-100 p-4">
            <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
               <div
                  className="w-10 h-10 rounded-full bg-[rgba(37,99,235,0.12)] text-[#2563EB] flex items-center justify-center font-semibold text-sm"
                  aria-hidden
               >
                  {getInitials("John Doe")}
               </div>
               {!collapsed && (
                  <div>
                     <p className="font-medium text-slate-900">John Doe</p>
                     <p className="text-sm text-slate-500">Administrator</p>
                  </div>
               )}
            </div>

            <button
               className={`mt-4 flex items-center w-full p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200 ${collapsed ? "justify-center" : ""
                  }`}
               onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/login", { replace: true });
               }}
            >
               <IoMdLogOut size={18} className="text-slate-700" />
               {!collapsed && <span className="ml-3 text-sm text-slate-700">Logout</span>}
            </button>
         </div>
      </aside>
   );
};

export default Sidebar;
