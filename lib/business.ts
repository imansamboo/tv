import type { Requirement } from "@prisma/client";
import {
  customerInfo,
  emptyRequirement,
  parseRequirementData,
  parseRequirementForm,
  type RequirementData,
  type RequirementForm,
} from "./form";
import { prisma } from "./prisma";
import { summarizeRequirements } from "./summary";

export type BusinessOption = { id: string; name: string; description: string | null };

export function listActiveBusinesses(): Promise<BusinessOption[]> {
  return prisma.business.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, description: true },
  });
}

/** The business's form, or `null` when the business is missing or its form is broken. */
export async function loadBusinessForm(businessId: string, { activeOnly = false } = {}) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || (activeOnly && !business.active)) return null;
  const form = parseRequirementForm(business.form);
  return form ? { business, form } : null;
}

/** The form a requirement is shown with: its own snapshot once submitted. */
export function formForRequirement(
  requirement: Pick<Requirement, "status" | "formSnapshot"> | null | undefined,
  businessForm: RequirementForm | null,
): RequirementForm | null {
  if (requirement?.status === "SUBMITTED" && requirement.formSnapshot) {
    return parseRequirementForm(requirement.formSnapshot) ?? businessForm;
  }
  return businessForm;
}

/** Columns derived from the answers, written on every save. */
export function requirementColumns(form: RequirementForm, data: RequirementData) {
  const info = customerInfo(form, data);
  const summary = summarizeRequirements(form, data);
  return {
    columns: {
      data: JSON.stringify(data),
      contactName: info.contactName,
      storeName: info.storeName,
      city: info.city,
      tvPrice: 0,
      extrasPrice: summary.featureCount,
      totalPrice: summary.completionPercent,
    },
    summary,
  };
}

/** A fresh draft for `form`, with the contact field prefilled from the account name. */
export function initialRequirement(form: RequirementForm, userName: string | null | undefined) {
  const data = emptyRequirement(form);
  const contactField = form.steps.flatMap((step) => step.fields).find((f) => f.role === "contactName");
  if (contactField && contactField.type === "text" && userName) {
    data.values[contactField.key] = userName;
  }
  return requirementColumns(form, data);
}

export type CustomerRequirement =
  | { kind: "needsBusiness" }
  | { kind: "brokenForm" }
  | {
      kind: "ready";
      business: { id: string; name: string };
      pricingFormAssigned: boolean;
      form: RequirementForm;
      requirement: Requirement;
      data: RequirementData;
    };

/** Everything the customer wizard needs; creates the draft on first visit. */
export async function loadCustomerRequirement(userId: string): Promise<CustomerRequirement> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, pricingFormId: true, business: true, requirement: true },
  });
  if (!user?.business) return { kind: "needsBusiness" };

  const businessForm = parseRequirementForm(user.business.form);
  let requirement = user.requirement;
  const form = formForRequirement(requirement, businessForm);
  if (!form) return { kind: "brokenForm" };

  if (!requirement) {
    requirement = await prisma.requirement.create({
      data: { userId, ...initialRequirement(form, user.name).columns },
    });
  }
  return {
    kind: "ready",
    business: { id: user.business.id, name: user.business.name },
    pricingFormAssigned: Boolean(user.pricingFormId),
    form,
    requirement,
    data: parseRequirementData(requirement.data, form),
  };
}

export type BusinessSummary = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
  stepCount: number;
  fieldCount: number;
  userCount: number;
  formError: boolean;
  updatedAt: Date;
};

export async function listBusinesses(): Promise<BusinessSummary[]> {
  const rows = await prisma.business.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { users: true } } },
  });
  return rows.map((row) => {
    const form = parseRequirementForm(row.form);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      active: row.active,
      sortOrder: row.sortOrder,
      stepCount: form?.steps.length ?? 0,
      fieldCount: form ? form.steps.reduce((sum, step) => sum + step.fields.length, 0) : 0,
      userCount: row._count.users,
      formError: !form,
      updatedAt: row.updatedAt,
    };
  });
}

export type BusinessDetail = Omit<BusinessSummary, "stepCount" | "fieldCount" | "formError"> & {
  form: RequirementForm | null;
  submittedCount: number;
};

export async function loadBusinessDetail(id: string): Promise<BusinessDetail | null> {
  const row = await prisma.business.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!row) return null;
  const submittedCount = await prisma.requirement.count({
    where: { status: "SUBMITTED", user: { businessId: id } },
  });
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    active: row.active,
    sortOrder: row.sortOrder,
    userCount: row._count.users,
    submittedCount,
    updatedAt: row.updatedAt,
    form: parseRequirementForm(row.form),
  };
}

export const BROKEN_FORM_ERROR = "فرم نیازمندی این کسب‌وکار در دسترس نیست. با پشتیبانی تماس بگیرید.";
