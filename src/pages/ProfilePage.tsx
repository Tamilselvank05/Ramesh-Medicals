
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Save, Edit, X } from "lucide-react";

const ProfilePage = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Determine if the user is a biller to restrict editing
  const isBiller = currentUser?.role === "biller";
  const isAdmin = currentUser?.role === "admin";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If user is a biller, they shouldn't be able to update their profile
    if (isBiller && !isAdmin) {
      toast.error("Billers cannot edit their profile. Please contact an admin.");
      return;
    }
    
    if (!currentUser) {
      toast.error("Not logged in");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Verify current password
      const { data: user, error: verifyError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .eq('password', formData.currentPassword)
        .single();
      
      if (verifyError || !user) {
        toast.error("Current password is incorrect");
        setIsLoading(false);
        return;
      }
      
      // Prepare update data
      const updateData: {
        username: string;
        email: string;
        phone: string;
        password?: string;
      } = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone
      };
      
      // Add new password if provided
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error("New passwords don't match");
          setIsLoading(false);
          return;
        }
        
        updateData.password = formData.newPassword;
      }
      
      // Update user in database
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', currentUser.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Update local state
        updateCurrentUser({
          ...currentUser,
          username: data.username,
          email: data.email || "",
          phone: data.phone || ""
        });
        
        // Reset password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
        
        // Exit edit mode after successful update
        setIsEditing(false);
        
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        username: currentUser.username || "",
        email: currentUser.email || "",
        phone: currentUser.phone || ""
      }));
    }
  }, [currentUser]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-teal-800">My Profile</h1>
        
        {isAdmin && (
          <div>
            {isEditing ? (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setIsEditing(false)}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="flex items-center gap-2 text-teal-600 border-teal-600 hover:bg-teal-50"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        )}
      </div>
      
      <Card className="border-teal-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
          <CardTitle className="text-teal-800">Profile Information</CardTitle>
          <CardDescription>
            {isBiller || (isAdmin && !isEditing) 
              ? "View your personal information" 
              : "Update your personal information and password"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            {/* Account Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-teal-800">Account Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isLoading || isBiller || (isAdmin && !isEditing)}
                    readOnly={isBiller || (isAdmin && !isEditing)}
                    className={isBiller || (isAdmin && !isEditing) ? "bg-gray-50" : ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={currentUser?.role || ""}
                    disabled
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading || isBiller || (isAdmin && !isEditing)}
                    readOnly={isBiller || (isAdmin && !isEditing)}
                    className={isBiller || (isAdmin && !isEditing) ? "bg-gray-50" : ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isLoading || isBiller || (isAdmin && !isEditing)}
                    readOnly={isBiller || (isAdmin && !isEditing)}
                    className={isBiller || (isAdmin && !isEditing) ? "bg-gray-50" : ""}
                  />
                </div>
              </div>
            </div>
            
            {/* Password Change - Only show if not a biller and (edit mode is active) */}
            {(!isBiller && (isEditing || !isAdmin)) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-teal-800">Change Password</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showPassword.current ? "text" : "password"}
                      placeholder="Enter current password"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPassword.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword.new ? "text" : "password"}
                        placeholder="Enter new password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <button
                        type="button" 
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPassword.new ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword.confirm ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPassword.confirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Only show save button if editing is allowed and active */}
            {(!isBiller && (isEditing || !isAdmin)) && (
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
