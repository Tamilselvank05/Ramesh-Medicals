import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Plus, AlertTriangle, Eye, EyeOff, FileText, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/contexts/AuthContext";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const userFormSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  role: z.enum(["admin", "biller"]),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserData {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
}

const Users = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState<{[key: string]: boolean}>({});

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      role: "biller",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*");

      if (error) {
        throw error;
      }

      const mappedUsers = data.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role as UserRole,
        email: user.email || "",
        phone: user.phone || "",
        password: user.password || "",
      }));

      setUsers(mappedUsers);
      
      const initialVisibility: {[key: string]: boolean} = {};
      mappedUsers.forEach(user => {
        initialVisibility[user.id] = false;
      });
      setPasswordVisibility(initialVisibility);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  const toggleUserPasswordVisibility = (userId: string) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleUserSubmit = async (values: UserFormValues) => {
    if (values.password !== values.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      if (values.id) {
        const { error } = await supabase
          .from("users")
          .update({
            username: values.username,
            email: values.email,
            phone: values.phone || "",
            role: values.role,
            password: values.password,
          })
          .eq("id", values.id);

        if (error) throw error;

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === values.id 
              ? {
                  ...user,
                  username: values.username,
                  email: values.email,
                  phone: values.phone || "",
                  role: values.role as UserRole,
                  password: values.password,
                }
              : user
          )
        );
        toast.success("User updated successfully");
      } else {
        const { data, error } = await supabase
          .from("users")
          .insert([
            {
              username: values.username,
              email: values.email,
              phone: values.phone || "",
              role: values.role,
              password: values.password,
            },
          ])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          setUsers((prevUsers) => [
            ...prevUsers,
            {
              id: data[0].id,
              username: data[0].username,
              email: data[0].email || "",
              phone: data[0].phone || "",
              role: data[0].role as UserRole,
              password: data[0].password || "",
            },
          ]);
        }
        
        toast.success("User created successfully");
      }

      setOpen(false);
      userForm.reset();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    userForm.setValue("id", user.id);
    userForm.setValue("username", user.username);
    userForm.setValue("email", user.email);
    userForm.setValue("phone", user.phone);
    userForm.setValue("role", user.role);
    userForm.setValue("password", "");
    userForm.setValue("confirmPassword", "");
    setOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", confirmDelete);

      if (error) throw error;

      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== confirmDelete)
      );
      toast.success("User deleted successfully");
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.text("Users Report", 14, 15);
      
      autoTable(doc, {
        head: [['Username', 'Email', 'Phone', 'Role']],
        body: users.map(user => [
          user.username,
          user.email,
          user.phone || 'N/A',
          user.role
        ]),
        startY: 20
      });
      
      doc.save('users-report.pdf');
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const exportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        users.map(user => ({
          Username: user.username,
          Email: user.email,
          Phone: user.phone || 'N/A',
          Role: user.role
        }))
      );
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
      
      XLSX.writeFile(workbook, "users-report.xlsx");
      toast.success('Excel exported successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Users</h1>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} className="bg-red-500 hover:bg-red-600">
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button onClick={() => {
              setOpen(true);
              setSelectedUser(null);
              userForm.reset();
            }}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>
            Create, edit, and manage users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || "N/A"}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-mono mr-2">
                          {passwordVisibility[user.id] ? user.password : '••••••••'}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleUserPasswordVisibility(user.id)}
                        >
                          {passwordVisibility[user.id] ? 
                            <EyeOff className="h-4 w-4" /> : 
                            <Eye className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmDelete(user.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Edit User" : "Create User"}
            </DialogTitle>
          </DialogHeader>
          <Form {...userForm}>
            <form
              onSubmit={userForm.handleSubmit(handleUserSubmit)}
              className="space-y-4"
            >
              <FormField
                control={userForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter username"
                        {...field}
                        className="border-gray-200 focus-visible:ring-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter email"
                        type="email"
                        {...field}
                        className="border-gray-200 focus-visible:ring-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter phone number"
                        type="tel"
                        {...field}
                        className="border-gray-200 focus-visible:ring-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus-visible:ring-gray-500">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="biller">Biller</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter password"
                          type={showPassword ? "text" : "password"}
                          {...field}
                          className="border-gray-200 focus-visible:ring-gray-500 pr-10"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Confirm password"
                          type={showConfirmPassword ? "text" : "password"}
                          {...field}
                          className="border-gray-200 focus-visible:ring-gray-500 pr-10"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {field.value && userForm.getValues('password') === field.value ? (
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Passwords match
                      </p>
                    ) : field.value ? (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Passwords do not match
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : selectedUser
                    ? "Update User"
                    : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
