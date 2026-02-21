"use client";

import { FolderIcon, ChevronRightIcon, SettingsIcon } from "lucide-react";
import { BreadcrumbItem, FolderType } from "@/app/types";

interface HeaderProps {
  currentFolderName: string;
  currentFolderId: string | null;
  breadcrumbs: BreadcrumbItem[];
  activeTab: string;
  folders: FolderType[];
  onBackToRoot: () => void;
  onBreadcrumbClick: (folderId: string) => void;
  onFolderSettings: (folder: FolderType) => void;
}

export const Header = ({
  currentFolderName,
  currentFolderId,
  breadcrumbs,
  activeTab,
  folders,
  onBackToRoot,
  onBreadcrumbClick,
  onFolderSettings,
}: HeaderProps) => {
  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <FolderIcon size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">{currentFolderName}</h2>
          {currentFolderId && (
            <button
              onClick={() => {
                const folder = folders.find(f => f.id === currentFolderId);
                if (folder) onFolderSettings(folder);
              }}
              className="p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Folder Settings"
            >
              <SettingsIcon size={16} />
            </button>
          )}
        </div>
        {breadcrumbs.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <button
              onClick={onBackToRoot}
              className="hover:text-gray-900 transition-colors font-medium"
            >
              Root
            </button>
            {breadcrumbs.map((crumb) => (
              <div key={crumb.id} className="flex items-center space-x-2">
                <ChevronRightIcon size={14} />
                <button
                  onClick={() => onBreadcrumbClick(crumb.id)}
                  className="hover:text-gray-900 transition-colors font-medium"
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="text-sm text-gray-500 font-medium">
        {activeTab === "shared" ? "Shared" : "Vault"}
      </div>
    </header>
  );
};

