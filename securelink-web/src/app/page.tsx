"use client";

import { Suspense, useEffect } from "react";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { ShieldIcon, UploadCloudIcon } from "lucide-react";
import { ToastContainer } from "@/components/Toast";
import { useBranding } from "@/components/BrandingProvider";
import { API_BASE_URL } from "@/lib/api";

import { useFileShare } from "@/app/hooks/useFileShare";
import { 
  createFileHandlers, 
  createFolderHandlers, 
  createNavigationHandlers,
  createPinHandlers 
} from "@/app/handlers";

import { Sidebar } from "@/app/components/Sidebar";
import { Header } from "@/app/components/Header";
import { UploadZone } from "@/app/components/UploadZone";
import { FolderGrid } from "@/app/components/FolderGrid";
import { FileTable } from "@/app/components/FileTable";

import { UploadModal } from "@/app/components/modals/UploadModal";
import { CreateFolderModal } from "@/app/components/modals/CreateFolderModal";
import { ShareModal } from "@/app/components/modals/ShareModal";
import { FolderSettingsModal } from "@/app/components/modals/FolderSettingsModal";
import { BurnDownloadModal } from "@/app/components/modals/BurnDownloadModal";
import { PinModal } from "@/app/components/modals/PinModal";

function HomeContent() {
  const branding = useBranding();
  const { state, setters, actions, user, router } = useFileShare();

  const fileHandlers = createFileHandlers(state, setters, actions, router);
  const folderHandlers = createFolderHandlers(state, setters, actions, router);
  const navigationHandlers = createNavigationHandlers(router);
  const pinHandlers = createPinHandlers(state, setters, router);

  const handleLogout = async () => {
    try {
      await user.instance.logoutRedirect({
        postLogoutRedirectUri: "/login"
      });
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <>
      <AuthenticatedTemplate>
        <div 
          className="flex h-screen bg-gray-50 text-gray-900 font-sans"
          onDragOver={fileHandlers.handleDragOver}
          onDragLeave={fileHandlers.handleDragLeave}
          onDrop={fileHandlers.handleDrop}
        >
          <ToastContainer />
          
          {state.isDragging && (
            <div className="fixed inset-0 z-50 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
              <div className="bg-white border-4 border-dashed border-blue-400 rounded-2xl p-16 text-center shadow-2xl">
                <UploadCloudIcon size={80} className="text-blue-500 mx-auto mb-4 animate-bounce" />
                <p className="text-3xl font-bold text-gray-900">Drop files to upload</p>
              </div>
            </div>
          )}

          <Sidebar 
            activeTab={state.activeTab}
            onTabChange={setters.setActiveTab}
            userName={user.accounts[0]?.name}
            onLogout={handleLogout}
            branding={branding}
          />

          <main className="flex-1 flex flex-col min-w-0">
            <Header 
              currentFolderName={state.currentFolderName}
              currentFolderId={state.currentFolderId}
              breadcrumbs={state.breadcrumbs}
              activeTab={state.activeTab}
              folders={state.folders}
              onBackToRoot={navigationHandlers.handleBackToRoot}
              onBreadcrumbClick={navigationHandlers.handleBreadcrumbClick}
              onFolderSettings={folderHandlers.handleFolderSettings}
            />

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <UploadZone 
                isDragging={state.isDragging}
                currentFolderId={state.currentFolderId}
                onDragOver={fileHandlers.handleDragOver}
                onDragLeave={fileHandlers.handleDragLeave}
                onDrop={fileHandlers.handleDrop}
                onCreateFolder={() => setters.setShowCreateFolderModal(true)}
                onUploadFile={() => setters.setShowUploadModal(true)}
              />

              <FolderGrid 
                folders={state.folders}
                onFolderClick={folderHandlers.handleFolderClick}
                onFolderSettings={folderHandlers.handleFolderSettings}
                onShareFolder={folderHandlers.handleShareFolder}
              />

              <FileTable 
                files={state.files}
                loading={state.loading}
                onDownload={fileHandlers.handleDownloadClick}
                onDelete={fileHandlers.handleFileDelete}
              />
            </div>
          </main>

          <UploadModal 
            show={state.showUploadModal}
            uploading={state.uploading}
            settings={state.uploadSettings}
            onClose={() => {
              setters.setShowUploadModal(false);
              setters.setUploadSettings({ burnAfterDownload: false, expiryDate: "", pin: "" });
            }}
            onSubmit={fileHandlers.handleFileUpload}
            onSettingsChange={setters.setUploadSettings}
          />

          <CreateFolderModal 
            show={state.showCreateFolderModal}
            creating={state.creatingFolder}
            folderName={state.newFolderName}
            settings={state.folderSettings}
            onClose={() => {
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
            }}
            onSubmit={folderHandlers.handleCreateFolder}
            onNameChange={setters.setNewFolderName}
            onSettingsChange={setters.setFolderSettings}
          />

          <ShareModal 
            show={state.showShareModal}
            folder={state.selectedFolder}
            shareUrl={state.shareUrl}
            copied={state.copied}
            onClose={() => setters.setShowShareModal(false)}
            onCopy={folderHandlers.handleCopyShareLink}
            onUnshare={folderHandlers.handleUnshareFolder}
          />

          <FolderSettingsModal 
            show={state.showFolderSettingsModal}
            folder={state.selectedFolder}
            settings={state.folderSettings}
            saving={state.savingSettings}
            onClose={() => setters.setShowFolderSettingsModal(false)}
            onSubmit={folderHandlers.handleUpdateFolderSettings}
            onSettingsChange={setters.setFolderSettings}
            onDelete={folderHandlers.handleFolderDelete}
          />

          <BurnDownloadModal 
            show={state.showBurnDownloadModal}
            file={state.burnFile}
            onDownload={fileHandlers.handleFileDownload}
            onClose={fileHandlers.handleBurnModalClose}
          />

          <PinModal 
            show={state.showPinModal}
            itemType={state.pinProtectedItem?.type || null}
            pinInput={state.pinInput}
            onClose={() => {
              setters.setShowPinModal(false);
              setters.setPinInput("");
              setters.setPinProtectedItem(null);
            }}
            onPinChange={setters.setPinInput}
            onSubmit={pinHandlers.handlePinSubmit}
          />
        </div>
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <ShieldIcon size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{branding.appName}</h1>
            <p className="text-gray-600 mb-8">Please sign in to access your secure vault</p>
            <button 
              onClick={handleLogin}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md"
            >
              Sign In
            </button>
          </div>
        </div>
      </UnauthenticatedTemplate>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

