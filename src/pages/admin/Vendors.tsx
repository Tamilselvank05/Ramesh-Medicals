import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Vendor } from "@/types/vendor";
import { Pencil, Trash2, Store, Phone, Mail, MapPin, Search, FileText, Download } from "lucide-react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    shop_address: "",
    phone: "",
    email: "",
  });
  
  useEffect(() => {
    fetchVendors();
  }, []);
  
  useEffect(() => {
    if (searchQuery) {
      const filtered = vendors.filter(vendor => 
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVendors(filtered);
    } else {
      setFilteredVendors(vendors);
    }
  }, [searchQuery, vendors]);
  
  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("name");
      
      if (error) throw error;
      
      setVendors(data as Vendor[]);
      setFilteredVendors(data as Vendor[]);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.shop_address || !formData.phone) {
      toast.error("Name, address and phone are required fields");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("vendors")
        .insert([
          {
            name: formData.name,
            shop_address: formData.shop_address,
            phone: formData.phone,
            email: formData.email || null,
          },
        ]);
      
      if (error) throw error;
      
      toast.success("Vendor added successfully");
      setIsAddDialogOpen(false);
      setFormData({ name: "", shop_address: "", phone: "", email: "" });
      fetchVendors();
    } catch (error) {
      console.error("Error adding vendor:", error);
      toast.error("Failed to add vendor");
    }
  };
  
  const handleEditDialogOpen = (vendor: Vendor) => {
    setCurrentVendor(vendor);
    setFormData({
      name: vendor.name,
      shop_address: vendor.shop_address,
      phone: vendor.phone,
      email: vendor.email || "",
    });
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentVendor) return;
    
    if (!formData.name || !formData.shop_address || !formData.phone) {
      toast.error("Name, address and phone are required fields");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("vendors")
        .update({
          name: formData.name,
          shop_address: formData.shop_address,
          phone: formData.phone,
          email: formData.email || null,
        })
        .eq("id", currentVendor.id);
      
      if (error) throw error;
      
      toast.success("Vendor updated successfully");
      setIsEditDialogOpen(false);
      setFormData({ name: "", shop_address: "", phone: "", email: "" });
      setCurrentVendor(null);
      fetchVendors();
    } catch (error) {
      console.error("Error updating vendor:", error);
      toast.error("Failed to update vendor");
    }
  };
  
  const handleDeleteDialogOpen = (vendor: Vendor) => {
    setCurrentVendor(vendor);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteVendor = async () => {
    if (!currentVendor) return;
    
    try {
      // First check if this vendor is associated with any medicines
      const { data: medicines, error: checkError } = await supabase
        .from("medicines")
        .select("id")
        .eq("vendor_id", currentVendor.id);
      
      if (checkError) throw checkError;
      
      if (medicines && medicines.length > 0) {
        toast.error(`Cannot delete vendor: ${medicines.length} medicines are associated with this vendor`);
        setIsDeleteDialogOpen(false);
        setCurrentVendor(null);
        return;
      }
      
      const { error } = await supabase
        .from("vendors")
        .delete()
        .eq("id", currentVendor.id);
      
      if (error) throw error;
      
      toast.success("Vendor deleted successfully");
      setIsDeleteDialogOpen(false);
      setCurrentVendor(null);
      fetchVendors();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast.error("Failed to delete vendor");
    }
  };
  
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add shop logo and header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("MediTrack Pharmacy", doc.internal.pageSize.width / 2, 15, { align: "center" });
      
      // Shop details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("123 Health Avenue, Medical District", doc.internal.pageSize.width - 10, 25, { align: "right" });
      doc.text("Phone: +91 9443654109", doc.internal.pageSize.width - 10, 30, { align: "right" });
      doc.text("Email: r.mailtoramesh@gmail.com", doc.internal.pageSize.width - 10, 35, { align: "right" });
      
      // Report title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Vendor List Report", 14, 45);
      
      // Date of report
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      })}`, 14, 52);
      
      autoTable(doc, {
        head: [['Name', 'Address', 'Phone', 'Email']],
        body: filteredVendors.map(vendor => [
          vendor.name,
          vendor.shop_address,
          vendor.phone,
          vendor.email || 'N/A'
        ]),
        startY: 60
      });
      
      doc.save("vendors-list.pdf");
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const exportToExcel = () => {
    try {
      const data = filteredVendors.map(vendor => ({
        'Name': vendor.name,
        'Address': vendor.shop_address,
        'Phone': vendor.phone,
        'Email': vendor.email || 'N/A'
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors");
      XLSX.writeFile(workbook, "vendors-list.xlsx");
      
      toast.success('Excel exported successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Vendors</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="bg-red-500 hover:bg-red-600 text-white" 
            onClick={exportToPDF}
            disabled={filteredVendors.length === 0}
          >
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button 
            variant="outline" 
            className="bg-green-600 hover:bg-green-700 text-white" 
            onClick={exportToExcel}
            disabled={filteredVendors.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button onClick={() => {
            setFormData({ name: "", shop_address: "", phone: "", email: "" });
            setIsAddDialogOpen(true);
          }}>Add Vendor</Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="relative max-w-md w-full">
          <Input
            type="text"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-focus border-gray-300"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            <Search className="h-4 w-4" />
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Vendor List</CardTitle>
          <CardDescription>
            Manage your product suppliers and distributors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading vendors...</div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8">
              <Store className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No vendors found</h3>
              <p className="mt-1 text-gray-500">{searchQuery ? "Try a different search term" : "Get started by adding your first vendor."}</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                          <span className="text-gray-600">{vendor.shop_address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">{vendor.phone}</span>
                          </div>
                          {vendor.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">{vendor.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDialogOpen(vendor)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDialogOpen(vendor)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add Vendor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
            <DialogDescription>
              Enter vendor details to add a new supplier to your system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddVendor} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Vendor Name*
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter vendor name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="shop_address" className="text-sm font-medium text-gray-700">
                Shop Address*
              </label>
              <Textarea
                id="shop_address"
                name="shop_address"
                placeholder="Enter complete shop address"
                value={formData.shop_address}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number*
              </label>
              <Input
                id="phone"
                name="phone"
                placeholder="Enter contact number"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email (Optional)
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-primary"
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Vendor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Vendor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>
              Update the details for this vendor.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateVendor} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                Vendor Name*
              </label>
              <Input
                id="edit-name"
                name="name"
                placeholder="Enter vendor name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-shop_address" className="text-sm font-medium text-gray-700">
                Shop Address*
              </label>
              <Textarea
                id="edit-shop_address"
                name="shop_address"
                placeholder="Enter complete shop address"
                value={formData.shop_address}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-phone" className="text-sm font-medium text-gray-700">
                Phone Number*
              </label>
              <Input
                id="edit-phone"
                name="phone"
                placeholder="Enter contact number"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-email" className="text-sm font-medium text-gray-700">
                Email (Optional)
              </label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-primary"
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Vendor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vendor? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentVendor && (
              <div className="border rounded-md p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-800">{currentVendor.name}</h4>
                <p className="text-gray-600 text-sm mt-1">{currentVendor.shop_address}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteVendor}
            >
              Delete Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vendors;
