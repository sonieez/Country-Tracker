import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router-dom";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    loading ? null : user ? 
      <Navigate to="/countries" replace /> : 
          <h1>Home</h1>
  )
}