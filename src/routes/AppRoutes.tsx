import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/Layout/Layout.tsx";
import LogIn from "../pages/LogIn.tsx";
import Active from "../pages/Active.tsx";
import Machines from "../pages/Machines";
import Analytics from "../pages/Analytics";
import Scheduling from "../pages/Scheduling";
import Settings from "../pages/Settings";
import Support from "../pages/Support";
import Upcoming from "../pages/Upcoming";
import Users from "../pages/Users";

export default function AppRoutes() {
   return (
      <Routes>
         <Route path="/" element={<Navigate to="/login" />} />
         <Route path="/login" element={<LogIn />} />
         <Route element={<Layout />}>
            <Route path="/active" element={<Active />} />
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/upcoming" element={<Upcoming />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/support" element={<Support />} />
            {/* TODO: I should add 404 or protected routes later */}
         </Route>
      </Routes>
   );
}
