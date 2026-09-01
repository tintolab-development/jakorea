/**
 * 연혁/수상/인증 — 공개 중 삭제 불가 가드
 * BE: Published … records must be unpublished before deletion. (409 CONFLICT)
 * 단건: DELETE …/{id}?version= · 다건: POST …/bulk-delete (OpenAPI 계약)
 */

import axios from 'axios'

/** 삭제 불가(공개 중) 알림 모달 */
export function publishedMustUnpublishAlert(resourceLabel: string) {
  return {
    title: '삭제 불가',
    content: `공개 중인 ${resourceLabel}은(는) 삭제할 수 없습니다.\n공개 여부를 비공개로 변경한 뒤 다시 시도해 주세요.`,
  } as const
}

/** 삭제 확인 모달 본문 — 비공개만 삭제 가능 규칙 명시 */
export function deleteConfirmContent(resourceLabel: string, count?: number) {
  const target =
    typeof count === 'number'
      ? `선택한 ${resourceLabel} ${count}건`
      : `선택한 ${resourceLabel}`
  return [
    `공개 여부가 비공개인 ${resourceLabel}만 삭제할 수 있습니다.`,
    `${target}을(를) 삭제하시겠습니까?`,
    '삭제된 항목은 복구할 수 없습니다.',
  ].join('\n')
}

export function deleteFailureAlert(resourceLabel: string, error: unknown) {
  if (isPublishedDeleteConflictError(error)) {
    return publishedMustUnpublishAlert(resourceLabel)
  }
  return {
    title: '삭제 실패',
    content: `${resourceLabel} 삭제에 실패했습니다. 다시 시도해 주세요.`,
  } as const
}

export function isPublishedDeleteConflictError(error: unknown): boolean {
  const message = readApiErrorMessage(error)
  if (!message) return false
  return /unpublished before deletion/i.test(message) || /must be unpublished/i.test(message)
}

function readApiErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && error.message) return error.message
    return undefined
  }
  const data = error.response?.data
  if (!data || typeof data !== 'object') return undefined
  const record = data as {
    message?: unknown
    error?: { message?: unknown }
  }
  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message
  }
  if (record.error && typeof record.error.message === 'string') {
    return record.error.message
  }
  return undefined
}
