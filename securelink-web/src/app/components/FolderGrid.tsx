"use client";

import { FolderIcon, SettingsIcon, Share2Icon, KeyIcon, CalendarIcon } from "lucide-react";
import { FolderType } from "@/app/types";
import { calculateDaysRemaining } from "@/app/utils/dateHelpers";

interface FolderGridProps {
  folders: FolderType[];
  onFolderClick: (folder: FolderType) => void;
  onFolderSettings: (folder: FolderType) => void;
  onShareFolder: (folder: FolderType) => void;
}

export const FolderGrid = ({
  folders,
  onFolderClick,
  onFolderSettings,
  onShareFolder,
}: FolderGridProps) => {
  if (folders.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-xs uppercase font-semibold text-gray-500 mb-4 flex items-center space-x-2">
        <FolderIcon size={14} />
        <span>Folders</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div 
                onClick={() => onFolderClick(folder)}
                className="flex-1"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                  <FolderIcon size={20} className="text-blue-500" />
                </div>
                <p className="font-semibold text-gray-900 truncate">{folder.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(folder.createdAt).toLocaleDateString()}
                </p>
                {folder.expiresAt && (
                  <div className="flex items-center space-x-1 mt-1 text-xs text-gray-600">
                    <CalendarIcon size={12} />
                    <span>{calculateDaysRemaining(folder.expiresAt)}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFolderSettings(folder);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-700"
                  title="Settings"
                >
                  <SettingsIcon size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareFolder(folder);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-700"
                  title="Share"
                >
                  <Share2Icon size={16} />
                </button>
              </div>
            </div>
            {folder.shareToken && (
              <div className="mt-2 flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                <Share2Icon size={12} className="text-green-600" />
                <span className="text-xs text-green-700 font-medium">Shared</span>
              </div>
            )}
            {folder.pinHash && (
              <div className="mt-2 flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                <KeyIcon size={12} className="text-amber-600" />
                <span className="text-xs text-amber-700 font-medium">PIN Protected</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

