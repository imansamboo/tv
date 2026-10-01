import { mergeRequirement } from "./form";

/** Store and contact names the admin screens show for a customer. */
export function customerNames(user: {
  name: string | null;
  requirement?: { data: string } | null;
}) {
  const raw = user.requirement?.data;
  const requirement = raw ? mergeRequirement(JSON.parse(raw)) : null;
  return {
    contactName: requirement?.contactName || user.name || "",
    storeName: requirement?.storeName || "",
  };
}
