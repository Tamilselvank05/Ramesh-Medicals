
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UserRole } from "../contexts/AuthContext";

interface PrivateRouteProps {
  allowedRoles?: UserRole[];
}

const PrivateRoute = ({ allowedRoles }: PrivateRouteProps) => {
  const { currentUser, isLoading } = useAuth();
  
  if (isLoading) {
    // Show loading state
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-medical-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // If role restrictions exist and user's role is not allowed
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect admin to admin dashboard and billers to billing page
    if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" />;
    } else {
      return <Navigate to="/billing" />;
    }
  }
  
  // User is authenticated and authorized
  return <Outlet />;
};

export default PrivateRoute;
