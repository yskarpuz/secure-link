"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { TrashIcon, FolderIcon, FileIcon, UsersIcon, HardDriveIcon, ShieldCheckIcon, CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { showToast, ToastContainer } from "@/components/Toast";
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { authFetch, authFetchJSON, initAuthFetch } from "@/lib/authFetch";

export default function AdminPage() {
  const router = useRouter();
  const { instance, accounts, inProgress } = useMsal();
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    totalUsers: 0
  });
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accounts.length === 0 && inProgress === "none") {
      router.push("/login");
    } else if (accounts.length > 0) {
      if (!instance.getActiveAccount()) {
        instance.setActiveAccount(accounts[0]);
      }
      initAuthFetch(instance);
      loadAdminData();
    }
  }, [accounts, inProgress, router, instance]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      const allItems = await authFetchJSON(`${API_BASE_URL}/api/filesystem?includeAll=true`);
      
      const filesData = allItems.filter((item: any) => item.fileSystemItemType === 1).map((item: any) => ({
        id: item.id,
        name: item.name,
        size: item.size || 0,
        createdAt: item.createdAt,
        contentType: item.contentType,
        expiresAt: item.expiresAt,
        burnAfterDownload: item.burnAfterDownload,
        ownerId: item.ownerId
      }));
      
      const foldersData = allItems.filter((item: any) => item.fileSystemItemType === 0).map((item: any) => ({
        id: item.id,
        name: item.name,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt,
        ownerId: item.ownerId,
        shareToken: item.shareToken
      }));
      
      setFiles(filesData);
      setFolders(foldersData);
      
      const totalSize = filesData.reduce((sum: number, file: any) => sum + (file.size || 0), 0);
      
      setStats({
        totalFiles: filesData.length,
        totalFolders: foldersData.length,
        totalSize: totalSize,
        totalUsers: new Set([...filesData.map((f: any) => f.ownerId), ...foldersData.map((f: any) => f.ownerId)]).size
      });
    } catch (error: any) {
      console.error("Error loading admin data:", error);
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        showToast("Access Denied: You are not an administrator", "error");
        setTimeout(() => router.push("/"), 2000);
      } else {
        showToast(error.message || "Failed to load admin data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      const response = await authFetch(`${API_BASE_URL}/api/filesystem/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Delete failed");
      }
      
      showToast("File deleted successfully", "success");
      loadAdminData();
    } catch (error: any) {
      console.error("Error deleting file:", error);
      showToast(error.message || "Failed to delete file", "error");
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Are you sure you want to delete "${folderName}" and all its contents?`)) return;

    try {
      const response = await authFetch(`${API_BASE_URL}/api/filesystem/${folderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Delete failed");
      }
      
      showToast("Folder deleted successfully", "success");
      loadAdminData();
    } catch (error: any) {
      console.error("Error deleting folder:", error);
      showToast(error.message || "Failed to delete folder", "error");
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const isExpired = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return false;
    try {
      return new Date(expiresAt) < new Date();
    } catch {
      return false;
    }
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <ToastContainer />
      <header className="border-b border-gray-900 bg-gray-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Admin Panel</h1>
              <p className="text-sm text-gray-400">FileShare Administration</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => loadAdminData()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("admin_auth");
                router.push("/");
              }}
              className="px-4 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <FileIcon size={24} className="text-blue-500" />
              </div>
              <span className="text-3xl font-black text-white">{stats.totalFiles}</span>
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Files</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <FolderIcon size={24} className="text-green-500" />
              </div>
              <span className="text-3xl font-black text-white">{stats.totalFolders}</span>
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Folders</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <HardDriveIcon size={24} className="text-purple-500" />
              </div>
              <span className="text-2xl font-black text-white">{formatBytes(stats.totalSize)}</span>
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Storage Used</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <UsersIcon size={24} className="text-orange-500" />
              </div>
              <span className="text-3xl font-black text-white">{stats.totalUsers}</span>
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Users</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-black text-white mb-6">All Folders ({folders.length})</h2>
          {loading ? (
            <p className="text-gray-400 text-center py-8">Loading...</p>
          ) : folders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No folders found</p>
          ) : (
            <div className="space-y-2">
              {folders.map((folder) => (
                <div key={folder.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-4 flex-1">
                    <FolderIcon size={20} className="text-blue-500" />
                    <div className="flex-1">
                      <p className="font-bold text-white">{folder.name}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-xs text-gray-500">Created: {formatDate(folder.createdAt)}</p>
                        {folder.expiresAt && (
                          <p className={`text-xs ${isExpired(folder.expiresAt) ? "text-red-500" : "text-orange-500"}`}>
                            <CalendarIcon size={12} className="inline mr-1" />
                            Expires: {formatDate(folder.expiresAt)} {isExpired(folder.expiresAt) && "(Expired)"}
                          </p>
                        )}
                        {folder.shareToken && (
                          <span className="text-xs text-green-500 font-bold">SHARED</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFolder(folder.id, folder.name)}
                    className="p-2 hover:bg-red-600 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-black text-white mb-6">All Files ({files.length})</h2>
          {loading ? (
            <p className="text-gray-400 text-center py-8">Loading...</p>
          ) : files.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No files found</p>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-4 flex-1">
                    <FileIcon size={20} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-white">{file.name}</p>
                        {file.burnAfterDownload && (
                          <span className="text-xs text-orange-500 font-bold">🔥</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                        <p className="text-xs text-gray-500">Created: {formatDate(file.createdAt)}</p>
                        {file.expiresAt && (
                          <p className={`text-xs ${isExpired(file.expiresAt) ? "text-red-500" : "text-orange-500"}`}>
                            <CalendarIcon size={12} className="inline mr-1" />
                            Expires: {formatDate(file.expiresAt)} {isExpired(file.expiresAt) && "(Expired)"}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">Owner: {file.ownerId}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id, file.name)}
                    className="p-2 hover:bg-red-600 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
