import { extractPlaceholderKeysFromTexts } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import {
  partitionAlimtalkRecipientsByVariables,
  type AlimtalkVariableCatalogEntry,
} from '@/features/notifications/model/alimtalk-send/recipient-variables'
import { parseNotificationSendProgramId } from '@/features/notifications/model/send-program-id'
import { dedupeSmsSendRecipients } from './recipients'
import type { SmsSendRecipient } from './types'

export const SMS_SEND_CONFIRM_MESSAGE = '해당 내용으로 문자를 발송하시겠습니까?'

/** 시안: 발송 시점 기본 미선택 — 즉시/예약을 고르지 않으면 발송을 막는다. */
export const SMS_SEND_TIMING_REQUIRED_MESSAGE = '발송 시점을 선택해 주세요.'

export const SMS_VARIABLE_EXCLUSION_GUIDE =
  '메시지에 사용한 변수값을 확인할 수 없는 수신자는 이번 발송에서 제외됩니다. 입력값, 회원 정보, 프로그램 정보를 확인하세요.'

export const SMS_DUPLICATE_SEND_GUIDE = '같은 휴대폰 번호는 1건만 발송합니다.'

export type SmsSendVariableValidationInput = {
  programId?: string
  messageType: string
  subject: string
  bodyText: string
  recipients: SmsSendRecipient[]
  placeholderKeys?: Iterable<string>
  catalog: AlimtalkVariableCatalogEntry[] | null | undefined
  catalogState: 'ready' | 'error' | 'pending'
}

export type SmsSendVariableValidationResult =
  | { ok: false; title: string; alert: string }
  | { ok: true; validRecipients: SmsSendRecipient[]; confirmMessage: string }

/** SMS는 본문만, LMS/MMS는 제목·본문에 실제로 있는 #{키}. */
export function listSmsSendPlaceholderKeys(input: {
  messageType: string
  subject: string
  bodyText: string
}): string[] {
  const texts = input.messageType === 'SMS' ? [input.bodyText] : [input.subject, input.bodyText]
  return [...extractPlaceholderKeysFromTexts(...texts)].sort()
}

function confirmMessage(gaps: number, droppedDupes: number): string {
  const lines = [SMS_SEND_CONFIRM_MESSAGE]
  if (gaps > 0) lines.push(SMS_VARIABLE_EXCLUSION_GUIDE)
  if (droppedDupes > 0) lines.push(SMS_DUPLICATE_SEND_GUIDE)
  return lines.join('\n')
}

/**
 * 발송 안내 전에 수신자를 가른다.
 * 변수값이 없는 수신자만 빼고, 나머지 수신자는 발송 대상에 남긴다.
 */
export function validateSmsSendVariables(
  input: SmsSendVariableValidationInput
): SmsSendVariableValidationResult {
  if (input.recipients.length === 0) {
    return { ok: false, title: '필수 입력 안내', alert: '수신자를 설정하세요.' }
  }

  const keys = [
    ...(input.placeholderKeys ??
      listSmsSendPlaceholderKeys({
        messageType: input.messageType,
        subject: input.subject,
        bodyText: input.bodyText,
      })),
  ]
    .map(key => key.trim())
    .filter(Boolean)
  const programSelected = parseNotificationSendProgramId(input.programId) != null

  if (keys.length === 0) {
    const uniqueValid = dedupeSmsSendRecipients(input.recipients)
    if (uniqueValid.length === 0) {
      return { ok: false, title: '필수 입력 안내', alert: '수신자를 설정하세요.' }
    }
    return {
      ok: true,
      validRecipients: uniqueValid,
      confirmMessage: confirmMessage(0, input.recipients.length - uniqueValid.length),
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
  const uniqueValid = dedupeSmsSendRecipients(partitioned.valid)
  if (uniqueValid.length === 0) {
    return {
      ok: false,
      title: '필수 입력 안내',
      alert: `발송할 수 있는 수신자가 없습니다.\n${SMS_VARIABLE_EXCLUSION_GUIDE}`,
    }
  }

  return {
    ok: true,
    validRecipients: uniqueValid,
    confirmMessage: confirmMessage(
      partitioned.gaps.length,
      partitioned.valid.length - uniqueValid.length
    ),
  }
}
