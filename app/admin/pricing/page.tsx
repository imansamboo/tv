"use client";

import { AdminShell } from "@/components/AdminShell";
import { PricingConfigManager } from "@/components/pricing/PricingConfigManager";

export default function AdminPricingPage() {
  return (
    <AdminShell>
      <PricingConfigManager />
    </AdminShell>
  );
}
