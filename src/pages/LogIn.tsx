import { useNavigate } from "react-router-dom";
import LogInCard from "../components/Auth/LogInCard";

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = () => {
     // TODO: Authenticate
  // Here I use useNavigate hook because it's easier to run code before I redirect
    navigate("/active");
  };

  return (
    // TODO: Fix background gradient
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Background gradient using ::before */}
      <div
        className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_center,_hsl(210,100%,97%),_hsl(0,0%,100%))] 
        dark:bg-[radial-gradient(ellipse_at_center,_hsla(210,100%,16%,0.5),_hsl(220,30%,5%))]"
      ></div>

      {/* Centered login card */}
      <LogInCard onSubmit={handleSubmit} />
    </div>
  );
}
