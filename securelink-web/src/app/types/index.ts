export interface FileType {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  contentType: string;
  parentId?: string;
  burnAfterDownload?: boolean;
  expiresAt?: string;
  pinHash?: string;
}

export interface FolderType {
  id: string;
  name: string;
  createdAt: string;
  parentId?: string;
  shareToken?: string;
  allowAnonymousView?: boolean;
  allowAnonymousUpload?: boolean;
  allowAnonymousDownload?: boolean;
  expiresAt?: string;
  pinHash?: string;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface FolderSettings {
  name: string;
  allowAnonymousView: boolean;
  allowAnonymousUpload: boolean;
  allowAnonymousDownload: boolean;
  expiryDate: string;
  pin: string;
}

export interface UploadSettings {
  burnAfterDownload: boolean;
  expiryDate: string;
  pin: string;
}

