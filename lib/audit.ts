import { prisma } from "@/lib/prisma"

export type AuditAction =
    // Bookings
    | "booking.created"
    | "booking.cancelled_by_user"
    | "booking.cancelled_by_admin"
    | "booking.dates_edited"
    | "booking.activated"
    | "booking.completed"
    | "booking.status_changed"
    | "booking.deleted"
    | "booking.refunded"
    // Cars
    | "car.submitted"
    | "car.edited"
    | "car.deactivated"
    | "car.approved"
    | "car.rejected"
    // Payments
    | "payment.deposit_confirmed"
    | "payment.km_purchased"
    | "payment.excess_km_paid"
    // Reviews
    | "review.submitted"
    | "review.approved"
    | "review.rejected"
    // Users
    | "user.registered"
    | "user.edited"
    | "user.deleted"
    | "user.role_changed"

export type AuditLevel = "INFO" | "WARN" | "ERROR"

export interface AuditParams {
    action:     AuditAction
    entity?:    string
    entityId?:  string
    userId?:    string | null
    userEmail?: string | null
    userRole?:  string | null
    level?:     AuditLevel
    metadata?:  Record<string, unknown>
}

/**
 * Write an audit log entry. Always fire-and-forget — never throws.
 * Call without await so it never blocks the response.
 */
export function audit(params: AuditParams): void {
    const { action, entity, entityId, userId, userEmail, userRole, level = "INFO", metadata } = params
    prisma.auditLog.create({
        data: {
            action,
            entity:    entity    ?? null,
            entityId:  entityId  ?? null,
            userId:    userId    ?? null,
            userEmail: userEmail ?? null,
            userRole:  userRole  ?? null,
            level,
            metadata:  metadata ? (metadata as object) : undefined,
        },
    }).catch(err => console.error("[audit] write failed:", err))
}
