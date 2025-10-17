import React from "react";
import type { IconType } from "react-icons";
import {
  IoMdMenu,
  IoMdHome,
  IoMdSettings,
  IoMdHelpCircle,
  IoMdLogOut,
  IoMdPie,
  IoMdPeople,
  IoMdArrowDropdown,
} from "react-icons/io";

interface SubmenuItem {
  name: string;
  path: string;
}

interface MenuItem {
  name: string;
  icon: IconType;
  submenu?: SubmenuItem[];
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

// Helper function to get initials
const getInitials = (name: string) => {
  const names = name.split(" ");
  const initials =
    names.length === 1 ? names[0][0] : names[0][0] + names[names.length - 1][0];
  return initials.toUpperCase();
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const [activeItem, setActiveItem] = React.useState("Dashboard");
  const [expandedSubmenus, setExpandedSubmenus] = React.useState<string[]>([]);

  const menuItems: MenuItem[] = [
    { name: "Dashboard", icon: IoMdHome },
    {
      name: "Analytics",
      icon: IoMdPie,
      submenu: [
        { name: "Reports", path: "/reports" },
        { name: "Statistics", path: "/statistics" },
        { name: "Performance", path: "/performance" },
      ],
    },
    { name: "Users", icon: IoMdPeople },
    {
      name: "Settings",
      icon: IoMdSettings,
      submenu: [
        { name: "Profile", path: "/profile" },
        { name: "Security", path: "/security" },
        { name: "Preferences", path: "/preferences" },
      ],
    },
    { name: "Help & Support", icon: IoMdHelpCircle },
  ];

  const toggleSubmenu = (itemName: string) =>
    setExpandedSubmenus((prev) =>
      prev.includes(itemName)
        ? prev.filter((i) => i !== itemName)
        : [...prev, itemName],
    );

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-gray-800 text-white flex flex-col justify-between shadow-xl transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className={`flex items-center gap-2 ${collapsed ? "hidden" : ""}`}>
          <span className="font-bold text-xl">PlanOps</span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 ml-03"
          aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <IoMdMenu size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name} className="flex flex-col">
              <button
                onClick={() => {
                  setActiveItem(item.name);
                  if (item.submenu) toggleSubmenu(item.name);
                }}
                className={`flex items-center w-full rounded-lg transition-colors duration-200 
                  ${activeItem === item.name ? "bg-blue-600" : "hover:bg-gray-700"} 
                  ${collapsed ? "justify-center p-3" : "justify-start p-3"}`}
                aria-current={activeItem === item.name ? "page" : undefined}
              >
                <item.icon size={20} />
                {!collapsed && <span className="ml-4 flex-1">{item.name}</span>}
                {item.submenu && !collapsed && (
                  <IoMdArrowDropdown
                    className={`transition-transform duration-200 ${
                      expandedSubmenus.includes(item.name) ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Submenu */}
              {item.submenu &&
                !collapsed &&
                expandedSubmenus.includes(item.name) && (
                  <ul className="ml-6 mt-2 space-y-2">
                    {item.submenu.map((sub) => (
                      <li key={sub.name}>
                        <button
                          onClick={() => setActiveItem(sub.name)}
                          className={`flex items-center w-full p-2 rounded-lg transition-colors duration-200 ${
                            activeItem === sub.name
                              ? "bg-blue-600"
                              : "hover:bg-gray-700"
                          }`}
                        >
                          <span className="ml-2">{sub.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4">
        <div
          className={`flex items-center gap-4 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
            {getInitials("John Doe")}
          </div>
          {!collapsed && (
            <div>
              <p className="font-medium">John Doe</p>
              <p className="text-sm text-gray-400">Administrator</p>
            </div>
          )}
        </div>
        <button
          className={`mt-4 flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <IoMdLogOut size={20} />
          {!collapsed && <span className="ml-4">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
