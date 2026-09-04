/**
 * Platform roles. Mirrors the `user_role` Postgres enum (0003_identity.sql).
 * Keep these two definitions in sync manually — Supabase enums aren't
 * introspected at build time.
 */
export const USER_ROLES = ["customer", "seller", "moderator", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS_UZ: Record<UserRole, string> = {
  customer: "Mijoz",
  seller: "Sotuvchi",
  moderator: "Moderator",
  admin: "Super Admin",
};

/** "guest" is anyone without a session — never stored, only used client-side. */
export type EffectiveRole = "guest" | UserRole;

export function isStaffRole(role: EffectiveRole): boolean {
  return role === "moderator" || role === "admin";
}

export function canManageStore(role: EffectiveRole): boolean {
  return role === "seller" || role === "admin";
}

/**
 * Store-level membership role (store_members.role). Distinct from the
 * platform-wide UserRole — a "customer" can never hold this, but a seller
 * can be an 'owner' of one store and a 'staff' member of another.
 */
export const STORE_MEMBER_ROLES = ["owner", "manager", "staff"] as const;
export type StoreMemberRole = (typeof STORE_MEMBER_ROLES)[number];

const STORE_ROLE_RANK: Record<StoreMemberRole, number> = { staff: 1, manager: 2, owner: 3 };

export function hasStoreRoleAtLeast(role: StoreMemberRole, min: StoreMemberRole): boolean {
  return STORE_ROLE_RANK[role] >= STORE_ROLE_RANK[min];
}
