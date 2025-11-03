import { useNavigate } from "react-router-dom";
import LogInCard from "../components/Auth/LogInCard";

export default function Login() {
   const navigate = useNavigate();

   const handleSubmit = () => {
      // TODO: Authenticate
      // Using useNavigate so we can run code before redirect
      navigate("/active");
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
         {/* Centered login card */}
         <LogInCard onSubmit={handleSubmit} />
      </div>
   );
}
