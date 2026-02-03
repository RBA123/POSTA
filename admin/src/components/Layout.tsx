import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { signOut } from "../services/auth";
import { useNavigate } from "react-router-dom";

export function Layout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <div className="lg:pl-64">
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
