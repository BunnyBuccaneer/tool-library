"use client";

import { useTransition, type ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";
import { clsx } from "clsx";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  children,
}: ConfirmDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm();
      onClose();
    });
  };

  const confirmBtnClass = clsx(
    "rounded-lg px-4 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50",
    {
      "bg-red-600 hover:bg-red-700 focus:ring-red-500": variant === "danger",
      "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400":
        variant === "warning",
      "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500":
        variant === "default",
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          {variant !== "default" && (
            <div
              className={clsx(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                variant === "danger" && "bg-red-50 text-red-600",
                variant === "warning" && "bg-yellow-50 text-yellow-600"
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="mb-1 text-base font-semibold text-slate-900">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
            {children && <div className="mt-3">{children}</div>}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={confirmBtnClass}
          >
            {isPending ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}