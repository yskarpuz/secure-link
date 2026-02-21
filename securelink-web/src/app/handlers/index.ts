"use client";

import { authFetch, authFetchJSON } from "@/lib/authFetch";
import { showToast } from "@/components/Toast";
import { API_BASE_URL } from "@/lib/api";
import type { FileType, FolderType, FolderSettings, UploadSettings } from "@/app/types";

export const createFileHandlers = (
  state: any,
  setters: any,
  actions: any,
  router: any
) => {
  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;

    if (!file) {
      showToast("Please select a file", "warning");
      return;
    }

    try {
      setters.setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("File", file);
      if (state.currentFolderId) {
        uploadFormData.append("FolderId", state.currentFolderId);
      }
      uploadFormData.append("BurnAfterDownload", state.uploadSettings.burnAfterDownload.toString());
      if (state.uploadSettings.pin) {
        uploadFormData.append("Pin", state.uploadSettings.pin);
      }
      if (state.uploadSettings.expiryDate) {
        uploadFormData.append("ExpiresAt", new Date(state.uploadSettings.expiryDate).toISOString());
      }

      await authFetch(`${API_BASE_URL}/api/filesystem/upload`, {
        method: "POST",
        body: uploadFormData,
      });

      const successMsg = state.uploadSettings.burnAfterDownload 
        ? "🔥 File uploaded! It will be deleted after first download." 
        : "File uploaded successfully!";
      showToast(successMsg, "success");
      setters.setShowUploadModal(false);
      setters.setUploadSettings({ burnAfterDownload: false, expiryDate: "", pin: "" });
      actions.loadData();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      showToast(error.message || "Failed to upload file", "error");
    } finally {
      setters.setUploading(false);
    }
  };

  const handleDownloadClick = (file: FileType) => {
    if (file.burnAfterDownload) {
      setters.setBurnFile(file);
      setters.setShowBurnDownloadModal(true);
    } else {
      handleFileDownload(file);
    }
  };

  const handleFileDownload = async (file: FileType) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/filesystem/download/${file.id}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      if (!file.burnAfterDownload) {
        showToast("File downloaded successfully", "success");
      }
    } catch (error: any) {
      console.error("Error downloading file:", error);
      showToast(error.message || "Failed to download file", "error");
    }
  };

  const handleBurnModalClose = async () => {
    if (!state.burnFile) return;

    try {
      await authFetch(`${API_BASE_URL}/api/filesystem/download/${state.burnFile.id}/confirm-burn`, {
        method: "POST"
      });
      showToast("File archived successfully", "success");
      setters.setShowBurnDownloadModal(false);
      setters.setBurnFile(null);
      actions.loadData();
    } catch (error: any) {
      console.error("Error archiving file:", error);
      showToast(error.message || "Failed to archive file", "error");
    }
  };

  const handleFileDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      await authFetch(`${API_BASE_URL}/api/filesystem/${fileId}`, {
        method: "DELETE"
      });

      showToast("File deleted successfully", "success");
      actions.loadData();
    } catch (error: any) {
      console.error("Error deleting file:", error);
      showToast(error.message || "Failed to delete file", "error");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setters.setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setters.setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setters.setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    setters.setUploading(true);
    for (const file of droppedFiles) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("File", file);
        if (state.currentFolderId) {
          uploadFormData.append("FolderId", state.currentFolderId);
        }
        uploadFormData.append("BurnAfterDownload", "false");

        await authFetch(`${API_BASE_URL}/api/filesystem/upload`, {
          method: "POST",
          body: uploadFormData,
        });

        showToast(`${file.name} uploaded successfully`, "success");
      } catch (error: any) {
        showToast(`Failed to upload ${file.name}`, "error");
      }
    }
    setters.setUploading(false);
    actions.loadData();
  };

  return {
    handleFileUpload,
    handleDownloadClick,
    handleFileDownload,
    handleBurnModalClose,
    handleFileDelete,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};

export const createFolderHandlers = (
  state: any,
  setters: any,
  actions: any,
  router: any
) => {
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.newFolderName.trim()) {
      showToast("Please enter a folder name", "warning");
      return;
    }

    try {
      setters.setCreatingFolder(true);
      const body: any = {
        name: state.newFolderName,
        parentFolderId: state.currentFolderId,
        allowAnonymousView: state.folderSettings.allowAnonymousView,
        allowAnonymousUpload: state.folderSettings.allowAnonymousUpload,
        allowAnonymousDownload: state.folderSettings.allowAnonymousDownload,
      };

      if (state.folderSettings.expiryDate) {
        body.expiresAt = new Date(state.folderSettings.expiryDate).toISOString();
      }

      if (state.folderSettings.pin) {
        body.pin = state.folderSettings.pin;
      }

      await authFetchJSON(`${API_BASE_URL}/api/filesystem/folder`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      showToast("Folder created successfully", "success");
      setters.setShowCreateFolderModal(false);
      setters.setNewFolderName("");
      setters.setFolderSettings({
        name: "",
        allowAnonymousView: false,
        allowAnonymousUpload: false,
        allowAnonymousDownload: false,
        expiryDate: "",
        pin: ""
      });
      actions.loadData();
    } catch (error: any) {
      console.error("Error creating folder:", error);
      showToast(error.message || "Failed to create folder", "error");
    } finally {
      setters.setCreatingFolder(false);
    }
  };

  const handleFolderClick = (folder: FolderType) => {
    if (folder.pinHash) {
      setters.setPinProtectedItem({ id: folder.id, type: "folder" });
      setters.setShowPinModal(true);
    } else {
      router.push(`/?folder=${folder.id}`);
    }
  };

  const handleFolderSettings = (folder: FolderType) => {
    setters.setSelectedFolder(folder);
    
    let expiryDateValue = "";
    if (folder.expiresAt) {
      expiryDateValue = new Date(folder.expiresAt).toISOString().split('T')[0];
    }

    setters.setFolderSettings({
      name: folder.name,
      allowAnonymousView: folder.allowAnonymousView ?? false,
      allowAnonymousUpload: folder.allowAnonymousUpload ?? false,
      allowAnonymousDownload: folder.allowAnonymousDownload ?? false,
      expiryDate: expiryDateValue,
      pin: ""
    });
    setters.setShowFolderSettingsModal(true);
  };

  const handleUpdateFolderSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.selectedFolder) return;

    try {
      setters.setSavingSettings(true);
      const body: any = {
        allowAnonymousView: state.folderSettings.allowAnonymousView,
        allowAnonymousUpload: state.folderSettings.allowAnonymousUpload,
        allowAnonymousDownload: state.folderSettings.allowAnonymousDownload,
      };

      if (state.folderSettings.expiryDate) {
        body.expiresAt = new Date(state.folderSettings.expiryDate).toISOString();
      }

      await authFetchJSON(`${API_BASE_URL}/api/filesystem/folder/${state.selectedFolder.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      showToast("Folder settings updated", "success");
      setters.setShowFolderSettingsModal(false);
      await actions.loadData();
    } catch (error: any) {
      console.error("Error updating folder:", error);
      showToast(error.message || "Failed to update folder settings", "error");
    } finally {
      setters.setSavingSettings(false);
    }
  };

  const handleFolderDelete = async (folderId: string, folderName: string) => {
    if (!confirm(`Are you sure you want to delete "${folderName}" and all its contents?`)) return;

    try {
      await authFetch(`${API_BASE_URL}/api/filesystem/${folderId}`, {
        method: "DELETE"
      });

      showToast("Folder deleted successfully", "success");
      setters.setShowFolderSettingsModal(false);
      actions.loadData();
    } catch (error: any) {
      console.error("Error deleting folder:", error);
      showToast(error.message || "Failed to delete folder", "error");
    }
  };

  const handleShareFolder = async (folder: FolderType) => {
    if (folder.shareToken) {
      const url = `${window.location.origin}/share/?token=${folder.shareToken}`;
      setters.setShareUrl(url);
      setters.setSelectedFolder(folder);
      setters.setShowShareModal(true);
    } else {
      try {
        const data = await authFetchJSON(`${API_BASE_URL}/api/share/folder/${folder.id}`, {
          method: "POST",
          body: JSON.stringify({
            allowView: true,
            allowUpload: folder.allowAnonymousUpload,
            allowDownload: true,
            expiresAt: folder.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }),
        });
        const url = `${window.location.origin}/share/?token=${data.token}`;
        setters.setShareUrl(url);
        setters.setSelectedFolder(folder);
        setters.setShowShareModal(true);
        actions.loadData();
      } catch (error: any) {
        console.error("Error sharing folder:", error);
        showToast(error.message || "Failed to create share link", "error");
      }
    }
  };

  const handleUnshareFolder = async () => {
    if (!state.selectedFolder) return;

    try {
      await authFetch(`${API_BASE_URL}/api/share/folder/${state.selectedFolder.id}`, {
        method: "DELETE"
      });
      showToast("Share link removed successfully", "success");
      setters.setShowShareModal(false);
      setters.setSelectedFolder(null);
      actions.loadData();
    } catch (error: any) {
      console.error("Error unsharing folder:", error);
      showToast(error.message || "Failed to remove share link", "error");
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(state.shareUrl);
    setters.setCopied(true);
    showToast("Share link copied to clipboard", "success");
    setTimeout(() => setters.setCopied(false), 2000);
  };

  return {
    handleCreateFolder,
    handleFolderClick,
    handleFolderSettings,
    handleUpdateFolderSettings,
    handleFolderDelete,
    handleShareFolder,
    handleUnshareFolder,
    handleCopyShareLink,
  };
};

export const createNavigationHandlers = (router: any) => {
  const handleBackToRoot = () => {
    router.push("/");
  };

  const handleBreadcrumbClick = (folderId: string) => {
    if (folderId) {
      router.push(`/?folder=${folderId}`);
    } else {
      router.push("/");
    }
  };

  return {
    handleBackToRoot,
    handleBreadcrumbClick,
  };
};

export const createPinHandlers = (state: any, setters: any, router: any) => {
  const handlePinSubmit = async () => {
    if (!state.pinProtectedItem) return;

    try {
      if (state.pinProtectedItem.type === "folder") {
        router.push(`/?folder=${state.pinProtectedItem.id}`);
        setters.setShowPinModal(false);
        setters.setPinInput("");
        setters.setPinProtectedItem(null);
      }
    } catch (error: any) {
      showToast("Invalid PIN", "error");
    }
  };

  return {
    handlePinSubmit,
  };
};

