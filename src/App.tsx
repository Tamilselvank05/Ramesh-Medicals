
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Layouts
import AdminLayout from "./components/AdminLayout";
import BillingLayout from "./components/BillingLayout";

// Auth
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Medicines from "./pages/admin/Medicines";
import Vendors from "./pages/admin/Vendors";
import Alerts from "./pages/admin/Alerts";
import Reports from "./pages/admin/Reports";
import ProfilePage from "./pages/ProfilePage";

// Billing Pages
import Billing from "./pages/billing/Billing";
import InvoiceHistory from "./pages/billing/InvoiceHistory";
import AllInvoices from "./pages/billing/AllInvoices";

// Other
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/medicines" element={<Medicines />} />
                <Route path="/admin/vendors" element={<Vendors />} />
                <Route path="/admin/alerts" element={<Alerts />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/profile" element={<ProfilePage />} />
              </Route>
            </Route>
            
            {/* Biller Routes */}
            <Route element={<PrivateRoute allowedRoles={["biller", "admin"]} />}>
              <Route element={<BillingLayout />}>
                <Route path="/billing" element={<Billing />} />
                <Route path="/billing/history" element={<InvoiceHistory />} />
                <Route path="/billing/all-invoices" element={<AllInvoices />} />
                <Route path="/billing/profile" element={<ProfilePage />} />
              </Route>
            </Route>
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
