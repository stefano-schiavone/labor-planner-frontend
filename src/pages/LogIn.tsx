import { useNavigate } from "react-router-dom";
import LogInCard from "../components/Auth/LogInCard";

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = () => {
    navigate("/home");
  };

  return <LogInCard onSubmit={handleSubmit} />;
}
