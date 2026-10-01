export const customerRequirementSelect = {
  contactName: true,
  storeName: true,
  city: true,
} as const;

/** Store and contact names the admin screens show for a customer. */
export function customerNames(user: {
  name: string | null;
  requirement?: { contactName: string | null; storeName: string | null } | null;
}) {
  return {
    contactName: user.requirement?.contactName || user.name || "",
    storeName: user.requirement?.storeName || "",
  };
}
