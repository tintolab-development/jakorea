import type { CreateRequest, RecipientRequest } from '@/shared/api/generated/notifications/schemas'
import { MAIL_API_CHANNEL_TYPE } from '@/features/notifications/api/adapters/mail-channel'
import { mapMailRecipientCandidates } from '@/features/notifications/api/adapters/mail-send-adapters'
import {
  mapTemplateVariablesCatalog,
  pickNonEmptySendVariables,
  type AlimtalkTemplateVariable,
  type NotificationTemplateVariablesQuery,
} from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import {
  mapSenderProfileOptions,
  type AlimtalkSenderProfileOption,
} from '@/features/notifications/api/adapters/alimtalk-sender-adapters'
import {
  createSendBatchRemote,
  fetchRecipientCandidatesRemote,
  fetchSenderProfilesRemote,
  fetchTemplateVariablesRemote,
} from '@/features/notifications/api/notifications-api-client'
import { MAIL_SEND_RECIPIENT_MOCK } from '@/features/notifications/model/mail-send/mock'
import { parseNotificationSendProgramId } from '@/features/notifications/model/send-program-id'
import type { MailSendDraft, MailSendRecipient } from '@/features/notifications/model/mail-send/types'
import {
  createMailSendHistoryRowsFromDraft,
  prependMailSendHistoryMockRows,
} from '@/features/notifications/model/mail-send-history/session-store'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export type MailSenderProfileOption = AlimtalkSenderProfileOption

export function shouldUseMailSendRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

export function buildMailSendRecipients(recipients: MailSendRecipient[]): RecipientRequest[] {
  return recipients.map(recipient => {
    if (recipient.source === 'manual' || recipient.actorType === 'DIRECT') {
      return {
        actorType: 'DIRECT',
        recipientContact: recipient.email.trim(),
        recipientName: recipient.name.trim() || undefined,
      }
    }
    const actorIdMatch = /^actor-[^-]+-(\d+)$/.exec(recipient.id)
    const parsedActorId = actorIdMatch ? Number(actorIdMatch[1]) : undefined
    const actorId =
      recipient.actorId != null && Number.isFinite(recipient.actorId)
        ? recipient.actorId
        : Number.isFinite(parsedActorId)
          ? parsedActorId
          : undefined
    return {
      actorType: recipient.actorType || 'MEMBER',
      actorId,
      recipientName: recipient.name.trim() || undefined,
      recipientContact: recipient.email.includes('*') ? undefined : recipient.email.trim(),
    }
  })
}

export async function getMailSenderProfiles(): Promise<MailSenderProfileOption[]> {
  if (!shouldUseMailSendRemoteApi()) {
    return [
      {
        profileId: 1,
        senderKey: 'noreply@jakorea.org',
        displayName: 'JA Korea',
      },
    ]
  }
  const dto = await fetchSenderProfilesRemote({
    channelType: MAIL_API_CHANNEL_TYPE,
    useYn: true,
  })
  return mapSenderProfileOptions(dto.items)
}

/** 발신 메일 주소로 EMAIL senderProfileId 매칭 (senderKey ≈ 메일주소) */
export function resolveMailSenderProfileId(
  profiles: MailSenderProfileOption[],
  senderEmail: string
): number | undefined {
  const email = senderEmail.trim().toLowerCase()
  if (!email) return undefined
  const matched = profiles.find(profile => profile.senderKey.trim().toLowerCase() === email)
  return matched?.profileId
}

export async function getMailRecipientCandidates(input: {
  programId: number
  keyword?: string
  participantType?: string
  memberType?: string
  page?: number
  size?: number
}): Promise<{
  items: MailSendRecipient[]
  total: number
  page: number
  size: number
  totalPages: number
}> {
  const size = input.size ?? 100
  const page = input.page ?? 0
  if (!shouldUseMailSendRemoteApi()) {
    return {
      items: MAIL_SEND_RECIPIENT_MOCK,
      total: MAIL_SEND_RECIPIENT_MOCK.length,
      page,
      size,
      totalPages: Math.max(Math.ceil(MAIL_SEND_RECIPIENT_MOCK.length / size), 1),
    }
  }
  const dto = await fetchRecipientCandidatesRemote({
    channelType: MAIL_API_CHANNEL_TYPE,
    programId: input.programId,
    keyword: input.keyword,
    participantType: input.participantType,
    memberType: input.memberType,
    page,
    size,
  })
  const total = dto.totalElements ?? dto.items?.length ?? 0
  const resolvedSize = dto.size ?? size
  return {
    items: mapMailRecipientCandidates(dto.items),
    total,
    page: dto.page ?? page,
    size: resolvedSize,
    totalPages: dto.totalPages ?? Math.max(Math.ceil(total / (resolvedSize || 100)), 1),
  }
}

export async function getMailTemplateVariables(
  input: NotificationTemplateVariablesQuery = {}
): Promise<AlimtalkTemplateVariable[]> {
  if (!shouldUseMailSendRemoteApi()) return []
  const dto = await fetchTemplateVariablesRemote({
    category: input.category,
    keyword: input.keyword,
    programId: input.programId,
    participantType: input.participantType,
    memberType: input.memberType,
  })
  return mapTemplateVariablesCatalog(dto)
}

/**
 * 메일 발송 — `POST /api/admin/notification-send-batches`
 * - Hub scheduledDateTime 금지 → `scheduledAt`만 사용
 * - 제목/본문 override API 없음 → 저장된 템플릿 + BE 변수 치환
 * - senderProfileId: EMAIL 프로필 (메일주소 = senderKey)
 * - variables 빈 문자열 패딩 금지 (BE 자동입력을 덮어씀)
 */
export async function submitMailSend(input: {
  draft: MailSendDraft
  templateDisplayName?: string
  idempotencyKey: string
  senderProfileId?: number
  variables?: Record<string, unknown>
}): Promise<{ mode: 'remote' | 'mock' }> {
  const { draft, templateDisplayName, idempotencyKey, senderProfileId, variables } = input

  const numericTemplateId =
    draft.templateId && /^\d+$/.test(draft.templateId.trim())
      ? Number(draft.templateId.trim())
      : null

  if (shouldUseMailSendRemoteApi()) {
    if (numericTemplateId == null) {
      throw new Error('메일 발송에는 서버에 등록된 템플릿이 필요합니다.')
    }

    const programId = parseNotificationSendProgramId(draft.programId)
    if (programId == null) {
      throw new Error('대상 프로그램을 선택하세요.')
    }

    let resolvedSenderProfileId = senderProfileId
    if (resolvedSenderProfileId == null && draft.senderEmail.trim()) {
      const profiles = await getMailSenderProfiles()
      resolvedSenderProfileId = resolveMailSenderProfileId(profiles, draft.senderEmail)
    }

    const batchVariables = pickNonEmptySendVariables(variables)
    const body: CreateRequest = {
      batchName:
        (templateDisplayName || draft.subject).slice(0, 200).trim() || '메일 발송',
      templateId: numericTemplateId,
      programId,
      scheduledAt: draft.sendTiming === 'scheduled' ? draft.scheduledAt ?? undefined : undefined,
      recipients: buildMailSendRecipients(draft.recipients),
      senderProfileId: resolvedSenderProfileId,
      senderKey: draft.senderEmail.trim() || undefined,
      ...(batchVariables ? { variables: batchVariables } : {}),
    }

    await createSendBatchRemote(body, idempotencyKey)
    return { mode: 'remote' }
  }

  const rows = createMailSendHistoryRowsFromDraft(draft, templateDisplayName)
  prependMailSendHistoryMockRows(rows)
  return { mode: 'mock' }
}
