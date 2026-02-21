"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMsal } from "@azure/msal-react";
import { initAuthFetch, authFetch, authFetchJSON } from "@/lib/authFetch";
import { showToast } from "@/components/Toast";
import { API_BASE_URL } from "@/lib/api";
import type { FileType, FolderType, BreadcrumbItem, FolderSettings, UploadSettings } from "@/app/types";

export const useFileShare = () => {
  const { instance, accounts, inProgress } = useMsal();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("all");
  const [files, setFiles] = useState<FileType[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string>("My Vault");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFolderSettingsModal, setShowFolderSettingsModal] = useState(false);
  const [showBurnDownloadModal, setShowBurnDownloadModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const [creatingFolder, setCreatingFolder] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [burnFile, setBurnFile] = useState<FileType | null>(null);
  const [pinProtectedItem, setPinProtectedItem] = useState<{ id: string; type: "file" | "folder" } | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);

  const [folderSettings, setFolderSettings] = useState<FolderSettings>({
    name: "",
    allowAnonymousView: false,
    allowAnonymousUpload: false,
    allowAnonymousDownload: false,
    expiryDate: "",
    pin: ""
  });

  const [uploadSettings, setUploadSettings] = useState<UploadSettings>({
    burnAfterDownload: false,
    expiryDate: "",
    pin: ""
  });

  useEffect(() => {
    if (accounts.length === 0 && inProgress === "none") {
      router.push("/login");
    } else if (accounts.length > 0) {
      if (!instance.getActiveAccount()) {
        instance.setActiveAccount(accounts[0]);
      }
      initAuthFetch(instance);
      setAuthReady(true);
    }
  }, [accounts, inProgress, router, instance]);

  useEffect(() => {
    const folderId = searchParams.get("folder");
    if (folderId !== currentFolderId) {
      setCurrentFolderId(folderId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (authReady) {
      loadData();
    }
  }, [currentFolderId, authReady, activeTab]);

  useEffect(() => {
    if (authReady) {
      loadBreadcrumbs();
    }
  }, [currentFolderId, authReady]);

  const loadBreadcrumbs = async () => {
    if (!currentFolderId) {
      setBreadcrumbs([]);
      setCurrentFolderName("My Vault");
      return;
    }

    try {
      const path = await authFetchJSON(`${API_BASE_URL}/api/filesystem/${currentFolderId}/path`);
      setBreadcrumbs(path.map((item: any) => ({ id: item.id, name: item.name })));
      if (path.length > 0) {
        setCurrentFolderName(path[path.length - 1].name);
      }
    } catch (error) {
      console.error("Error loading breadcrumbs:", error);
      setBreadcrumbs([]);
      setCurrentFolderName("My Vault");
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const url = currentFolderId 
        ? `${API_BASE_URL}/api/filesystem?parentId=${currentFolderId}`
        : `${API_BASE_URL}/api/filesystem`;
      
      const data = await authFetchJSON(url);

      let filesData = data.filter((item: any) => item.fileSystemItemType === 1).map((item: any) => ({
        id: item.id,
        name: item.name,
        size: item.size || 0,
        createdAt: item.createdAt,
        contentType: item.contentType,
        parentId: item.parentId,
        burnAfterDownload: item.burnAfterDownload,
        expiresAt: item.expiresAt,
        pinHash: item.pinHash
      }));
      
      let foldersData = data.filter((item: any) => item.fileSystemItemType === 0).map((item: any) => ({
        id: item.id,
        name: item.name,
        createdAt: item.createdAt,
        parentId: item.parentId,
        shareToken: item.shareToken,
        allowAnonymousView: item.allowAnonymousView,
        allowAnonymousUpload: item.allowAnonymousUpload,
        allowAnonymousDownload: item.allowAnonymousDownload,
        expiresAt: item.expiresAt,
        pinHash: item.pinHash
      }));

      if (activeTab === "shared") {
        foldersData = foldersData.filter((f: FolderType) => f.shareToken);
      }
      
      setFiles(filesData);
      setFolders(foldersData);
    } catch (error: any) {
      console.error("Error loading data:", error);
      showToast(error.message || "Failed to load files and folders", "error");
      setFiles([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    state: {
      activeTab,
      files,
      folders,
      breadcrumbs,
      loading,
      uploading,
      isDragging,
      currentFolderId,
      currentFolderName,
      showUploadModal,
      showCreateFolderModal,
      showShareModal,
      showFolderSettingsModal,
      showBurnDownloadModal,
      showPinModal,
      creatingFolder,
      savingSettings,
      burnFile,
      pinProtectedItem,
      pinInput,
      newFolderName,
      shareUrl,
      copied,
      selectedFolder,
      folderSettings,
      uploadSettings,
    },
    setters: {
      setActiveTab,
      setIsDragging,
      setShowUploadModal,
      setShowCreateFolderModal,
      setShowShareModal,
      setShowFolderSettingsModal,
      setShowBurnDownloadModal,
      setShowPinModal,
      setBurnFile,
      setPinProtectedItem,
      setPinInput,
      setNewFolderName,
      setShareUrl,
      setCopied,
      setSelectedFolder,
      setFolderSettings,
      setUploadSettings,
      setUploading,
      setCreatingFolder,
      setSavingSettings,
    },
    actions: {
      loadData,
      loadBreadcrumbs,
    },
    user: {
      accounts,
      instance,
    },
    router,
  };
};

