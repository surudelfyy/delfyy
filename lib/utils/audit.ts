type AuditEvent = {
  action: string
  userId?: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
}

export function audit(event: AuditEvent) {
  console.log(
    '[AUDIT]',
    JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    }),
  )
}
