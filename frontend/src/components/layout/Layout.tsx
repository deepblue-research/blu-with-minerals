import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  RefreshCw,
  Settings,
  LogOut
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for tailwind class merging
 */
function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const NavItem = ({ to, icon, label, active }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium",
      active
        ? "bg-blue-50 text-blue-600"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    )}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export const Layout: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/invoices', icon: <FileText size={20} />, label: 'Invoices' },
    { to: '/clients', icon: <Users size={20} />, label: 'Clients' },
    { to: '/recurring', icon: <RefreshCw size={20} />, label: 'Recurring' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-10">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">I</div>
            <span className="text-xl font-bold tracking-tight text-gray-900">InvoiceFlow</span>
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                active={location.pathname === item.to}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100">
          <button className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 transition-colors w-full font-medium">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
