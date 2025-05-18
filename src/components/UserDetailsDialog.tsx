
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  password: string;
  created_at: string;
}

interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

const UserDetailsDialog = ({ user, open, onClose }: UserDetailsDialogProps) => {
  const [showPassword, setShowPassword] = useState(false);
  
  if (!user) return null;
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-lg border border-teal-100 text-center">
            <h3 className="text-lg font-semibold text-teal-800 mb-1">{user.username}</h3>
            <span className="inline-block px-3 py-1 bg-teal-600 text-white rounded-full text-xs capitalize">
              {user.role}
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-medium">{user.phone || "Not provided"}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Password</p>
              <div className="flex items-center space-x-2">
                <p className="font-medium font-mono bg-gray-100 py-1 px-2 rounded flex-1">
                  {showPassword ? user.password : "••••••••••"}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Registered On</p>
              <p className="font-medium">{formatDate(user.created_at)}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
