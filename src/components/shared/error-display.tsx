"use client";

import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  retry?: () => void;
}

export function ErrorDisplay({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  retry,
}: ErrorDisplayProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="rounded-full bg-red-100 p-4">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{message}</p>
        {retry && (
          <Button onClick={retry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
