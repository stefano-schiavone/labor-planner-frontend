import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/Layout/Layout.tsx";
import LogIn from "../pages/LogIn.tsx";
import Active from "../pages/Active.tsx";
import Machines from "../pages/Machines";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";
import Support from "../pages/Support";
import Upcoming from "../pages/Upcoming";
import Users from "../pages/Users";
import SchedulingWeekSelector from "../pages/SchedulingWeekSelector.tsx";
import SchedulingResult from "../pages/SchedulingResult.tsx";
import SchedulingView from "../pages/SchedulingView.tsx";
import SchedulingJobs from "../pages/SchedulingJobs.tsx";

export default function AppRoutes() {
   return (
      <Routes>
         <Route path="/" element={<Navigate to="/login" />} />
         <Route path="/login" element={<LogIn />} />
         <Route element={<Layout />}>
            <Route path="/active" element={<Active />} />
            <Route path="/scheduling" element={<SchedulingWeekSelector />} />
            <Route path="/scheduling/:week/Jobs" element={<SchedulingJobs />} />
            <Route path="/scheduling/result" element={<SchedulingResult />} />
            <Route path="/scheduling/view" element={<SchedulingView />} />
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
