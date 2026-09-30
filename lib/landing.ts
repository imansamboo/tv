import type { SessionUser } from "./auth";
import { prisma } from "./prisma";

/**
 * Where a signed-in user belongs right now. Customers stay on the requirements
 * wizard until they lock it, then move on to the pricing form.
 */
export async function landingPathFor(user: {
  id: string;
  role: SessionUser["role"];
}): Promise<string> {
  if (user.role === "ADMIN") return "/admin";

  const requirement = await prisma.requirement.findUnique({
    where: { userId: user.id },
    select: { status: true },
  });
  return requirement?.status === "SUBMITTED" ? "/pricing" : "/form";
}
