import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceDetails from "./pages/InvoiceDetails";
import RecurringSchedules from "./pages/RecurringSchedules";
import Settings from "./pages/Settings";

const NotFound = () => (
  <div className="p-6 text-center">
    <h1 className="text-4xl font-bold mb-2 text-gray-800">404</h1>
    <p className="text-gray-600">Page not found.</p>
  </div>
);

/**
 * Main Application Component
 * Defines the routing structure and integrates the Layout wrapper.
 * The Router is already provided in main.tsx, so we don't wrap it here.
 */
const App: React.FC = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Main Modules */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/new" element={<CreateInvoice />} />
        <Route path="/invoices/:id" element={<InvoiceDetails />} />
        <Route path="/recurring" element={<RecurringSchedules />} />
        <Route path="/settings" element={<Settings />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default App;
