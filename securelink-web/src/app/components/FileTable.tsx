"use client";

import { FileIcon, DownloadIcon, TrashIcon, KeyIcon } from "lucide-react";
import { FileType } from "@/app/types";
import { getFileIcon, formatBytes } from "@/app/utils/fileHelpers";

interface FileTableProps {
  files: FileType[];
  loading: boolean;
  onDownload: (file: FileType) => void;
  onDelete: (fileId: string, fileName: string) => void;
}

export const FileTable = ({ files, loading, onDownload, onDelete }: FileTableProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase font-semibold text-gray-500 flex items-center space-x-2">
          <FileIcon size={14} />
          <span>Files</span>
        </h3>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-xs uppercase font-semibold text-gray-600">Name</th>
              <th className="px-6 py-3 text-xs uppercase font-semibold text-gray-600">Size</th>
              <th className="px-6 py-3 text-xs uppercase font-semibold text-gray-600">Created</th>
              <th className="px-6 py-3 text-xs uppercase font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">Loading files...</td></tr>
            ) : files.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">No files found</td></tr>
            ) : files.map((file) => {
              const FileIconComponent = getFileIcon(file.contentType);
              return (
              <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileIconComponent size={16} className="text-blue-500" />
                    </div>
                    <span className="font-medium text-sm text-gray-900">{file.name}</span>
                    {file.burnAfterDownload && (
                      <span className="text-xs text-orange-600 font-medium">🔥 Burn</span>
                    )}
                    {file.pinHash && (
                      <KeyIcon size={14} className="text-amber-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {formatBytes(file.size)}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{new Date(file.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <button 
                      onClick={() => onDownload(file)}
                      className="p-2 hover:bg-blue-50 rounded-md transition-colors text-blue-600"
                      title="Download"
                    >
                      <DownloadIcon size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(file.id, file.name)}
                      className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600"
                      title="Delete"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

