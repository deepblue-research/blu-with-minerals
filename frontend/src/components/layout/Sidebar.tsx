import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  RefreshCw,
  Settings,
  Receipt
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Recurring', href: '/recurring', icon: RefreshCw },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-100">
        <Receipt className="h-8 w-8 text-primary" />
        <span className="ml-3 text-xl font-bold tracking-tight text-gray-900">
          Invoice<span className="text-primary">App</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={clsx(
                    'mr-3 h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-gray-100">
        <div className="flex items-center p-3 rounded-xl bg-gray-50">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            AD
          </div>
          <div className="ml-3">
            <p className="text-sm font-semibold text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">Free Tier</p>
          </div>
        </div>
      </div>
    </div>
  );
};
