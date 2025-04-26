import { Link, useLocation } from "wouter";
import { LayoutGrid, ClipboardList, Users, Settings } from "lucide-react";

const Sidebar = () => {
  const [location] = useLocation();

  const isActive = (path: string): boolean => {
    if (path === "/" && location === "/") return true;
    if (path === "/") return false;
    return location.startsWith(path);
  };

  // Function to create navigation item with consistent styling
  const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
    const active = to === "/dashboard" 
      ? isActive("/dashboard") || isActive("/") 
      : isActive(to);
    
    return (
      <li>
        <Link href={to}>
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

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-neutral-200 bg-white">
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-xl font-semibold text-neutral-800">Applicant Screening</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          <NavItem 
            to="/dashboard" 
            icon={<LayoutGrid className="h-5 w-5 mr-3" />} 
            label="Dashboard" 
          />
          <NavItem 
            to="/tests" 
            icon={<ClipboardList className="h-5 w-5 mr-3" />} 
            label="Tests" 
          />
          <NavItem 
            to="/candidates" 
            icon={<Users className="h-5 w-5 mr-3" />} 
            label="Candidates" 
          />
          <NavItem 
            to="/settings" 
            icon={<Settings className="h-5 w-5 mr-3" />} 
            label="Settings" 
          />
        </ul>
      </nav>
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center text-sm">
          <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center mr-3">
            <span>JD</span>
          </div>
          <div>
            <p className="font-medium">Admin User</p>
            <p className="text-neutral-500 text-xs">HR Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
