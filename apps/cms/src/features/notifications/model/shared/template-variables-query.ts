import type { NotificationTemplateVariablesQuery } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import { toTemplateVariablesRequestParams } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'

export type NotificationSendRecipientTypeMode = 'participation' | 'member'

/**
 * 발송 맥락 → `GET …/template-variables` 쿼리.
 * - 프로그램 선택 시 `programId` + (있으면) `participantType`
 * - 프로그램 미선택(전체) 시 `memberType`만 (있으면)
 * FE는 enabled를 재계산하지 않고, 맥락 파라미터만 정확히 넘긴다.
 */
export function buildNotificationTemplateVariablesQuery(input: {
  programId?: number | null
  recipientTypeMode: NotificationSendRecipientTypeMode
  /** 수신자 필터 또는 선택 수신자에서 유추한 UI type value */
  typeValue?: string
  toParticipantTypeApi: (value: string) => string | undefined
  toMemberTypeApi: (value: string) => string | undefined
}): NotificationTemplateVariablesQuery {
  const programId =
    input.programId != null && Number.isFinite(input.programId) ? input.programId : undefined
  const typeValue = input.typeValue?.trim() || ''

  if (input.recipientTypeMode === 'participation') {
    return toTemplateVariablesRequestParams({
      programId,
      participantType: typeValue ? input.toParticipantTypeApi(typeValue) : undefined,
    })
  }

  return toTemplateVariablesRequestParams({
    programId,
    memberType: typeValue ? input.toMemberTypeApi(typeValue) : undefined,
  })
}

/** 선택 수신자에서 유형이 하나뿐일 때만 필터값으로 쓴다 (혼합이면 생략 → BE가 보수적으로 enabled). */
export function inferUniqueRecipientTypeValue(
  values: Array<string | undefined | null>
): string | undefined {
  const unique = [
    ...new Set(values.map(value => (value ?? '').trim()).filter(Boolean)),
  ]
  return unique.length === 1 ? unique[0] : undefined
}
