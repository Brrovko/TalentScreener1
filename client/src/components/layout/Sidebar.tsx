import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutGrid, 
  ClipboardList, 
  Users, 
  Settings, 
  Menu, 
  X,
  LogOut
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();

  const isActive = (path: string): boolean => {
    if (path === "/dashboard" && location === "/dashboard") return true;
    if (path === "/dashboard") return false;
    return location.startsWith(path);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Function to create navigation item with consistent styling
  const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
    const active = isActive(to);
    
    const handleMobileNavClick = () => {
      if (isMobile) {
        setMobileMenuOpen(false);
      }
    };
    
    return (
      <li>
        <Link href={to} onClick={handleMobileNavClick}>
          <div 
            className={`flex items-center px-4 py-3 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer ${
              active ? "bg-primary-50 text-primary-600 font-medium" : ""
            }`}
          >
            {icon}
            {label}
          </div>
        </Link>
      </li>
    );
  };

  // Mobile menu header
  const MobileHeader = () => (
    <div className="flex items-center justify-between p-4 border-b border-neutral-200 md:hidden">
      <h1 className="text-lg font-semibold text-neutral-800">{t('common.app_name')}</h1>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <button 
          onClick={toggleMobileMenu}
          className="p-1 rounded-md hover:bg-neutral-100"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );

  // User profile section
  const UserProfile = () => {
    if (!user) return null;
    
    // Get initials from the user's full name
    const initials = user.fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    const handleLogout = () => {
      logoutMutation.mutate();
    };
    
    // Role labels for display
    const roleLabels = {
      admin: "Администратор",
      recruiter: "Рекрутер",
      interviewer: "Интервьюер"
    };
    
    return (
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center text-sm mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center mr-3">
            <span>{initials}</span>
          </div>
          <div className="flex-1">
            <p className="font-medium">{user.fullName}</p>
            <p className="text-neutral-500 text-xs">{roleLabels[user.role] || user.role}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="w-full flex justify-center items-center gap-2"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4" />
          <span>Выйти</span>
        </Button>
      </div>
    );
  };

  // Navigation items
  const Navigation = () => (
    <nav className="flex-1 overflow-y-auto py-4">
      <ul>
        <NavItem 
          to="/dashboard" 
          icon={<LayoutGrid className="h-5 w-5 mr-3" />} 
          label={t('common.dashboard')} 
        />
        <NavItem 
          to="/dashboard/tests" 
          icon={<ClipboardList className="h-5 w-5 mr-3" />} 
          label={t('common.tests')} 
        />
        <NavItem 
          to="/dashboard/candidates" 
          icon={<Users className="h-5 w-5 mr-3" />} 
          label={t('common.candidates')} 
        />
        <NavItem 
          to="/dashboard/settings" 
          icon={<Settings className="h-5 w-5 mr-3" />} 
          label={t('common.settings')} 
        />
      </ul>
    </nav>
  );

  return (
    <>
      {/* Mobile menu header - always visible on mobile */}
      <div className="md:hidden sticky top-0 left-0 right-0 bg-white z-20 shadow-sm">
        <MobileHeader />
      </div>

      {/* Mobile menu - conditionally visible */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={toggleMobileMenu}>
          <div 
            className="absolute top-0 left-0 w-64 h-full bg-white shadow-lg transform transition-transform" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-neutral-200">
                <h1 className="text-xl font-semibold text-neutral-800">{t('common.app_name')}</h1>
              </div>
              <Navigation />
              <UserProfile />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar - always visible on desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-neutral-200 bg-white">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-neutral-800">{t('common.app_name')}</h1>
        </div>
        <Navigation />
        <div className="py-2 px-4 border-t border-neutral-200">
          <LanguageSwitcher />
        </div>
        <UserProfile />
      </aside>
    </>
  );
};

export default Sidebar;
