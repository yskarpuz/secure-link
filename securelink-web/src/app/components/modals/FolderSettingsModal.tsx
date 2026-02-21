"use client";

import { CalendarIcon } from "lucide-react";
import { FolderType, FolderSettings } from "@/app/types";

interface FolderSettingsModalProps {
  show: boolean;
  folder: FolderType | null;
  settings: FolderSettings;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onSettingsChange: (settings: FolderSettings) => void;
  onDelete: (folderId: string, folderName: string) => void;
}

export const FolderSettingsModal = ({
  show,
  folder,
  settings,
  saving,
  onClose,
  onSubmit,
  onSettingsChange,
  onDelete,
}: FolderSettingsModalProps) => {
  if (!show || !folder) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Folder Settings</h2>
        <form onSubmit={onSubmit}>
          <p className="text-sm text-gray-600 mb-4">
            Folder: <span className="font-semibold text-gray-900">{folder.name}</span>
          </p>
          
          <div className="mb-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowAnonymousView}
                onChange={(e) => onSettingsChange({...settings, allowAnonymousView: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Allow anonymous viewing</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowAnonymousUpload}
                onChange={(e) => onSettingsChange({...settings, allowAnonymousUpload: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Allow anonymous uploads</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowAnonymousDownload}
                onChange={(e) => onSettingsChange({...settings, allowAnonymousDownload: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Allow anonymous downloads</span>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon size={16} className="inline mr-1" />
              Default Expiry Date for New Files (Optional)
            </label>
            <input
              type="date"
              value={settings.expiryDate}
              onChange={(e) => onSettingsChange({...settings, expiryDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Files uploaded to this folder will expire on this date by default</p>
          </div>

          <div className="mb-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onDelete(folder.id, folder.name)}
              className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all border border-red-200"
            >
              Delete Folder
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

