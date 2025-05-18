
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Receipt, History, FileText, LogOut, Menu, X, UserCircle, Building2, Phone, Mail, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const BillingLayout = () => {
  const { currentUser, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Set sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Initialize on mount
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const sidebarLinks = [
    { name: "Create Invoice", path: "/billing", icon: <Receipt size={20} /> },
    { name: "Invoice History", path: "/billing/history", icon: <History size={20} /> },
    { name: "All Invoices", path: "/billing/all-invoices", icon: <FileText size={20} /> },
    { name: "Profile", path: "/billing/profile", icon: <UserCircle size={20} /> },
  ];
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
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
      
      {/* Sidebar with #073980 blue gradient color scheme */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 transform transition-all duration-300 ease-in-out bg-gradient-to-b from-[#073980] to-[#0a4fa6] text-white shadow-xl 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          ${isSidebarCollapsed ? "w-20" : "w-64"}`}
      >
        <div className="flex flex-col h-full">
          {/* Shop Logo and Enhanced Details */}
          <div className="p-4 border-b border-[#0a4fa6]/60 bg-[#073980]/20">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1.5 rounded-md shadow-md">
                <img src="/logo.png" alt="Logo" className="h-14 w-14" /> {/* Increased logo size */}
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-bold text-white">Ramesh Medicals</h1>
                  <p className="text-xs text-white">Medical Store & Pharmacy</p>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="mt-3 pt-3 border-t border-[#0a4fa6]/50 space-y-2">
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
          <div className="p-4 border-b border-[#0a4fa6]/50 bg-[#073980]/20">
            <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "space-x-3"}`}>
              <div className="bg-white text-[#073980] rounded-full h-10 w-10 flex items-center justify-center font-bold shadow-md">
                {currentUser?.username.charAt(0).toUpperCase() || "U"}
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <p className="font-medium text-white">{currentUser?.username || "User"}</p>
                  <p className="text-xs text-white">{currentUser?.email || "No email"}</p>
                  <span className="text-xs px-2 py-0.5 mt-1 inline-block rounded bg-white text-[#073980] capitalize shadow-sm">
                    {currentUser?.role || "User"}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation - Updated for better icon visibility */}
          <nav className="flex-1 p-2 overflow-y-auto">
            <ul className="space-y-1">
              {sidebarLinks.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    end={link.path === "/billing"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center transition-all",
                        isSidebarCollapsed 
                          ? "justify-center p-3" 
                          : "p-3",
                        isActive
                          ? "bg-white text-[#073980] shadow-md rounded-md font-medium"
                          : "text-white hover:bg-white/20 hover:text-white rounded-md"
                      )
                    }
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setIsSidebarOpen(false);
                      }
                    }}
                  >
                    <span className={`text-current ${isSidebarCollapsed ? "" : "mr-3"}`}>{link.icon}</span>
                    {!isSidebarCollapsed && link.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Sidebar collapse toggle button */}
          <div className="p-2 border-t border-[#0a4fa6]/50 flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebarCollapse}
              className="text-white hover:text-white hover:bg-white/20 rounded-full"
            >
              {isSidebarCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
            </Button>
          </div>
          
          {/* Logout button */}
          <div className="p-4 border-t border-[#0a4fa6]/50 mt-auto bg-[#073980]/20">
            <Button
              variant="ghost"
              className={cn(
                "text-white hover:text-white hover:bg-white/20 transition-colors w-full",
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
        <div className="min-h-screen p-4 md:p-8">
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

export default BillingLayout;
