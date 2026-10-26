let recruitTypedInterviewBridgeRecord: Record<string, unknown> | null = null
let recruitTypedInterviewBridgeOnChange:
  | ((record: Record<string, unknown>) => void)
  | null = null
const recruitTypedInterviewBridgeListeners = new Set<() => void>()

function notifyRecruitTypedInterviewBridge(): void {
  for (const listener of recruitTypedInterviewBridgeListeners) listener()
}

/** 활성 UJAT 모집 편집 — 전역 Overlay store 대신 행 interviewConfig 브리지. */
export function setRecruitTypedInterviewRecordBridge(
  record: Record<string, unknown> | null,
  onChange?: ((record: Record<string, unknown>) => void) | null
): void {
  recruitTypedInterviewBridgeRecord = record
  recruitTypedInterviewBridgeOnChange = record == null ? null : onChange ?? null
  notifyRecruitTypedInterviewBridge()
}

export function getRecruitTypedInterviewRecord(): Record<string, unknown> | null {
  return recruitTypedInterviewBridgeRecord
}

export function subscribeRecruitTypedInterviewBridge(listener: () => void): () => void {
  recruitTypedInterviewBridgeListeners.add(listener)
  return () => {
    recruitTypedInterviewBridgeListeners.delete(listener)
  }
}

export function patchRecruitTypedInterviewBridgeRecord(
  partial: Record<string, unknown>,
  isSameValue: (left: unknown, right: unknown) => boolean
): boolean {
  if (!recruitTypedInterviewBridgeRecord) return false
  let changed = false
  for (const [key, value] of Object.entries(partial)) {
    if (isSameValue(recruitTypedInterviewBridgeRecord[key], value)) continue
    recruitTypedInterviewBridgeRecord[key] = value
    changed = true
  }
  if (!changed) return true
  recruitTypedInterviewBridgeOnChange?.({ ...recruitTypedInterviewBridgeRecord })
  notifyRecruitTypedInterviewBridge()
  return true
}
