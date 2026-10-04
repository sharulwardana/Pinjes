import "server-only";
import { db, type Tx } from "./db";

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.register"
  | "store.submitted"
  | "store.approved"
  | "store.rejected"
  | "store.suspended"
  | "store.reactivated"
  | "store.payment_info_updated"
  | "deposit.requested"
  | "deposit.approved"
  | "deposit.rejected"
  | "booking.created"
  | "booking.payment_submitted"
  | "booking.payment_confirmed"
  | "booking.payment_rejected"
  | "booking.status_changed"
  | "booking.cancelled"
  | "booking.duplicate_proof_detected"
  | "booking.suspicious_activity"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "product.admin_status_changed"
  | "user.suspended"
  | "user.activated"
  | "review.created"
  | "review.hidden"
  | "review.restored"
  | "category.created"
  | "category.updated"
  | "settings.updated";

export interface AuditInput {
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/** Append an audit log entry. Pass `tx` to make it part of the same transaction. */
export async function audit(input: AuditInput, client: Tx = db) {
  await client.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      ipAddress: input.ipAddress ?? null,
    },
  });
}
