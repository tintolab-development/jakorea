import type { CreateRequest, RecipientRequest } from '@/shared/api/generated/notifications/schemas'
import { MAIL_API_CHANNEL_TYPE } from '@/features/notifications/api/adapters/mail-channel'
import { mapMailRecipientCandidates } from '@/features/notifications/api/adapters/mail-send-adapters'
import {
  mapTemplateVariablesCatalog,
  pickNonEmptySendVariables,
  toTemplateVariablesRequestParams,
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
import { normalizeNotificationPlaceholderMarkup } from '@/features/notifications/model/shared/notification-placeholder-markup'
import {
  applyMailContextVariableSubstitutions,
  NOTIFICATION_MAIL_CONTEXT_PLACEHOLDER_KEYS,
  pickNotificationMailContextVariables,
} from '@/features/notifications/model/shared/mail-context-variables'
import { applyNotificationSendBodySnapshot } from '@/features/notifications/model/shared/send-body-snapshot'
import { parseNotificationSendProgramId } from '@/features/notifications/model/send-program-id'
import { resolveScheduledAtForCreateRequest } from '@/features/notifications/model/send-scheduled-at'
import type { MailSendDraft, MailSendRecipient } from '@/features/notifications/model/mail-send/types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export type MailSenderProfileOption = AlimtalkSenderProfileOption

function assertMailSendRemoteReady(): void {
  if (!isRealApiModuleEnabled('notifications')) {
    throw new Error(
      '알림 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 notifications를 추가해 주세요.'
    )
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('메일 발송은 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseMailSendRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

/**
 * @deprecated 서버 enrich 예약 키는 Create body에 넣지 않는다.
 * MEMBER는 actorId만, DIRECT는 recipientContact만 사용.
 */
export function buildMailRecipientVariables(
  _recipient: MailSendRecipient
): Record<string, string> | undefined {
  return undefined
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
    }
  })
}

export async function getMailSenderProfiles(): Promise<MailSenderProfileOption[]> {
  if (!shouldUseMailSendRemoteApi()) return []
  const dto = await fetchSenderProfilesRemote({
    channelType: MAIL_API_CHANNEL_TYPE,
    useYn: true,
  })
  return mapSenderProfileOptions(dto.items)
}

/** 발신 메일 주소로 EMAIL senderProfileId 매칭 (메일주소 = senderKey) */
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
      items: [],
      total: 0,
      page,
      size,
      totalPages: 1,
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
  const dto = await fetchTemplateVariablesRemote(toTemplateVariablesRequestParams(input))
  return mapTemplateVariablesCatalog(dto)
}

/**
 * 메일 발송 — `POST /api/admin/notification-send-batches`
 * - Hub scheduledDateTime 금지 → `scheduledAt`만 사용
 * - 발송 편집본은 titleTemplate/contentTemplate 스냅샷으로 전송 (등록 템플릿 PATCH 금지)
 * - 필수 변수 누락은 BE fail-closed
 * - variables 빈 문자열 패딩 금지 (BE 자동입력을 덮어씀)
 */
export async function submitMailSend(input: {
  draft: MailSendDraft
  templateDisplayName?: string
  templateCategoryId?: string | null
  templateBaseline?: { subject: string; bodyHtml: string }
  idempotencyKey: string
  senderProfileId?: number
  variables?: Record<string, unknown>
}): Promise<void> {
  const {
    draft,
    templateDisplayName,
    templateBaseline,
    idempotencyKey,
    senderProfileId,
    variables,
  } = input
  assertMailSendRemoteReady()

  const numericTemplateId =
    draft.templateId && /^\d+$/.test(draft.templateId.trim())
      ? Number(draft.templateId.trim())
      : null

  if (numericTemplateId == null) {
    throw new Error('메일 발송에는 서버에 등록된 템플릿이 필요합니다.')
  }

  const programId = parseNotificationSendProgramId(draft.programId)
  const isAllProgram = draft.programId?.trim().toLowerCase() === 'all'
  if (!isAllProgram && programId == null) {
    throw new Error('대상 프로그램을 선택하세요.')
  }

  // 문맥 키(동의 항목·만료일시)는 catalog SYSTEM → variables 거부. 본문에 로컬 치환.
  const contextValues =
    pickNotificationMailContextVariables(
      Object.fromEntries(
        NOTIFICATION_MAIL_CONTEXT_PLACEHOLDER_KEYS.map(key => [
          key,
          typeof variables?.[key] === 'string' ? String(variables[key]) : '',
        ])
      )
    ) ?? {}
  const substituted = applyMailContextVariableSubstitutions({
    subject: normalizeNotificationPlaceholderMarkup(draft.subject),
    bodyHtml: normalizeNotificationPlaceholderMarkup(draft.bodyHtml),
    values: contextValues,
  })
  const subject = substituted.subject
  const bodyHtml = substituted.bodyHtml

  let resolvedSenderProfileId = senderProfileId
  if (resolvedSenderProfileId == null && draft.senderEmail.trim()) {
    const profiles = await getMailSenderProfiles()
    resolvedSenderProfileId = resolveMailSenderProfileId(profiles, draft.senderEmail)
  }

  const recipients = buildMailSendRecipients(draft.recipients)
  const batchVariables = pickNonEmptySendVariables(
    Object.fromEntries(
      Object.entries(variables ?? {}).filter(
        ([key]) =>
          !(NOTIFICATION_MAIL_CONTEXT_PLACEHOLDER_KEYS as readonly string[]).includes(key)
      )
    )
  )
  const body: CreateRequest = {
    batchName:
      (templateDisplayName || subject).slice(0, 200).trim() || '메일 발송',
    templateId: numericTemplateId,
    scheduledAt: resolveScheduledAtForCreateRequest({
      sendTiming: draft.sendTiming,
      scheduledAt: draft.scheduledAt,
    }),
    recipients,
    senderProfileId: resolvedSenderProfileId,
    senderKey: draft.senderEmail.trim() || undefined,
  }
  if (programId != null) body.programId = programId
  if (batchVariables) body.variables = batchVariables

  applyNotificationSendBodySnapshot(body, {
    channel: 'EMAIL',
    title: subject,
    content: bodyHtml,
    baseline: templateBaseline
      ? { title: templateBaseline.subject, content: templateBaseline.bodyHtml }
      : null,
  })

  if (Object.keys(contextValues).length > 0) {
    if (subject.trim()) body.titleTemplate = subject.slice(0, 1000)
    if (bodyHtml.trim()) body.contentTemplate = bodyHtml
  }

  await createSendBatchRemote(body, idempotencyKey)
}
