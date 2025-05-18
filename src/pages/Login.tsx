
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserRole } from "../contexts/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState<UserRole>("biller");
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }
    
    setLoading(true);
    
    try {
      // Use the login function from AuthContext
      const success = await login(username, password, role);
      
      if (!success) {
        throw new Error("Login failed");
      }
      
      // Navigation is handled inside the login function in AuthContext
      
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className=" relative min-h-screen flex items-center justify-center bg-gray-50 p-4">
      
          {/* Background Video */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover z-[0]"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/background-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/*Transparent layer*/}
      <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-1" />
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Ramesh Medicals" className="h-24 w-24 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white " >Ramesh Medicals</h1>
          <p className="text-white mt-2">Pharmacy Management System</p>
        </div>
        
        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="pb-4">

            
            <CardTitle className="text-center text-xl">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="biller" value={role} onValueChange={(v) => setRole(v as UserRole)} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4 mx-6">
              <TabsTrigger value="biller"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md px-4 py-2 transition">
                Biller</TabsTrigger>
              <TabsTrigger value="admin" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md px-4 py-2 transition">
              Admin</TabsTrigger>
            </TabsList>
            
            <CardContent className="space-y-4">
              <TabsContent value="biller">
                <div className="text-sm text-center text-gray-600 mb-4">
                  Login as a biller to generate invoices and manage sales
                </div>
              </TabsContent>
              <TabsContent value="admin">
                <div className="text-sm text-center text-gray-600 mb-4">
                  Login as an admin to manage inventory and view reports
                </div>
              </TabsContent>
              
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className={`border-gray-300 ${error ? "border-red-300" : ""}`}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`border-gray-300 ${error ? "border-red-300" : ""} pr-10`}
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-medical-600 hover:bg-medical-700 text-white"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Tabs>
          
          <CardFooter className="flex-col space-y-2">
            <div className="text-xs text-center w-full text-gray-500">
              &copy; {new Date().getFullYear()} Ramesh Medicals. All rights reserved.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
