import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import OrdersAccept from "./pages/OrdersAccept";
import OrdersManage from "./pages/OrdersManage";
import OrdersRequest from "./pages/OrdersRequest";
import OrdersAll from "./pages/OrdersAll";
import CalendarView from "./pages/CalendarView";
import Settlements from "./pages/Settlements";
import SettlementsManage from "./pages/SettlementsManage";
import Partners from "./pages/Partners";
import Users from "./pages/Users";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import ContractsManage from "./pages/ContractsManage";
import ContractCreate from "./pages/ContractCreate";
import ContractResponseSimple from "./pages/ContractResponseSimple";
import ContractTemplates from "./pages/ContractTemplates";
import ContractTemplateForm from "./pages/ContractTemplateForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/orders/accept" element={<OrdersAccept />} />
          <Route path="/orders/manage" element={<OrdersManage />} />
          <Route path="/orders/request" element={<OrdersRequest />} />
          <Route path="/orders/all" element={<OrdersAll />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/settlements" element={<Settlements />} />
          <Route path="/settlements/manage" element={<SettlementsManage />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/users" element={<Users />} />
          <Route path="/contracts" element={<ContractsManage />} />
          <Route path="/contracts/create" element={<ContractCreate />} />
          <Route path="/contracts/templates" element={<ContractTemplates />} />
          <Route path="/contracts/templates/create" element={<ContractTemplateForm />} />
          <Route path="/contracts/templates/edit/:id" element={<ContractTemplateForm />} />
          <Route path="/contract/:token" element={<ContractResponseSimple />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
