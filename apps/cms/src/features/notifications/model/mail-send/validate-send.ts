import { extractPlaceholderKeysFromTexts } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import {
  partitionAlimtalkRecipientsByVariables,
  type AlimtalkVariableCatalogEntry,
} from '@/features/notifications/model/alimtalk-send/recipient-variables'
import { isNotificationMailContextPlaceholderKey } from '@/features/notifications/model/shared/mail-context-variables'
import { parseNotificationSendProgramId } from '@/features/notifications/model/send-program-id'
import { dedupeMailSendRecipients } from './recipients'
import type { MailSendRecipient } from './types'

/** 시안: 발송 시점 기본 미선택 — 알림톡 ALIMTALK_SEND_TIMING_REQUIRED_MESSAGE 와 동일 문구 */
export const MAIL_SEND_TIMING_REQUIRED_MESSAGE = '발송 시점을 선택해 주세요.'

export const MAIL_SEND_CONFIRM_MESSAGE = '해당 내용으로 메일을 발송하시겠습니까?'

export const MAIL_VARIABLE_EXCLUSION_GUIDE =
  '메시지에 사용한 변수값을 확인할 수 없는 수신자는 이번 발송에서 제외됩니다. 입력값, 회원 정보, 프로그램 정보를 확인하세요.'

export const MAIL_DUPLICATE_SEND_GUIDE = '같은 이메일 주소는 1건만 발송합니다.'

export type MailSendVariableValidationInput = {
  programId?: string
  subject: string
  bodyHtml: string
  recipients: MailSendRecipient[]
  placeholderKeys?: Iterable<string>
  catalog: AlimtalkVariableCatalogEntry[] | null | undefined
  catalogState: 'ready' | 'error' | 'pending'
}

export type MailSendVariableValidationResult =
  | { ok: false; title: string; alert: string }
  | { ok: true; validRecipients: MailSendRecipient[]; confirmMessage: string }

/**
 * 제목·본문의 #{키}.
 * 동의 항목·만료일시는 기존 문맥 입력으로 본문에 치환하므로 수신자 변수에서 뺀다.
 */
export function listMailSendPlaceholderKeys(subject: string, bodyHtml: string): string[] {
  return [...extractPlaceholderKeysFromTexts(subject, bodyHtml)]
    .filter(key => !isNotificationMailContextPlaceholderKey(key))
    .sort()
}

function confirmMessage(gaps: number, droppedDupes: number): string {
  const lines = [MAIL_SEND_CONFIRM_MESSAGE]
  if (gaps > 0) lines.push(MAIL_VARIABLE_EXCLUSION_GUIDE)
  if (droppedDupes > 0) lines.push(MAIL_DUPLICATE_SEND_GUIDE)
  return lines.join('\n')
}

/**
 * 발송 안내 전에 수신자를 가른다.
 * 변수값이 없는 수신자만 빼고, 나머지 수신자는 발송 대상에 남긴다.
 */
export function validateMailSendVariables(
  input: MailSendVariableValidationInput
): MailSendVariableValidationResult {
  if (input.recipients.length === 0) {
    return { ok: false, title: '필수 입력 안내', alert: '수신자를 설정하세요.' }
  }

  const keys = [
    ...(input.placeholderKeys ?? listMailSendPlaceholderKeys(input.subject, input.bodyHtml)),
  ]
    .map(key => key.trim())
    .filter(key => key && !isNotificationMailContextPlaceholderKey(key))
  const programSelected = parseNotificationSendProgramId(input.programId) != null

  if (keys.length === 0) {
    const uniqueValid = dedupeMailSendRecipients(input.recipients)
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
  const uniqueValid = dedupeMailSendRecipients(partitioned.valid)
  if (uniqueValid.length === 0) {
    return {
      ok: false,
      title: '필수 입력 안내',
      alert: `발송할 수 있는 수신자가 없습니다.\n${MAIL_VARIABLE_EXCLUSION_GUIDE}`,
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
