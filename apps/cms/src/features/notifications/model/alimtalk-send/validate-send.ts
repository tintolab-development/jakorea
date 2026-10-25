import type { AlimtalkSendRecipient } from './types'
import {
  formatAlimtalkPartialSendConfirm,
  formatAlimtalkRecipientVariableGapMessage,
  partitionAlimtalkRecipientsByVariables,
  type AlimtalkVariableCatalogEntry,
} from './recipient-variables'
import { dedupeAlimtalkSendRecipients } from './recipients'
import {
  isNotificationSendWithoutProgram,
  parseNotificationSendProgramId,
} from '@/features/notifications/model/send-program-id'
import { validateNotificationScheduledAt } from '@/features/notifications/model/send-scheduled-at'

export const ALIMTALK_SEND_CONFIRM_MESSAGE = '해당 내용으로 알림톡을 발송하시겠습니까?'

export const ALIMTALK_SEND_STATE_CHANGED_MESSAGE =
  '수신자 또는 변수값이 변경되었습니다. 발송 내용을 다시 확인해 주세요.'

export type AlimtalkSendValidationInput = {
  senderSelected: boolean
  senderKey?: string
  senderProfileId?: number
  templateId?: string
  templateName?: string
  approvalStatus?: string | null
  sendTiming: 'immediate' | 'scheduled'
  scheduledAt: string | null
  programId?: string
  recipients: AlimtalkSendRecipient[]
  placeholderKeys: Iterable<string>
  catalog: AlimtalkVariableCatalogEntry[] | null | undefined
  catalogState: 'ready' | 'error' | 'pending'
  nowMs?: number
}

export type AlimtalkSendValidationResult =
  | { ok: false; title: string; alert: string }
  | {
      ok: true
      validRecipients: AlimtalkSendRecipient[]
      confirmMessage: string
      fingerprint: string
    }

function sendFingerprint(
  input: AlimtalkSendValidationInput,
  validRecipients: AlimtalkSendRecipient[]
): string {
  return JSON.stringify({
    templateId: input.templateId ?? '',
    senderKey: input.senderKey ?? '',
    programId: input.programId ?? '',
    sendTiming: input.sendTiming,
    scheduledAt: input.scheduledAt ?? '',
    recipients: validRecipients.map(recipient => ({
      id: recipient.id,
      actorType: recipient.actorType ?? '',
      actorId: recipient.actorId ?? null,
      phone: recipient.phone,
      variables: recipient.variables ?? {},
    })),
  })
}

/**
 * 발송 버튼과 최종 확인이 같이 쓰는 검증.
 * 통과한 수신자만 payload에 넣고, 누락 수신자는 목록에서 지우지 않는다.
 */
export function validateAlimtalkSendRequest(
  input: AlimtalkSendValidationInput
): AlimtalkSendValidationResult {
  if (!input.senderSelected) {
    return { ok: false, title: '필수 입력 안내', alert: '발신 프로필을 선택하세요.' }
  }
  if (!input.templateId?.trim()) {
    return { ok: false, title: '필수 입력 안내', alert: '템플릿을 선택하세요.' }
  }
  if (input.approvalStatus !== 'APPROVED') {
    return {
      ok: false,
      title: '안내',
      alert: '카카오 승인이 완료되지 않은 템플릿은 발송할 수 없습니다.',
    }
  }
  const scheduleError = validateNotificationScheduledAt({
    sendTiming: input.sendTiming,
    scheduledAt: input.scheduledAt,
    nowMs: input.nowMs,
  })
  if (scheduleError) {
    return { ok: false, title: '필수 입력 안내', alert: scheduleError }
  }
  if (input.recipients.length === 0) {
    return { ok: false, title: '필수 입력 안내', alert: '수신자를 설정하세요.' }
  }
  const withoutProgram = isNotificationSendWithoutProgram(input.programId)
  const programNumericId = parseNotificationSendProgramId(input.programId)
  if (!withoutProgram && programNumericId == null) {
    return { ok: false, title: '필수 입력 안내', alert: '대상 프로그램을 선택하세요.' }
  }

  const keys = [...input.placeholderKeys].map(key => key.trim()).filter(Boolean)
  const programSelected = programNumericId != null

  if (keys.length === 0) {
    const uniqueValid = dedupeAlimtalkSendRecipients(input.recipients)
    if (uniqueValid.length === 0) {
      return { ok: false, title: '필수 입력 안내', alert: '수신자를 설정하세요.' }
    }
    const dropped = input.recipients.length - uniqueValid.length
    return {
      ok: true,
      validRecipients: uniqueValid,
      confirmMessage:
        dropped > 0
          ? `같은 휴대폰 번호로 이미 포함된 수신자 ${dropped}명은 이번 발송에서 제외됩니다.\n제외하고 발송할까요?`
          : ALIMTALK_SEND_CONFIRM_MESSAGE,
      fingerprint: sendFingerprint(input, uniqueValid),
    }
  }

  if (input.catalogState === 'error') {
    return {
      ok: false,
      title: '안내',
      alert: '변수 목록을 불러오지 못했습니다. 다시 시도해 주세요.',
    }
  }
  if (input.catalogState !== 'ready' || input.catalog == null) {
    return {
      ok: false,
      title: '안내',
      alert: '변수 목록을 확인한 뒤 발송할 수 있습니다.',
    }
  }

  const partitioned = partitionAlimtalkRecipientsByVariables({
    keys,
    catalog: input.catalog,
    recipients: input.recipients,
    programSelected,
  })
  const uniqueValid = dedupeAlimtalkSendRecipients(partitioned.valid)
  if (uniqueValid.length === 0) {
    return {
      ok: false,
      title: '필수 입력 안내',
      alert: `발송할 수 있는 수신자가 없습니다.\n${formatAlimtalkRecipientVariableGapMessage(partitioned.gaps)}`,
    }
  }

  const dropped = partitioned.valid.length - uniqueValid.length
  let confirmMessage = ALIMTALK_SEND_CONFIRM_MESSAGE
  if (partitioned.gaps.length > 0) {
    confirmMessage = formatAlimtalkPartialSendConfirm({
      validCount: uniqueValid.length,
      gaps: partitioned.gaps,
    })
    if (dropped > 0) {
      confirmMessage += `\n같은 휴대폰 번호로 이미 포함된 수신자 ${dropped}명은 이번 발송에서 제외됩니다.`
    }
  } else if (dropped > 0) {
    confirmMessage = `같은 휴대폰 번호로 이미 포함된 수신자 ${dropped}명은 이번 발송에서 제외됩니다.\n제외하고 발송할까요?`
  }

  return {
    ok: true,
    validRecipients: uniqueValid,
    confirmMessage,
    fingerprint: sendFingerprint(input, uniqueValid),
  }
}
