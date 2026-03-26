import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  RefreshCw,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import {
  Button,
  Avatar,
  ListBox,
  ScrollShadow,
  Separator,
  Drawer,
  useOverlayState,
  Label
} from '@heroui/react';

/**
 * Main application layout component.
 * Provides a responsive navigation system:
 * - Desktop: Permanent left sidebar with ListBox navigation.
 * - Mobile: Top header with a Drawer menu.
 */
export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // HeroUI v3 Drawer state
  const drawerState = useOverlayState();

  // Load user data from localStorage (populated during Google Login)
  const userJson = localStorage.getItem('auth_user');
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/login');
  };

  const navigation = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/invoices', icon: <FileText size={20} />, label: 'Invoices' },
    { to: '/clients', icon: <Users size={20} />, label: 'Clients' },
    { to: '/recurring', icon: <RefreshCw size={20} />, label: 'Recurring' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  /**
   * Internal sidebar content shared between desktop aside and mobile drawer
   */
  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6">
      <div className="px-6 mb-8 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight text-foreground">Invoices</span>
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={drawerState.close}
          className="lg:hidden -mr-2"
          aria-label="Close menu"
        >
          <X size={20} />
        </Button>
      </div>

      <ScrollShadow className="flex-1 px-3">
        <ListBox
          aria-label="Main Navigation"
          variant="default"
          selectionMode="single"
          selectedKeys={new Set([location.pathname])}
          onSelectionChange={(keys) => {
            if (keys !== "all" && keys.size > 0) {
              const key = Array.from(keys)[0];
              navigate(key as string);
              drawerState.close();
            }
          }}
          className="gap-1"
        >
          {navigation.map((item) => (
            <ListBox.Item
              key={item.to}
              id={item.to}
              textValue={item.label}
              className={location.pathname === item.to ? "bg-accent/10 text-accent" : "text-muted"}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </div>
            </ListBox.Item>
          ))}
        </ListBox>
      </ScrollShadow>

      <div className="mt-auto px-4 pt-4 border-t border-separator space-y-4">
        {user && (
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar size="sm">
              <Avatar.Image src={user.picture} alt={user.name} />
              <Avatar.Fallback className="bg-accent/10 text-accent font-bold text-xs">
                {user.name?.charAt(0) || 'U'}
              </Avatar.Fallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-muted truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          fullWidth
          variant="ghost"
          className="justify-start font-medium h-11 text-danger hover:bg-danger/10"
          onPress={handleLogout}
        >
          <LogOut size={20} className="mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      {/*
          Mobile Header
          Visible only on screens smaller than 'lg' (1024px)
      */}
      <header className="lg:hidden flex items-center justify-between px-4 h-16 border-b border-separator bg-surface sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            variant="tertiary"
            onPress={drawerState.open}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </Button>
          <span className="font-bold text-lg tracking-tight">Invoices</span>
        </div>
      </header>

      {/*
          Mobile Menu Drawer
      */}
      <Drawer>
        <Drawer.Backdrop isOpen={drawerState.isOpen} onOpenChange={drawerState.setOpen}>
          <Drawer.Content placement="left" className="w-72 max-w-[85vw]">
            <Drawer.Dialog className="bg-surface outline-none">
              <Drawer.Body className="p-0">
                <SidebarContent />
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>

      {/*
          Desktop Sidebar
          Visible only on 'lg' screens and above.
      */}
      <aside className="hidden lg:flex w-64 bg-surface border-r border-separator flex-col sticky top-0 h-screen overflow-hidden">
        <SidebarContent />
      </aside>

      {/*
          Main Content Area
      */}
      <main className="flex-1 w-full overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
