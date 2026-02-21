"use client";

import React, { useEffect } from "react";
import { CheckCircleIcon, XCircleIcon, AlertCircleIcon, XIcon } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify() {
  toastListeners.forEach(listener => listener([...toasts]));
}

export function showToast(message: string, type: ToastType = "info") {
  const id = Math.random().toString(36).substring(7);
  toasts.push({ id, message, type });
  notify();
  
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  }, 5000);
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = React.useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm
            min-w-[300px] max-w-md animate-in slide-in-from-right
            ${
              toast.type === "success" ? "bg-green-50 text-green-900 border border-green-200" :
              toast.type === "error" ? "bg-red-50 text-red-900 border border-red-200" :
              toast.type === "warning" ? "bg-orange-50 text-orange-900 border border-orange-200" :
              "bg-blue-50 text-blue-900 border border-blue-200"
            }
          `}
        >
          {toast.type === "success" && <CheckCircleIcon size={20} className="text-green-600" />}
          {toast.type === "error" && <XCircleIcon size={20} className="text-red-600" />}
          {toast.type === "warning" && <AlertCircleIcon size={20} className="text-orange-600" />}
          {toast.type === "info" && <AlertCircleIcon size={20} className="text-blue-600" />}
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => {
              toasts = toasts.filter(t => t.id !== toast.id);
              notify();
            }}
            className="hover:opacity-70 transition-opacity"
          >
            <XIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}