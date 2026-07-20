import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getCertTypeById, getAllMemberCerts } from "@/lib/data/certifications";
import { PageHeader, Breadcrumb } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Calendar, Shield, Award, FileText, CheckCircle2, ChevronLeft } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

function safeFormatDate(
  input: string | Date | null | undefined,
  fmt: string = "MMM d, yyyy",
  fallback: string = "—"
): string {
  if (!input) return fallback;
  let date: Date;
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      date = new Date(`${input}T00:00:00`);
    } else {
      date = parseISO(input);
      if (!isValid(date)) date = new Date(input);
    }
  } else {
    return fallback;
  }
  return isValid(date) ? format(date, fmt) : fallback;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const certType = await getCertTypeById(id);
  return {
    title: certType ? `${certType.name} | Certifications | Admin` : "Certification Not Found",
  };
}

export default async function CertTypeDetailPage({ params }: PageProps) {
  await requireAdminAuth();

  const { id } = await params;
  const certType = await getCertTypeById(id);
  if (!certType) notFound();

  const memberCertsResult = await getAllMemberCerts({
    certTypeId: id,
    page: 1,
    pageSize: 100,
  });

  return (
    <div>
      <PageHeader
        title={certType.name}
        description={`Certification Type details and requirements`}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Certifications", href: "/admin/certifications" },
              { label: certType.name },
            ]}
          />
        }
        actions={
          <Link
            href="/admin/certifications"
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Certifications
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Details
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</span>
                <div className="mt-1">
                  <StatusBadge
                    variant={certType.status === "active" ? "green" : "slate"}
                    label={certType.status === "active" ? "Active" : "Inactive"}
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Validity</span>
                <p className="mt-1 font-medium text-slate-700">
                  {certType.validityMonths ? `${certType.validityMonths} months` : "Lifetime / No Expiration"}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Required for Members</span>
                <p className="mt-1 font-medium text-slate-700">
                  {certType.isRequired ? "Yes, mandatory" : "Optional"}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Description</span>
                <p className="mt-1 text-slate-600 whitespace-pre-wrap">{certType.description || "No description provided."}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Prerequisites / Requirements
            </h3>

            {certType.requirements.length > 0 ? (
              <ul className="space-y-3">
                {certType.requirements.map((req) => (
                  <li key={req.id} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <div>
                      {req.toolName && (
                        <p className="font-medium text-slate-900">
                          Requires Tool: <span className="underline">{req.toolName}</span>
                        </p>
                      )}
                      {req.categoryName && (
                        <p className="font-medium text-slate-900">
                          Requires Category: <span className="underline">{req.categoryName}</span>
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic">No specific tool or category requirements defined.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-green-500" />
              Certified Members ({memberCertsResult.total})
            </h3>

            {memberCertsResult.certs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Issued</th>
                      <th className="px-4 py-3">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                    {memberCertsResult.certs.map((cert) => {
                      const isExpired = cert.expiryDate ? new Date(cert.expiryDate) < new Date() : false;
                      return (
                        <tr key={cert.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{cert.userName || "No name"}</p>
                            <p className="text-xs text-slate-400">{cert.userEmail}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              cert.status === "valid"
                                ? "bg-green-50 text-green-700 ring-green-600/20"
                                : cert.status === "expired" || isExpired
                                  ? "bg-red-50 text-red-700 ring-red-600/20"
                                  : "bg-slate-50 text-slate-600 ring-slate-500/10"
                            }`}>
                              {cert.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">{safeFormatDate(cert.issuedDate)}</td>
                          <td className="px-4 py-3">
                            {cert.expiryDate ? (
                              <span className={isExpired ? "text-red-600 font-medium" : ""}>
                                {safeFormatDate(cert.expiryDate)}
                              </span>
                            ) : (
                              <span className="text-slate-400">Lifetime</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-slate-500">
                No members currently certified under this type.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}