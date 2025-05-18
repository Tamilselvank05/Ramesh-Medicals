
import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  PieChart,
  Users,
  Pill,
  AlertCircle,
  FileText,
  LogOut,
  Menu,
  X,
  UserCircle,
  Building2,
  Mail,
  Phone,
  ChevronsLeft,
  ChevronsRight,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const sidebarLinks = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <PieChart size={20} /> },
    { name: "Users", path: "/admin/users", icon: <Users size={20} /> },
    { name: "Medicines", path: "/admin/medicines", icon: <Pill size={20} /> },
    { name: "Vendors", path: "/admin/vendors", icon: <Store size={20} /> },
    { name: "Alerts", path: "/admin/alerts", icon: <AlertCircle size={20} /> },
    { name: "Reports", path: "/admin/reports", icon: <FileText size={20} /> },
    { name: "Profile", path: "/admin/profile", icon: <UserCircle size={20} /> }
  ];
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };
  
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="bg-white shadow-md"
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </div>
      
      {/* Sidebar - Updated with darker background for admin */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 transform transition-all duration-300 ease-in-out bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-xl 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          ${isSidebarCollapsed ? "w-20" : "w-64"}`}
      >
        <div className="flex flex-col h-full">
          {/* Shop Logo and Enhanced Details */}
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/40">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1.5 rounded-md shadow-md">
                <img src="/logo.png" alt="Logo" className="h-14 w-14" /> {/* Increased logo size */}
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-bold text-white">Ramesh Medicals</h1>
                  <p className="text-xs text-white">Admin Panel</p>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-2">
                <div className="flex items-center space-x-2 text-xs text-white">
                  <Building2 size={14} className="flex-shrink-0" />
                  <p className="text-white">Anaimalai - Poolankinar Rd, Erisinampatti</p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-white">
                  <Mail size={14} className="flex-shrink-0" />
                  <p className="text-white">r.mailtoramesh@gmail.com</p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-white">
                  <Phone size={14} className="flex-shrink-0" />
                  <p className="text-white">9443654109</p>
                </div>
              </div>
            )}
          </div>
          
          {/* User info */}
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/20">
            <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "space-x-3"}`}>
              <div className="bg-slate-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold shadow-md">
                {currentUser?.username.charAt(0).toUpperCase() || "U"}
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <p className="font-medium text-white">{currentUser?.username || "User"}</p>
                  <p className="text-xs text-white">{currentUser?.email || "No email"}</p>
                  <span className="text-xs px-2 py-0.5 mt-1 inline-block rounded bg-slate-600 text-white capitalize shadow-sm">
                    {currentUser?.role || "User"}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation - Updated for better icon visibility */}
          <nav className="flex-1 p-2 overflow-y-auto bg-gradient-to-b from-slate-900/20 to-slate-800/10">
            <ul className="space-y-1">
              {sidebarLinks.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center transition-all",
                        isSidebarCollapsed 
                          ? "justify-center p-3" 
                          : "p-3",
                        isActive
                          ? "bg-slate-700 text-white shadow-md rounded-md"
                          : "text-white hover:bg-slate-800 hover:text-white rounded-md"
                      )
                    }
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setIsSidebarOpen(false);
                      }
                    }}
                  >
                    <span className={`text-current ${isSidebarCollapsed ? "" : "mr-3"}`}>{link.icon}</span>
                    {!isSidebarCollapsed && <span className="text-white">{link.name}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Sidebar collapse toggle button */}
          <div className="p-2 border-t border-slate-700/30 flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebarCollapse}
              className="text-white hover:text-white hover:bg-slate-700/60 rounded-full"
            >
              {isSidebarCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
            </Button>
          </div>
          
          {/* Logout button */}
          <div className="p-4 border-t border-slate-700/30 mt-auto bg-slate-800/40">
            <Button
              variant="ghost"
              className={cn(
                "text-white hover:text-white hover:bg-slate-700/60 transition-colors w-full",
                isSidebarCollapsed ? "justify-center p-2" : "justify-start"
              )}
              onClick={logout}
            >
              <LogOut size={20} className={cn("text-current", isSidebarCollapsed ? "" : "mr-2")} />
              {!isSidebarCollapsed && "Logout"}
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen 
            ? isSidebarCollapsed 
              ? "lg:ml-20" 
              : "lg:ml-64" 
            : "ml-0"
        }`}
      >
        <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100">
          <Outlet />
        </div>
      </main>
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout;
