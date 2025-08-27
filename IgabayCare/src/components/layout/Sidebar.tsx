import React, { useState, useEffect } from "react";
import { User, Building, Menu, X, Heart, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string | number;
  children?: NavigationItem[];
}

interface SidebarProps {
  navigationItems: NavigationItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  user: any;
  variant?: "patient" | "clinic" | "doctor";
}

export const Sidebar: React.FC<SidebarProps> = ({
  navigationItems,
  activeTab,
  onTabChange,
  user,
  variant = "patient",
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const isPatient = variant === "patient";
  const isDoctor = variant === "doctor";
  const Icon = isPatient ? User : isDoctor ? User : Building;
  const title = "iGabayAtiCare";
  const subtitle = isPatient ? "Patient Portal" : isDoctor ? "Doctor Portal" : "Clinic Portal";

  // Enhanced user name extraction with better fallbacks
  const getUserName = () => {
    if (isPatient) {
      return user?.firstName || user?.user?.user_metadata?.first_name || "Patient";
    } else if (isDoctor) {
      return user?.full_name || user?.firstName || user?.user?.user_metadata?.first_name || "Doctor";
    } else {
      // For clinic users, try multiple possible clinic name sources
      return (
        user?.clinic_name ||
        user?.clinicName ||
        user?.user_metadata?.clinic_name ||
        user?.user?.user_metadata?.clinic_name ||
        "Clinic"
      );
    }
  };

  const userName = getUserName();
  const userEmail = user?.email || user?.user?.email || "user@example.com";

  // Auto-collapse on medium screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getVariantStyles = () => {
    if (isPatient) {
      return {
        primary: "bg-blue-600 hover:bg-blue-700",
        secondary: "bg-blue-50 text-blue-700 hover:bg-blue-100",
        active: "bg-blue-50 text-blue-700 border-blue-200",
        icon: "bg-gradient-to-r from-blue-500 to-blue-600",
        userIcon: "bg-blue-100 text-blue-600",
      };
    } else if (isDoctor) {
      return {
        primary: "bg-purple-600 hover:bg-purple-700",
        secondary: "bg-purple-50 text-purple-700 hover:bg-purple-100",
        active: "bg-purple-50 text-purple-700 border-purple-200",
        icon: "bg-gradient-to-r from-purple-500 to-purple-600",
        userIcon: "bg-purple-100 text-purple-600",
      };
    } else {
      return {
        primary: "bg-emerald-600 hover:bg-emerald-700",
        secondary: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        active: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "bg-gradient-to-r from-emerald-500 to-emerald-600",
        userIcon: "bg-emerald-100 text-emerald-600",
      };
    }
  };

  const styles = getVariantStyles();

  const toggleGroup = (groupId: string) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(groupId)) {
      newOpenGroups.delete(groupId);
    } else {
      newOpenGroups.add(groupId);
    }
    setOpenGroups(newOpenGroups);
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const ItemIcon = item.icon;
    const isActive = activeTab === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isGroupOpen = openGroups.has(item.id);

    const navItemContent = (
      <div
        className={cn(
          "flex items-center w-full rounded-lg transition-all duration-200 group relative",
          level === 0 ? "p-3" : "p-2 ml-4",
          isActive
            ? cn("border", styles.active)
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <ItemIcon className={cn("h-5 w-5 flex-shrink-0", isActive ? "opacity-100" : "opacity-70")} />
        {!isCollapsed && (
          <>
            <span className={cn("font-medium truncate", level === 0 ? "ml-3" : "ml-2")}>
              {item.label}
            </span>
            {item.badge && (
              <span
                className={cn(
                  "ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full",
                  styles.secondary
                )}
              >
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronDown
                className={cn(
                  "ml-auto h-4 w-4 transition-transform duration-200",
                  isGroupOpen && "rotate-180"
                )}
              />
            )}
          </>
        )}
        {/* Tooltip for collapsed state */}
        {isCollapsed && level === 0 && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {item.label}
            {item.badge && <span className="ml-2 text-xs">({item.badge})</span>}
          </div>
        )}
      </div>
    );

    if (hasChildren && !isCollapsed) {
      return (
        <Collapsible key={item.id} open={isGroupOpen} onOpenChange={() => toggleGroup(item.id)}>
          <CollapsibleTrigger asChild>
            <button className="w-full text-left">{navItemContent}</button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {item.children?.map((child) => renderNavigationItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <TooltipProvider key={item.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                onTabChange(item.id);
                setIsMobileOpen(false);
              }}
              className="w-full text-left"
            >
              {navItemContent}
            </button>
          </TooltipTrigger>
          {isCollapsed && level === 0 && (
            <TooltipContent side="right" className="flex items-center gap-4">
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-xs bg-slate-600 text-white px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  const SidebarContent = () => (
    <div
      className={cn(
        "bg-white shadow-xl border-r border-slate-200 flex flex-col h-full transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className={cn("p-2 rounded-lg shadow-sm flex-shrink-0", styles.icon)}>
            <Heart className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 truncate">{title}</h1>
              <p className="text-sm text-slate-500 truncate">{subtitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button - Only show on large screens */}
      <div className="p-2 border-b border-slate-200 hidden md:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-center h-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <TooltipProvider>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => renderNavigationItem(item))}
        </nav>
      </TooltipProvider>

      {/* User Profile Section */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center space-x-3">
          <div className={cn("p-2 rounded-lg flex-shrink-0", styles.userIcon)}>
            <Icon className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{userName || "User"}</p>
              <p className="text-xs text-slate-500 truncate">{userEmail || "user@example.com"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-lg"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>
    </>
  );
}; 