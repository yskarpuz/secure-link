"use client";

import { AlertTriangleIcon, DownloadIcon } from "lucide-react";
import { FileType } from "@/app/types";
import { formatBytes } from "@/app/utils/fileHelpers";

interface BurnDownloadModalProps {
  show: boolean;
  file: FileType | null;
  onDownload: (file: FileType) => void;
  onClose: () => void;
}

export const BurnDownloadModal = ({
  show,
  file,
  onDownload,
  onClose,
}: BurnDownloadModalProps) => {
  if (!show || !file) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full border-2 border-orange-300 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangleIcon size={28} className="text-orange-500" />
          <h2 className="text-xl font-bold text-gray-900">Secure One-Time Download</h2>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">File: {file.name}</p>
          <p className="text-sm text-gray-600">Size: {formatBytes(file.size)}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ <strong>Warning:</strong> Closing this window will permanently delete the file from the server.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onDownload(file)}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
          >
            <DownloadIcon size={18} />
            <span>Download (Retry Allowed)</span>
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
          >
            Close & Delete File
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-3">
          You can download multiple times. The file will only be deleted when you close this window.
        </p>
      </div>
    </div>
  );
};

