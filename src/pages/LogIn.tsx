import { useNavigate } from "react-router-dom";
import LogInCard from "../components/Auth/LogInCard";

export default function Login() {
   const navigate = useNavigate();

   const handleSubmit = async (email: string, password: string) => {
      try {
         const res = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
         });

         if (!res.ok) {
            const error = await res.json();

            // Backend sends 404 for non-existent user
            if (res.status === 401) {
               alert("Incorrect credentials"); // User doesn't exist or password wrong It's the Spring Security API response
            } else if (res.status === 404) {
               alert("User not found");
            } else {
               alert("Login failed: " + (error.message || "Invalid credentials"));
            }
            return;
         }

         const data = await res.json();
         localStorage.setItem("accessToken", data.accessToken);
         navigate("/active");
      } catch (err) {
         console.error(err);
         alert("An error occurred during login");
      }
   };


   return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
         <LogInCard onSubmit={handleSubmit} />
      </div>
   );
}
