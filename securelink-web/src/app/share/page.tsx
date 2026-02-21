"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { 
  FolderIcon, 
  FileIcon, 
  DownloadIcon, 
  ShieldIcon,
  LockIcon,
  AlertCircleIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  FileArchiveIcon,
  FileCodeIcon,
  UploadIcon,
  UploadCloudIcon,
  XIcon
} from "lucide-react";
import { showToast, ToastContainer } from "@/components/Toast";

function ShareContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [folder, setFolder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (token) {
      loadSharedFolder();
    } else {
      setError('No share token provided');
      setLoading(false);
    }
  }, [token]);

  const loadSharedFolder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/share/folder/${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to load shared folder');
      }

      const data = await response.json();
      setFolder(data.folder);
      setItems([...(data.folders || []), ...(data.files || [])]);
      setPermissions(data.permissions);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load shared content');
      showToast('Failed to load shared content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;

    if (!file) {
      showToast("Please select a file", "warning");
      return;
    }

    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("File", file);
      uploadFormData.append("FolderId", folder.id);
      uploadFormData.append("ShareToken", token || "");
      uploadFormData.append("BurnAfterDownload", "false");

      const response = await fetch(`${API_BASE_URL}/api/filesystem/upload`, {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) throw new Error('Upload failed');

      showToast("File uploaded successfully!", "success");
      setShowUploadModal(false);
      loadSharedFolder();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      showToast(error.message || "Failed to upload file", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!permissions?.canUpload) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (!permissions?.canUpload) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    setUploading(true);
    for (const file of droppedFiles) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("File", file);
        uploadFormData.append("FolderId", folder.id);
        uploadFormData.append("ShareToken", token || "");
        uploadFormData.append("BurnAfterDownload", "false");

        const response = await fetch(`${API_BASE_URL}/api/filesystem/upload`, {
          method: "POST",
          body: uploadFormData,
        });

        if (!response.ok) throw new Error('Upload failed');

        showToast(`${file.name} uploaded successfully`, "success");
      } catch (error: any) {
        showToast(`Failed to upload ${file.name}`, "error");
      }
    }
    setUploading(false);
    loadSharedFolder();
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/share/file/${token}/${fileId}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('File downloaded successfully', 'success');
    } catch (err) {
      showToast('Failed to download file', 'error');
    }
  };

  const getFileIcon = (contentType: string) => {
    if (!contentType) return FileIcon;
    if (contentType.startsWith('image/')) return ImageIcon;
    if (contentType.startsWith('video/')) return VideoIcon;
    if (contentType.startsWith('audio/')) return MusicIcon;
    if (contentType.includes('pdf') || contentType.includes('document') || contentType.includes('text')) return FileTextIcon;
    if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('tar') || contentType.includes('gz')) return FileArchiveIcon;
    if (contentType.includes('javascript') || contentType.includes('json') || contentType.includes('html') || contentType.includes('css')) return FileCodeIcon;
    return FileIcon;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg mb-4">
            <ShieldIcon size={32} className="text-white animate-pulse" />
          </div>
          <p className="text-gray-700 font-bold">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md w-full shadow-lg">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mx-auto mb-4">
            <AlertCircleIcon size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 text-center mb-2">Access Denied</h2>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
        <ToastContainer />
      </div>
    );
  }

  const files = items.filter(item => item.fileSystemItemType === 1);
  const folders = items.filter(item => item.fileSystemItemType === 0);

  return (
    <div 
      className="min-h-screen bg-gray-50 p-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && permissions?.canUpload && (
        <div className="fixed inset-0 z-50 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white border-4 border-dashed border-blue-400 rounded-2xl p-16 text-center shadow-2xl">
            <UploadCloudIcon size={80} className="text-blue-500 mx-auto mb-4 animate-bounce" />
            <p className="text-3xl font-bold text-gray-900">Drop files to upload</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 shadow-md">
                <FolderIcon size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{folder?.name || 'Shared Folder'}</h1>
                <p className="text-gray-500 text-sm">Shared content</p>
              </div>
            </div>
            
            {permissions?.canUpload && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-blue-700 shadow-sm"
              >
                <UploadIcon size={18} />
                <span>Upload File</span>
              </button>
            )}
          </div>

          {permissions && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {permissions.canView && (
                <div className="flex items-center space-x-1">
                  <LockIcon size={14} />
                  <span>View allowed</span>
                </div>
              )}
              {permissions.canDownload && (
                <div className="flex items-center space-x-1">
                  <DownloadIcon size={14} />
                  <span>Download allowed</span>
                </div>
              )}
              {permissions.canUpload && (
                <div className="flex items-center space-x-1">
                  <UploadIcon size={14} />
                  <span>Upload allowed</span>
                </div>
              )}
            </div>
          )}
        </div>

        {permissions?.canUpload && (
          <div 
            className="mb-6 border-2 border-dashed border-gray-300 rounded-xl p-6 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => setShowUploadModal(true)}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <UploadCloudIcon size={24} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Upload Files</h3>
                <p className="text-sm text-gray-600">Drag and drop files here, or click to select</p>
              </div>
            </div>
          </div>
        )}

        {folders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs uppercase font-semibold text-gray-500 mb-4">Folders</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {folders.map((folder: any) => (
                <div
                  key={folder.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                    <FolderIcon size={20} className="text-blue-500" />
                  </div>
                  <p className="font-semibold text-gray-900 truncate">{folder.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(folder.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Files ({files.length})</h2>
          </div>
          
          {files.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No files in this folder</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {files.map((file: any) => {
                const FileIconComponent = getFileIcon(file.contentType);
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <FileIconComponent size={20} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium truncate">{file.name}</p>
                        <p className="text-gray-500 text-sm">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    
                    {permissions?.canDownload && (
                      <button
                        onClick={() => downloadFile(file.id, file.name)}
                        className="ml-4 p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <DownloadIcon size={18} className="text-white" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upload File</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700">
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleFileUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                <input
                  type="file"
                  name="file"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Uploading...</span>
                    </>
                  ) : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}
