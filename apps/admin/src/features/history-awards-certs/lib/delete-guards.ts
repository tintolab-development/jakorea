/**
 * 연혁/수상/인증 삭제 확인·실패 알림
 * 공개 항목도 삭제 가능 (BE: 공개 삭제 시 PublishPermissionGuard)
 */

/** 삭제 확인 모달 본문 — 일괄 삭제 공통 패턴 */
export function deleteConfirmContent(resourceLabel: string, count?: number) {
  const question =
    typeof count === 'number'
      ? `선택한 ${resourceLabel} ${count}건을 삭제하시겠습니까?`
      : `선택한 ${resourceLabel}을 삭제하시겠습니까?`
  return `${question}\n삭제된 항목은 복구할 수 없습니다.`
}

export function deleteFailureAlert(resourceLabel: string, _error?: unknown) {
  return {
    title: '삭제 실패',
    content: `${resourceLabel} 삭제에 실패했습니다. 다시 시도해 주세요.`,
  } as const
}
