import type { NotificationTemplateVariablesQuery } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import { toTemplateVariablesRequestParams } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'

export type NotificationSendRecipientTypeMode = 'participation' | 'member'

/**
 * 발송 맥락 → `GET …/template-variables` 쿼리.
 * 확정 수신자에서 유일하게 추론된 참여 유형·회원 유형만 넘긴다.
 * 검색창 필터는 넣지 않는다. FE는 enabled를 재계산하지 않는다.
 */
export function buildNotificationTemplateVariablesQuery(input: {
  programId?: number | null
  participantTypeValue?: string
  memberTypeValue?: string
  toParticipantTypeApi: (value: string) => string | undefined
  toMemberTypeApi: (value: string) => string | undefined
}): NotificationTemplateVariablesQuery {
  const programId =
    input.programId != null && Number.isFinite(input.programId) ? input.programId : undefined
  const participantRaw = input.participantTypeValue?.trim() || ''
  const memberRaw = input.memberTypeValue?.trim() || ''

  return toTemplateVariablesRequestParams({
    programId,
    participantType: participantRaw ? input.toParticipantTypeApi(participantRaw) : undefined,
    memberType: memberRaw ? input.toMemberTypeApi(memberRaw) : undefined,
  })
}

/**
 * 선택 수신자에서 유형이 하나뿐일 때만 필터값으로 쓴다.
 * 혼합·미선택이면 생략한다. 이때 BE는 유형 한정 변수를 `enabled=false`로 준다(2026-11-11 확인).
 * 템플릿 선택 단계는 `isNotificationCatalogVariablePendingRecipientType`으로 이 변수를 막지 않는다.
 */
export function inferUniqueRecipientTypeValue(
  values: Array<string | undefined | null>
): string | undefined {
  const unique = [...new Set(values.map(value => (value ?? '').trim()).filter(Boolean))]
  return unique.length === 1 ? unique[0] : undefined
}
