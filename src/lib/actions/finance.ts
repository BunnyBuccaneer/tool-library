"use server";

import { requireAdminAuth } from "@/lib/admin-auth";
import { getFinancialCsvData } from "@/lib/data/finance";

export async function generateCsvExport(): Promise<{
  success: boolean;
  csv?: string;
  error?: string;
}> {
  try {
    await requireAdminAuth();

    const rows = await getFinancialCsvData();

    const headers = [
      "Tool Name",
      "Asset ID",
      "Category",
      "Status",
      "Replacement Cost",
      "Maintenance Cost",
      "Repair Cost",
      "Parts Cost",
      "Total Cost",
      "Net Position",
      "Reservation Count",
      "Cost Per Reservation",
    ];

    const csvLines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          `"${r.toolName.replace(/"/g, '""')}"`,
          `"${r.assetId}"`,
          `"${r.category}"`,
          `"${r.status}"`,
          r.replacementCost,
          r.maintenanceCost,
          r.repairCost,
          r.partsCost,
          r.totalCost,
          r.netPosition,
          r.reservationCount,
          r.costPerReservation,
        ].join(",")
      ),
    ];

    return { success: true, csv: csvLines.join("\n") };
  } catch (error) {
    console.error("generateCsvExport error:", error);
    return { success: false, error: "Failed to generate CSV." };
  }
}