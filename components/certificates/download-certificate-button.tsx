"use client";

import { Download } from "lucide-react";

export function DownloadCertificateButton() {
  return <button type="button" onClick={() => window.print()} className="print:hidden inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-extrabold text-white hover:bg-blue-700"><Download className="h-4 w-4" />Download certificate (PDF)</button>;
}
