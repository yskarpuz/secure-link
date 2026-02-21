"use client";

import { UploadCloudIcon } from "lucide-react";
import { cn } from "@/app/utils/fileHelpers";

interface UploadZoneProps {
  isDragging: boolean;
  currentFolderId: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onCreateFolder: () => void;
  onUploadFile: () => void;
}

export const UploadZone = ({
  isDragging,
  currentFolderId,
  onDragOver,
  onDragLeave,
  onDrop,
  onCreateFolder,
  onUploadFile,
}: UploadZoneProps) => {
  const { FolderIcon, UploadIcon } = require("lucide-react");
  
  return (
    <div 
      className={cn(
        "mb-8 border-2 border-dashed rounded-xl p-6 transition-all duration-300",
        isDragging 
          ? "border-blue-400 bg-blue-50" 
          : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center transition-all",
            isDragging 
              ? "bg-blue-200" 
              : "bg-blue-50"
          )}>
            <UploadCloudIcon size={24} className={cn(
              "transition-all",
              isDragging ? "text-blue-600" : "text-blue-500"
            )} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {isDragging ? "Drop files to upload" : "Upload Files or Create Folder"}
            </h3>
            <p className="text-sm text-gray-600">
              {isDragging 
                ? (currentFolderId ? "Files will be uploaded to this folder" : "Files will be uploaded to root")
                : "Drag and drop files here, or use the buttons below"
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={onCreateFolder}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-200 border border-gray-300"
          >
            <FolderIcon size={18} />
            <span>New Folder</span>
          </button>
          <button 
            onClick={onUploadFile}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-blue-700 shadow-sm"
          >
            <UploadIcon size={18} />
            <span>Upload Files</span>
          </button>
        </div>
      </div>
    </div>
  );
};

