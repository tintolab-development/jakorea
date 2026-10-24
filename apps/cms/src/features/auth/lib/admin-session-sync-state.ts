let readAdminSessionSyncPending: () => boolean = () => false

export function registerAdminSessionSyncPendingReader(reader: () => boolean): void {
  readAdminSessionSyncPending = reader
}

export function isAdminSessionRoleSyncPending(): boolean {
  return readAdminSessionSyncPending()
}
