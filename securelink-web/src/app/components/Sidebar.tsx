"use client";

import { LockIcon, Share2Icon } from "lucide-react";
import { cn } from "@/app/utils/fileHelpers";

interface SidebarItemProps {
  icon: any;
  label: string;
  id: string;
  activeTab: string;
  onClick: (id: string) => void;
}

export const SidebarItem = ({ icon: Icon, label, id, activeTab, onClick }: SidebarItemProps) => {
  const active = activeTab === id;
  return (
    <div 
      onClick={() => onClick(id)}
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
        active 
          ? "bg-blue-50 text-blue-700 font-semibold" 
          : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
      )}
    >
      <Icon size={20} />
      <span className="text-sm">{label}</span>
    </div>
  );
};

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
  onLogout: () => void;
  branding: { appName: string; logoUrl?: string };
}

export const Sidebar = ({ activeTab, onTabChange, userName, onLogout, branding }: SidebarProps) => {
  const { ShieldIcon, UserIcon, LogOutIcon } = require("lucide-react");
  
  return (
    <aside className="w-64 border-r border-gray-200 bg-white p-6 flex flex-col shadow-sm">
      <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-gray-200">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt={branding.appName} className="w-10 h-10 rounded-lg" />
        ) : (
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <ShieldIcon size={24} className="text-white" />
          </div>
        )}
        <div>
          <a href="/">
            <h1 className="text-xl font-bold text-gray-900">{branding.appName}</h1>
          </a>
          <p className="text-xs text-gray-500">Secure Storage</p>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <p className="text-xs uppercase font-semibold text-gray-500 mb-3 px-3">Navigation</p>
        <SidebarItem icon={LockIcon} label="My Vault" id="all" activeTab={activeTab} onClick={onTabChange} />
        <SidebarItem icon={Share2Icon} label="Shared Links" id="shared" activeTab={activeTab} onClick={onTabChange} />
      </div>

      <div className="mt-auto pt-6 border-t border-gray-200">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {userName?.charAt(0) || <UserIcon size={16} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-gray-900">{userName}</p>
            <button 
              onClick={onLogout}
              className="text-xs text-red-600 hover:text-red-700 transition-colors font-medium flex items-center space-x-1"
            >
              <LogOutIcon size={12} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

