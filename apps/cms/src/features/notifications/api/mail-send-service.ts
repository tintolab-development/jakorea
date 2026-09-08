import type { CreateRequest, RecipientRequest } from '@/shared/api/generated/notifications/schemas'
import { createSendBatchRemote } from '@/features/notifications/api/notifications-api-client'
import type { MailSendDraft, MailSendRecipient } from '@/features/notifications/model/mail-send/types'
import {
  createMailSendHistoryRowsFromDraft,
  prependMailSendHistoryMockRows,
} from '@/features/notifications/model/mail-send-history/session-store'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function shouldUseMailSendRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

function buildMailSendRecipients(recipients: MailSendRecipient[]): RecipientRequest[] {
  return recipients.map(recipient => {
    if (recipient.source === 'manual') {
      return {
        actorType: 'DIRECT',
        recipientContact: recipient.email.trim(),
        recipientName: recipient.name.trim() || undefined,
      }
    }
    const actorIdMatch = /^actor-[^-]+-(\d+)$/.exec(recipient.id)
    const actorId = actorIdMatch ? Number(actorIdMatch[1]) : undefined
    return {
      actorType: 'MEMBER',
      actorId: Number.isFinite(actorId) ? actorId : undefined,
      recipientName: recipient.name.trim() || undefined,
      recipientContact: recipient.email.includes('*') ? undefined : recipient.email.trim(),
    }
  })
}

/**
 * 메일 발송 — `POST /api/admin/notification-send-batches` (channel은 templateId로 추론).
 * - 숫자 templateId + remote 가능 시 실발송 (실패 시 throw, mock 폴백 없음)
 * - mock 전용 환경에서만 세션 이력에 기록
 * - Hub scheduledDateTime 금지 → `scheduledAt`만 사용
 */
export async function submitMailSend(input: {
  draft: MailSendDraft
  templateDisplayName?: string
  idempotencyKey: string
  senderProfileId?: number
}): Promise<{ mode: 'remote' | 'mock' }> {
  const { draft, templateDisplayName, idempotencyKey, senderProfileId } = input

  const numericTemplateId =
    draft.templateId && /^\d+$/.test(draft.templateId.trim())
      ? Number(draft.templateId.trim())
      : null

  if (shouldUseMailSendRemoteApi()) {
    if (numericTemplateId == null) {
      throw new Error('메일 발송에는 서버에 등록된 템플릿이 필요합니다.')
    }

    const programIdRaw = draft.programId
    const programId =
      programIdRaw && programIdRaw !== 'all' && Number.isFinite(Number(programIdRaw))
        ? Number(programIdRaw)
        : undefined

    const body: CreateRequest = {
      batchName: draft.subject.slice(0, 200) || '메일 발송',
      templateId: numericTemplateId,
      programId,
      scheduledAt: draft.sendTiming === 'scheduled' ? draft.scheduledAt ?? undefined : undefined,
      recipients: buildMailSendRecipients(draft.recipients),
      senderProfileId,
    }

    await createSendBatchRemote(body, idempotencyKey)
    return { mode: 'remote' }
  }

  const rows = createMailSendHistoryRowsFromDraft(draft, templateDisplayName)
  prependMailSendHistoryMockRows(rows)
  return { mode: 'mock' }
}
