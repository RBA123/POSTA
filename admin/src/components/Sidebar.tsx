import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/Button";

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/markets", label: "Markets", icon: "📈" },
    { path: "/markets/create", label: "Create Market", icon: "➕" },
    { path: "/analytics", label: "Analytics", icon: "📉" },
    { path: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-40 hidden lg:flex">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Posta Admin</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isActive(item.path)
                ? "bg-primary-50 text-primary-700 font-medium"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onLogout}
        >
          <span className="mr-2">🚪</span>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
