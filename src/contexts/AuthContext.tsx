
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Define types for our users
export type UserRole = "admin" | "biller";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  email: string;
  phone: string;
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (username: string, password: string, expectedRole?: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateCurrentUser: (user: User) => void;
  setCurrentUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("rameshMedicalUser");
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        
        // Navigate based on role if on login page
        if (window.location.pathname === "/login") {
          if (parsedUser.role === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/billing");
          }
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("rameshMedicalUser");
      }
    }
    
    setIsLoading(false);
  }, [navigate]);

  const login = async (username: string, password: string, expectedRole?: UserRole): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Query the users table directly
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password) // In real app, would use proper password hash comparison
        .single();

      if (error || !data) {
        toast.error("Invalid username or password");
        return false;
      }

      // Check if the user has the expected role
      if (expectedRole && data.role !== expectedRole) {
        toast.error("Invalid credentials or unauthorized role access");
        return false;
      }

      // Map the database fields to our User type
      const user: User = {
        id: data.id,
        username: data.username,
        role: data.role as UserRole,
        email: data.email || "",
        phone: data.phone || ""
      };

      setCurrentUser(user);
      localStorage.setItem("rameshMedicalUser", JSON.stringify(user));
      
      toast.success(`Welcome back, ${username}!`);
      
      // Navigate based on role
      if (data.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/billing");
      }
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("rameshMedicalUser");
    toast.info("You have been logged out");
    navigate("/login");
  };

  const updateCurrentUser = async (user: User) => {
    try {
      // Update user in database first
      const { error } = await supabase
        .from('users')
        .update({
          username: user.username,
          email: user.email,
          phone: user.phone,
          // Note: Not updating password or role here as they should be handled separately
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setCurrentUser(user);
      localStorage.setItem("rameshMedicalUser", JSON.stringify(user));
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update profile");
    }
  };

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    isAuthenticated: !!currentUser,
    updateCurrentUser,
    setCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
