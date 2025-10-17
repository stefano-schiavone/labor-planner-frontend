import { useState } from "react";
import Sidebar from "../components/Layout/Sidebar.tsx";
import "../styles/Home.css";
import "../index.css";

export default function Home() {
  const [collapsed, setCollapsed] = useState(false);

  const tabs = [
    { name: "Overview", path: "/dashboard" },
    { name: "Offers", path: "/offers" },
    { name: "Orders", path: "/orders" },
    { name: "Geo", path: "/geo" },
    { name: "Product Insights", path: "/product-insights" },
    { name: "Alerts & Anomalies", path: "/alerts-anomalies" },
    { name: "Admin", path: "/admin" },
  ];

  return (
    <div className="flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main
        className={`flex-1 p-8 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <h1 className="text-3xl font-bold mb-4">Home</h1>
        <p>Welcome to your dashboard!</p>
      </main>
    </div>
  );
}
