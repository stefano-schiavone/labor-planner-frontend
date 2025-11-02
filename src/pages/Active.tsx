import { useState } from "react";
import Sidebar from "../components/Layout/Sidebar.tsx";
import "../styles/Active.css";
import "../index.css";

const Active: React.FC = () => {

  return (
      <main>
        <h1 className="text-2xl font-bold mb-4">Active</h1>
        <p>Welcome to your dashboard!</p>
      </main>
  );
}

export default Active;
