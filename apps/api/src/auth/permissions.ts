import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

export const erpStatements = {
  ...defaultStatements,
  tenantSettings: ["read", "update"],
  auditLog: ["read"],
  erpWorkspace: ["read", "create", "update", "delete"],
  item: ["read", "create", "update", "archive"],
  location: ["read", "create", "update", "archive"],
  inventory: ["read", "adjust", "transfer"],
  supplier: ["read", "create", "update", "archive"],
  purchaseOrder: ["read", "create", "update", "submit", "receive", "cancel"],
  vendorBill: ["read", "create", "update", "pay", "void"],
  storage: ["read", "upload", "delete", "manage"],
  staff: ["read", "create", "update", "archive", "selfUpdate"],
  department: ["read", "create", "update", "archive"],
  team: ["read", "create", "update", "archive"],
  timeOff: ["read", "request", "approve"],
  calendar: ["read", "manage"],
  crm: ["read", "create", "update", "delete", "configure"],
  pricing: ["read", "create", "update", "archive", "quote"],
} as const;

export type ErpStatements = typeof erpStatements;
export type ErpResource = keyof ErpStatements;
export type OrgPermissionRequirement = {
  [K in ErpResource]?: readonly ErpStatements[K][number][];
};

export const ac = createAccessControl(erpStatements);

export const owner = ac.newRole({
  ...ownerAc.statements,
  tenantSettings: ["read", "update"],
  auditLog: ["read"],
  erpWorkspace: ["read", "create", "update", "delete"],
  item: ["read", "create", "update", "archive"],
  location: ["read", "create", "update", "archive"],
  inventory: ["read", "adjust", "transfer"],
  supplier: ["read", "create", "update", "archive"],
  purchaseOrder: ["read", "create", "update", "submit", "receive", "cancel"],
  vendorBill: ["read", "create", "update", "pay", "void"],
  storage: ["read", "upload", "delete", "manage"],
  staff: ["read", "create", "update", "archive", "selfUpdate"],
  department: ["read", "create", "update", "archive"],
  team: ["read", "create", "update", "archive"],
  timeOff: ["read", "request", "approve"],
  calendar: ["read", "manage"],
  crm: ["read", "create", "update", "delete", "configure"],
  pricing: ["read", "create", "update", "archive", "quote"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  tenantSettings: ["read", "update"],
  auditLog: ["read"],
  erpWorkspace: ["read", "create", "update", "delete"],
  item: ["read", "create", "update", "archive"],
  location: ["read", "create", "update", "archive"],
  inventory: ["read", "adjust", "transfer"],
  supplier: ["read", "create", "update", "archive"],
  purchaseOrder: ["read", "create", "update", "submit", "receive", "cancel"],
  vendorBill: ["read", "create", "update", "pay", "void"],
  storage: ["read", "upload", "delete", "manage"],
  staff: ["read", "create", "update", "archive", "selfUpdate"],
  department: ["read", "create", "update", "archive"],
  team: ["read", "create", "update", "archive"],
  timeOff: ["read", "request", "approve"],
  calendar: ["read", "manage"],
  crm: ["read", "create", "update", "delete", "configure"],
  pricing: ["read", "create", "update", "archive", "quote"],
});

export const manager = ac.newRole({
  organization: [],
  member: ["create", "update"],
  invitation: ["create", "cancel"],
  team: ["read", "create", "update", "archive"],
  ac: ["read"],
  tenantSettings: ["read"],
  auditLog: ["read"],
  erpWorkspace: ["read", "create", "update"],
  item: ["read", "create", "update", "archive"],
  location: ["read", "create", "update", "archive"],
  inventory: ["read", "adjust", "transfer"],
  supplier: ["read", "create", "update", "archive"],
  purchaseOrder: ["read", "create", "update", "submit", "receive", "cancel"],
  vendorBill: ["read", "create", "update", "pay", "void"],
  storage: ["read", "upload", "delete"],
  staff: ["read", "create", "update", "archive", "selfUpdate"],
  department: ["read", "create", "update", "archive"],
  timeOff: ["read", "request", "approve"],
  calendar: ["read", "manage"],
  crm: ["read", "create", "update", "delete"],
  pricing: ["read", "create", "update", "quote"],
});

export const member = ac.newRole({
  ...memberAc.statements,
  tenantSettings: ["read"],
  erpWorkspace: ["read", "create", "update"],
  item: ["read", "create", "update"],
  location: ["read"],
  inventory: ["read", "adjust", "transfer"],
  supplier: ["read"],
  purchaseOrder: ["read", "create", "update", "receive"],
  vendorBill: ["read", "create"],
  storage: ["read", "upload"],
  staff: ["read", "selfUpdate"],
  department: ["read"],
  team: ["read"],
  timeOff: ["read", "request"],
  calendar: ["read"],
  crm: ["read", "create", "update", "delete"],
  pricing: ["read", "quote"],
});

export const viewer = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: ["read"],
  ac: ["read"],
  tenantSettings: ["read"],
  erpWorkspace: ["read"],
  item: ["read"],
  location: ["read"],
  inventory: ["read"],
  supplier: ["read"],
  purchaseOrder: ["read"],
  vendorBill: ["read"],
  storage: ["read"],
  staff: ["read"],
  department: ["read"],
  timeOff: ["read"],
  calendar: ["read"],
  crm: ["read"],
  pricing: ["read"],
});

export const organizationRoles = {
  owner,
  admin,
  manager,
  member,
  viewer,
} as const;

export type OrganizationRoleName = keyof typeof organizationRoles;

export const ORGANIZATION_ROLE_NAMES = Object.keys(
  organizationRoles,
) as OrganizationRoleName[];

export function isValidOrganizationRole(
  role: string,
): role is OrganizationRoleName {
  return Object.prototype.hasOwnProperty.call(organizationRoles, role);
}

export function parseRoleNames(roleValue: string): OrganizationRoleName[] {
  return roleValue
    .split(",")
    .map((r) => r.trim())
    .filter(isValidOrganizationRole);
}

export function getResolvedPermissionsForRole(
  roleValue: string,
): Record<ErpResource, string[]> {
  const resolved: Record<ErpResource, Set<string>> = {
    organization: new Set(),
    member: new Set(),
    invitation: new Set(),
    team: new Set(),
    ac: new Set(),
    tenantSettings: new Set(),
    auditLog: new Set(),
    erpWorkspace: new Set(),
    item: new Set(),
    location: new Set(),
    inventory: new Set(),
    supplier: new Set(),
    purchaseOrder: new Set(),
    vendorBill: new Set(),
    storage: new Set(),
    staff: new Set(),
    department: new Set(),
    timeOff: new Set(),
    calendar: new Set(),
    crm: new Set(),
    pricing: new Set(),
  };

  for (const roleName of parseRoleNames(roleNameList(roleValue))) {
    const roleDef = organizationRoles[roleName];
    const statements = roleDef.statements as Partial<
      Record<ErpResource, readonly string[]>
    >;
    for (const resource of Object.keys(statements) as ErpResource[]) {
      const actions = statements[resource] ?? [];
      for (const action of actions) {
        resolved[resource].add(action);
      }
    }
  }

  return {
    organization: Array.from(resolved.organization),
    member: Array.from(resolved.member),
    invitation: Array.from(resolved.invitation),
    team: Array.from(resolved.team),
    ac: Array.from(resolved.ac),
    tenantSettings: Array.from(resolved.tenantSettings),
    auditLog: Array.from(resolved.auditLog),
    erpWorkspace: Array.from(resolved.erpWorkspace),
    item: Array.from(resolved.item),
    location: Array.from(resolved.location),
    inventory: Array.from(resolved.inventory),
    supplier: Array.from(resolved.supplier),
    purchaseOrder: Array.from(resolved.purchaseOrder),
    vendorBill: Array.from(resolved.vendorBill),
    storage: Array.from(resolved.storage),
    staff: Array.from(resolved.staff),
    department: Array.from(resolved.department),
    timeOff: Array.from(resolved.timeOff),
    calendar: Array.from(resolved.calendar),
    crm: Array.from(resolved.crm),
    pricing: Array.from(resolved.pricing),
  };
}

function roleNameList(roleValue: string): string {
  return roleValue ?? "";
}

export function hasOrganizationPermission(
  roleValue: string,
  required: OrgPermissionRequirement,
): boolean {
  const roleNames = parseRoleNames(roleValue);
  if (roleNames.length === 0) {
    return false;
  }

  const resolved = getResolvedPermissionsForRole(roleValue);

  for (const [resource, actions] of Object.entries(required) as [
    ErpResource,
    readonly string[] | undefined,
  ][]) {
    if (!actions || actions.length === 0) {
      continue;
    }
    const granted = resolved[resource] ?? [];
    const hasAllActions = actions.every((action) => granted.includes(action));
    if (!hasAllActions) {
      return false;
    }
  }

  return true;
}
