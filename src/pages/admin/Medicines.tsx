import { useState, useEffect } from "react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, CalendarX, Package, PackageCheck, AlertTriangle, Search, Store } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Medicine, MedicineWithVendor } from "@/types/medicine";
import { Vendor } from "@/types/vendor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Get today's date formatted as YYYY-MM-DD for the min attribute on date inputs
const today = new Date().toISOString().split('T')[0];

const medicineSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Medicine name is required" }),
  price: z.number().min(0, { message: "Price must be positive" }),
  stock: z.number().min(0, { message: "Stock cannot be negative" }),
  tax: z.number().min(0, { message: "Tax percentage must be positive" }),
  discount: z.number().min(0, { message: "Discount percentage must not be negative" }),
  expiry_date: z.string().refine(date => {
    // Compare date strings directly for validating no past dates
    return date >= today;
  }, {
    message: "Expiry date cannot be in the past",
    path: ["expiry_date"]
  }),
  prescription_required: z.boolean().default(false),
  vendor_id: z.string().nullable().optional()
});

type MedicineFormValues = z.infer<typeof medicineSchema>;

const Medicines = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchMedicines = async (): Promise<MedicineWithVendor[]> => {
    const { data, error } = await supabase
      .from('medicines')
      .select('*, vendors(id, name, shop_address, phone, email)');
    
    if (error) {
      throw new Error(`Failed to fetch medicines: ${error.message}`);
    }
    
    return data || [];
  };

  const { data: medicines = [], isLoading: medicinesLoading, error: medicinesError } = useQuery({
    queryKey: ["medicines"],
    queryFn: fetchMedicines,
  });

  const fetchVendors = async (): Promise<Vendor[]> => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('name');
    
    if (error) {
      throw new Error(`Failed to fetch vendors: ${error.message}`);
    }
    
    return data || [];
  };

  const { data: vendors = [], isLoading: vendorsLoading, error: vendorsError } = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  });

  useEffect(() => {
    if (medicinesError) {
      console.error("Failed to fetch medicines:", medicinesError);
      toast({
        variant: "destructive",
        title: "Error fetching medicines",
        description: "Failed to load medicines from the server. Please check your connection.",
      });
    }

    if (vendorsError) {
      console.error("Failed to fetch vendors:", vendorsError);
      toast({
        variant: "destructive",
        title: "Error fetching vendors",
        description: "Failed to load vendors from the server. Please check your connection.",
      });
    }
  }, [medicinesError, vendorsError, toast]);

  const addMedicineForm = useForm<MedicineFormValues>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: "",
      price: 0,
      stock: 0,
      tax: 0,
      discount: 0,
      prescription_required: false,
      vendor_id: null,
      expiry_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] // Default to 30 days later
    }
  });

  const editMedicineForm = useForm<MedicineFormValues>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: "",
      price: 0,
      stock: 0,
      tax: 0,
      discount: 0,
      prescription_required: false,
      vendor_id: null,
      expiry_date: ""
    }
  });

  const handleDeleteMedicine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Could not delete medicine with ID ${id}`);
      }

      queryClient.invalidateQueries({ queryKey: ["medicines"] });

      toast({
        title: "Medicine Deleted",
        description: "The medicine has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting medicine:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete medicine",
        description: "There was an error deleting the medicine. Please try again.",
      });
    }
  };

  const handleAddSubmit = async (values: MedicineFormValues) => {
    try {
      const { error } = await supabase.from('medicines').insert([{
        name: values.name,
        price: values.price,
        stock: values.stock,
        tax: values.tax,
        discount: values.discount,
        expiry_date: values.expiry_date,
        prescription_required: values.prescription_required,
        vendor_id: values.vendor_id || null
      }]);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      toast({
        title: "Medicine Added",
        description: "The medicine has been successfully added to inventory."
      });
      setIsAddOpen(false);
      addMedicineForm.reset({
        name: "",
        price: 0,
        stock: 0,
        tax: 0,
        discount: 0,
        prescription_required: false,
        vendor_id: null,
        expiry_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error adding medicine:", error);
      toast({
        variant: "destructive",
        title: "Failed to add medicine",
        description: "There was an error adding the medicine. Please try again."
      });
    }
  };

  const handleEditClick = (medicine: MedicineWithVendor) => {
    setSelectedMedicine(medicine);
    editMedicineForm.reset({
      id: medicine.id,
      name: medicine.name,
      price: medicine.price,
      stock: medicine.stock,
      tax: medicine.tax,
      discount: medicine.discount || 0,
      expiry_date: medicine.expiry_date,
      prescription_required: medicine.prescription_required || false,
      vendor_id: medicine.vendor_id || null
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (values: MedicineFormValues) => {
    if (!values.id) return;
    
    try {
      const { error } = await supabase
        .from('medicines')
        .update({
          name: values.name,
          price: values.price,
          stock: values.stock,
          tax: values.tax,
          discount: values.discount,
          expiry_date: values.expiry_date,
          prescription_required: values.prescription_required,
          vendor_id: values.vendor_id || null
        })
        .eq('id', values.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      toast({
        title: "Medicine Updated",
        description: "The medicine has been successfully updated."
      });
      setIsEditOpen(false);
      setSelectedMedicine(null);
    } catch (error) {
      console.error("Error updating medicine:", error);
      toast({
        variant: "destructive",
        title: "Failed to update medicine",
        description: "There was an error updating the medicine. Please try again."
      });
    }
  };

  const formatDate = (dateString: string) => {
    return dateString ? format(new Date(dateString), 'dd/MM/yyyy') : 'N/A';
  };

  const calculateDiscountedPrice = (price: number, discount: number) => {
    return price * (1 - discount / 100);
  };

  const getMedicineStatus = (medicine: Medicine) => {
    const today = new Date();
    const expiryDate = new Date(medicine.expiry_date);
    const thirtyDaysLater = addDays(today, 30);
    
    if (isBefore(expiryDate, today)) {
      return {
        label: "Expired",
        variant: "destructive" as const,
        icon: <CalendarX className="h-3 w-3 mr-1" />,
        className: "bg-red-100 text-red-800 border-red-300 font-medium"
      };
    }
    
    if (isBefore(expiryDate, thirtyDaysLater)) {
      return {
        label: "Near Expiry",
        variant: "outline" as const, 
        className: "border-amber-500 text-amber-800 bg-amber-50 font-medium",
        icon: <AlertTriangle className="h-3 w-3 mr-1" />
      };
    }
    
    if (medicine.stock === 0) {
      return {
        label: "Out of Stock",
        variant: "outline" as const,
        className: "border-red-500 text-red-800 bg-red-50 font-medium",
        icon: <Package className="h-3 w-3 mr-1" />
      };
    }
    
    if (medicine.stock <= 50) {
      return {
        label: "Low Stock",
        variant: "outline" as const,
        className: "border-orange-500 text-orange-800 bg-orange-50 font-medium",
        icon: <Package className="h-3 w-3 mr-1" />
      };
    }
    
    return {
      label: "In Stock",
      variant: "outline" as const,
      className: "border-green-500 text-green-800 bg-green-50 font-medium",
      icon: <PackageCheck className="h-3 w-3 mr-1" />
    };
  };

  const filteredMedicines = medicines.filter((medicine) => {
    const matchesName = medicine.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVendor = vendorSearchQuery === "" || 
                         (medicine.vendors && 
                          medicine.vendors.name.toLowerCase().includes(vendorSearchQuery.toLowerCase()));
    return matchesName && matchesVendor;
  });

  const lowStockCount = medicines.filter(m => m.stock > 0 && m.stock <= 50).length;
  const outOfStockCount = medicines.filter(m => m.stock === 0).length;
  const expiredCount = medicines.filter(m => {
    const expiryDate = new Date(m.expiry_date);
    const today = new Date();
    return isBefore(expiryDate, today);
  }).length;
  const nearExpiryCount = medicines.filter(m => {
    const expiryDate = new Date(m.expiry_date);
    const today = new Date();
    const thirtyDaysLater = addDays(today, 30);
    return isAfter(expiryDate, today) && isBefore(expiryDate, thirtyDaysLater);
  }).length;

  const isLoading = medicinesLoading || vendorsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Medicine Inventory</h1>
        <Button onClick={() => setIsAddOpen(true)} className="btn-hover bg-medical-600 hover:bg-medical-700">
          <Plus className="mr-2" />
          Add Medicine
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-5 w-5 text-orange-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{lowStockCount}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">≤ 50 items in stock</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{outOfStockCount}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Items requiring reorder</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CalendarX className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{expiredCount}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Items past expiration date</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Near Expiry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{nearExpiryCount}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Expires within 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search medicines by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 input-focus border-gray-300"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <Search className="h-4 w-4" />
            </div>
          </div>
          
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by vendor name..."
              value={vendorSearchQuery}
              onChange={(e) => setVendorSearchQuery(e.target.value)}
              className="pl-10 input-focus border-gray-300"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <Store className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600 mb-4 mx-auto"></div>
            <p className="text-medical-600 font-medium">Loading medicines...</p>
          </div>
        </div>
      ) : filteredMedicines.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-md text-center shadow-sm">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-700 font-medium mb-2">No medicines found</p>
          <p className="text-gray-500 text-sm">Try adjusting your search or add a new medicine</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold text-textDark-primary">Name</TableHead>
                <TableHead className="font-semibold text-textDark-primary">Vendor</TableHead>
                <TableHead className="font-semibold text-textDark-primary">Price</TableHead>
                <TableHead className="font-semibold text-textDark-primary">Discount</TableHead>
                <TableHead className="font-semibold text-textDark-primary">Price After Discount</TableHead>
                <TableHead className="font-semibold text-textDark-primary">Stock</TableHead>
                <TableHead className="font-semibold text-textDark-primary">Tax</TableHead>
                <TableHead className="font-semibold text-textDark-primary">Expiry Date</TableHead>
                <TableHead className="font-semibold text-textDark-primary">Prescription</TableHead>
                <TableHead className="font-semibold text-textDark-primary">Status</TableHead>
                <TableHead className="text-right font-semibold text-textDark-primary">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedicines.map((medicine) => {
                const status = getMedicineStatus(medicine);
                const discountedPrice = calculateDiscountedPrice(medicine.price, medicine.discount || 0);
                
                return (
                  <TableRow key={medicine.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium text-textDark-primary">{medicine.name}</TableCell>
                    <TableCell className="text-textDark-secondary">
                      {medicine.vendors?.name || 'No vendor'}
                    </TableCell>
                    <TableCell className="text-textDark-secondary"><span className="font-sans">₹</span>{medicine.price.toFixed(2)}</TableCell>
                    <TableCell className="text-textDark-secondary">
                      {medicine.discount > 0 ? (
                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                          {medicine.discount}%
                        </Badge>
                      ) : '0%'}
                    </TableCell>
                    <TableCell className="text-textDark-secondary font-medium">
                      {medicine.discount > 0 ? (
                        <span className="text-green-600"><span className="font-sans">₹</span>{discountedPrice.toFixed(2)}</span>
                      ) : (
                        <span><span className="font-sans">₹</span>{discountedPrice.toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-textDark-secondary">{medicine.stock}</TableCell>
                    <TableCell className="text-textDark-secondary">{medicine.tax}%</TableCell>
                    <TableCell className="text-textDark-secondary">{formatDate(medicine.expiry_date)}</TableCell>
                    <TableCell className="text-textDark-secondary">
                      {medicine.prescription_required ? (
                        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300">
                          Required
                        </Badge>
                      ) : 'No'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className={status.className}>
                        <span className="flex items-center">
                          {status.icon}
                          {status.label}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="mr-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => handleEditClick(medicine)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50" 
                        onClick={() => handleDeleteMedicine(medicine.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[550px] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Add New Medicine</DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete the form below to add a new medicine to the inventory.
            </DialogDescription>
          </DialogHeader>
          <Form {...addMedicineForm}>
            <form onSubmit={addMedicineForm.handleSubmit(handleAddSubmit)} className="space-y-5">
              <FormField
                control={addMedicineForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 font-medium">Medicine Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter medicine name" className="border-gray-300 input-focus" {...field} />
                    </FormControl>
                    <FormDescription className="text-gray-500 text-xs">
                      Enter the complete medicine name as it appears on the packaging.
                    </FormDescription>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
              
              {/* Vendor Selection */}
              <FormField
                control={addMedicineForm.control}
                name="vendor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 font-medium">Vendor</FormLabel>
                    <Select
                      value={field.value?.toString() || undefined}
                      onValueChange={(value) => field.onChange(value || null)}
                    >
                      <FormControl>
                        <SelectTrigger className="border-gray-300 input-focus">
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-vendor">No vendor</SelectItem>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-gray-500 text-xs">
                      Select the vendor that supplies this medicine.
                    </FormDescription>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-5">
                <FormField
                  control={addMedicineForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Price (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00" 
                          className="border-gray-300 input-focus"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addMedicineForm.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Discount (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          className="border-gray-300 input-focus" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 text-xs">
                        Percentage discount on this medicine.
                      </FormDescription>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addMedicineForm.control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Tax (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          className="border-gray-300 input-focus" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <FormField
                  control={addMedicineForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Stock Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0"
                          className="border-gray-300 input-focus" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 text-xs">
                        How many units are currently available in stock.
                      </FormDescription>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addMedicineForm.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Expiry Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="border-gray-300 input-focus text-gray-900" 
                          min={today}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 text-xs">
                        The date this medicine batch will expire. Cannot be in the past.
                      </FormDescription>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Prescription Required Toggle */}
              <FormField
                control={addMedicineForm.control}
                name="prescription_required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-gray-900 font-medium">Prescription Required</FormLabel>
                      <FormDescription className="text-gray-500 text-xs">
                        Toggle if this medicine requires a prescription before sale.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-8 pt-4 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-medical-600 hover:bg-medical-700 text-white font-medium"
                >
                  Save Medicine
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[550px] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Edit Medicine</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update the medicine details in the inventory.
            </DialogDescription>
          </DialogHeader>
          <Form {...editMedicineForm}>
            <form onSubmit={editMedicineForm.handleSubmit(handleEditSubmit)} className="space-y-5">
              <input type="hidden" {...editMedicineForm.register("id")} />
              <FormField
                control={editMedicineForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 font-medium">Medicine Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter medicine name" className="border-gray-300 input-focus" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
              
              {/* Vendor Selection for Edit Form */}
              <FormField
                control={editMedicineForm.control}
                name="vendor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 font-medium">Vendor</FormLabel>
                    <Select
                      value={field.value?.toString() || undefined}
                      onValueChange={(value) => field.onChange(value === "no-vendor" ? null : value)}
                    >
                      <FormControl>
                        <SelectTrigger className="border-gray-300 input-focus">
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-vendor">No vendor</SelectItem>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-gray-500 text-xs">
                      Select the vendor that supplies this medicine.
                    </FormDescription>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-5">
                <FormField
                  control={editMedicineForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Price (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          className="border-gray-300 input-focus" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editMedicineForm.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Discount (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          className="border-gray-300 input-focus" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 text-xs">
                        Percentage discount on this medicine.
                      </FormDescription>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editMedicineForm.control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Tax (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          className="border-gray-300 input-focus" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <FormField
                  control={editMedicineForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Stock Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0"
                          className="border-gray-300 input-focus" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editMedicineForm.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">Expiry Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="border-gray-300 input-focus text-gray-900" 
                          min={today}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 text-xs">
                        The date this medicine batch will expire. Cannot be in the past.
                      </FormDescription>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Prescription Required Toggle */}
              <FormField
                control={editMedicineForm.control}
                name="prescription_required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-gray-900 font-medium">Prescription Required</FormLabel>
                      <FormDescription className="text-gray-500 text-xs">
                        Toggle if this medicine requires a prescription before sale.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-8 pt-4 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-medical-600 hover:bg-medical-700 text-white font-medium"
                >
                  Update Medicine
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Medicines;
