import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { SystemProvider } from "@/context/SystemContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Ads from "./pages/Ads";
import Orders from "./pages/Orders";
import ChatConfig from "./pages/ChatConfig";
import Payments from "./pages/Payments";
import Tds from "./pages/Tds";
import Convert from "./pages/Convert";
import NotFound from "./pages/NotFound.tsx";
import SellerDashboard from "./pages/SellerDashboard";
import SellerAds from "./pages/SellerAds";
import SellerOrders from "./pages/SellerOrders";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner
        theme="dark"
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "!bg-card !border !border-border !text-foreground !rounded-xl !shadow-[var(--shadow-elevated)]",
            success: "!border-success/40",
            error: "!border-destructive/40",
            warning: "!border-warning/40",
            info: "!border-info/40",
          },
        }}
      />
      <BrowserRouter>
        <AuthProvider>
          <SystemProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
              <Route path="/ads" element={<ProtectedRoute><Ads /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatConfig /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/tds" element={<ProtectedRoute><Tds /></ProtectedRoute>} />
              <Route path="/convert" element={<ProtectedRoute><Convert /></ProtectedRoute>} />
              {/* Seller Routes */}
              <Route path="/seller" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
              <Route path="/seller/ads" element={<ProtectedRoute><SellerAds /></ProtectedRoute>} />
              <Route path="/seller/orders" element={<ProtectedRoute><SellerOrders /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SystemProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
