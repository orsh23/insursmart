// components/ui/Modal.jsx
import React from 'react';
import { Dialog } from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

/**
 * Base modal component
 * @param {boolean} open - Whether modal is open
 * @param {function} onOpenChange - Called on close
 * @param {ReactNode} title - Modal title
 * @param {ReactNode} children - Modal content
 */
export default function Modal({ open, onOpenChange, title, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <Dialog.Title className="text-lg font-medium">{title}</Dialog.Title>
          <button onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-black">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}