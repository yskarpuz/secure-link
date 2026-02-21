"use client";

import { XIcon, CopyIcon, CheckIcon } from "lucide-react";
import { FolderType } from "@/app/types";

interface ShareModalProps {
  show: boolean;
  folder: FolderType | null;
  shareUrl: string;
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
  onUnshare: () => void;
}

export const ShareModal = ({
  show,
  folder,
  shareUrl,
  copied,
  onClose,
  onCopy,
  onUnshare,
}: ShareModalProps) => {
  if (!show || !folder) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Share Folder</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XIcon size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Share this folder: <span className="font-semibold text-gray-900">{folder.name}</span>
        </p>
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 text-sm"
          />
          <button
            onClick={onCopy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
          >
            {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
        <button
          onClick={onUnshare}
          className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all border border-red-200"
        >
          Remove Share Link
        </button>
      </div>
    </div>
  );
};

