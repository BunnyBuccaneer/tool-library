import { FileText, BookOpen, Download, ExternalLink } from "lucide-react";

interface ToolDocumentsProps {
  userManualUrl: string | null;
  quickStartGuideUrl: string | null;
}

export function ToolDocuments({ userManualUrl, quickStartGuideUrl }: ToolDocumentsProps) {
  if (!userManualUrl && !quickStartGuideUrl) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-900">Documentation</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {userManualUrl && (
          <a
            href={userManualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                User Manual
              </p>
              <p className="text-xs text-slate-500">Complete documentation</p>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </a>
        )}

        {quickStartGuideUrl && (
          <a
            href={quickStartGuideUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-green-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 group-hover:text-green-600 transition-colors">
                Quick Start Guide
              </p>
              <p className="text-xs text-slate-500">Get started fast</p>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-green-500 transition-colors" />
          </a>
        )}
      </div>
    </div>
  );
}
