import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  FileArchiveIcon,
  FileCodeIcon,
} from "lucide-react";

export const getFileIcon = (contentType: string) => {
  if (!contentType) return FileIcon;
  if (contentType.startsWith('image/')) return ImageIcon;
  if (contentType.startsWith('video/')) return VideoIcon;
  if (contentType.startsWith('audio/')) return MusicIcon;
  if (contentType.includes('pdf') || contentType.includes('document') || contentType.includes('text')) return FileTextIcon;
  if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('tar') || contentType.includes('gz')) return FileArchiveIcon;
  if (contentType.includes('javascript') || contentType.includes('json') || contentType.includes('html') || contentType.includes('css')) return FileCodeIcon;
  return FileIcon;
};

export const formatBytes = (bytes: number) => {
  if (!bytes || isNaN(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export const cn = (...inputs: any[]) => {
  const { clsx } = require("clsx");
  const { twMerge } = require("tailwind-merge");
  return twMerge(clsx(inputs));
};

