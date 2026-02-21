"use client";

import { KeyIcon } from "lucide-react";

interface PinModalProps {
  show: boolean;
  itemType: "file" | "folder" | null;
  pinInput: string;
  onClose: () => void;
  onPinChange: (pin: string) => void;
  onSubmit: () => void;
}

export const PinModal = ({
  show,
  itemType,
  pinInput,
  onClose,
  onPinChange,
  onSubmit,
}: PinModalProps) => {
  if (!show || !itemType) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-3 mb-4">
          <KeyIcon size={24} className="text-amber-500" />
          <h2 className="text-xl font-bold text-gray-900">Enter PIN</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          This {itemType} is protected. Please enter the PIN to access.
        </p>
        <input
          type="password"
          value={pinInput}
          onChange={(e) => onPinChange(e.target.value)}
          placeholder="Enter 4-digit PIN"
          maxLength={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          autoFocus
        />
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

