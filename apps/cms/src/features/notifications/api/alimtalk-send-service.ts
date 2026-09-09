import {
  buildCreateSendBatchRequest,
  mapRecipientCandidates,
  mapTemplateVariablesCatalog,
  toTemplateVariablesRequestParams,
  type AlimtalkTemplateVariable,
  type NotificationTemplateVariablesQuery,
} from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import {
  mapSenderProfileOptions,
  type AlimtalkSenderProfileOption,
} from '@/features/notifications/api/adapters/alimtalk-sender-adapters'
import { ALIMTALK_API_CHANNEL_TYPE } from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import {
  createSendBatchRemote,
  fetchRecipientCandidatesRemote,
  fetchSenderProfilesRemote,
  fetchTemplateVariablesRemote,
} from '@/features/notifications/api/notifications-api-client'
import type { AlimtalkSendRecipient } from '@/features/notifications/model/alimtalk-send/types'
import { parseNotificationSendProgramId } from '@/features/notifications/model/send-program-id'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function assertAlimtalkSendRemoteReady(): void {
  if (!isRealApiModuleEnabled('notifications')) {
    throw new Error(
      '알림 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 notifications를 추가해 주세요.'
    )
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('알림톡 발송은 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseAlimtalkSendRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

export async function getAlimtalkSenderProfiles(): Promise<AlimtalkSenderProfileOption[]> {
  if (!shouldUseAlimtalkSendRemoteApi()) return []
  const dto = await fetchSenderProfilesRemote({
    channelType: ALIMTALK_API_CHANNEL_TYPE,
    useYn: true,
  })
  return mapSenderProfileOptions(dto.items)
}

export async function getAlimtalkRecipientCandidates(input: {
  programId: number
  keyword?: string
  participantType?: string
  memberType?: string
  page?: number
  size?: number
}): Promise<{
  items: AlimtalkSendRecipient[]
  total: number
  page: number
  size: number
  totalPages: number
}> {
  const size = input.size ?? 50
  const page = input.page ?? 0
  if (!shouldUseAlimtalkSendRemoteApi()) {
    return {
      items: [],
      total: 0,
      page,
      size,
      totalPages: 1,
    }
  }
  const dto = await fetchRecipientCandidatesRemote({
    channelType: ALIMTALK_API_CHANNEL_TYPE,
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
    items: mapRecipientCandidates(dto.items),
    total,
    page: dto.page ?? page,
    size: resolvedSize,
    totalPages: dto.totalPages ?? Math.max(Math.ceil(total / (resolvedSize || 50)), 1),
  }
}

export async function getAlimtalkTemplateVariables(
  input: NotificationTemplateVariablesQuery = {}
): Promise<AlimtalkTemplateVariable[]> {
  if (!shouldUseAlimtalkSendRemoteApi()) return []
  const dto = await fetchTemplateVariablesRemote(toTemplateVariablesRequestParams(input))
  return mapTemplateVariablesCatalog(dto)
}

export async function createAlimtalkSendBatch(input: {
  batchName: string
  templateId: string
  programId?: string
  scheduledAt?: string
  senderKey?: string
  senderProfileId?: number
  recipients: AlimtalkSendRecipient[]
  variables?: Record<string, unknown>
  idempotencyKey: string
}): Promise<void> {
  assertAlimtalkSendRemoteReady()
  const templateId = Number(input.templateId)
  if (!Number.isFinite(templateId)) throw new Error('템플릿 ID가 올바르지 않습니다.')

  const programId = parseNotificationSendProgramId(input.programId)
  if (programId == null) {
    throw new Error('대상 프로그램을 선택하세요.')
  }

  const body = buildCreateSendBatchRequest({
    batchName: input.batchName,
    templateId,
    programId,
    scheduledAt: input.scheduledAt,
    senderKey: input.senderKey,
    senderProfileId: input.senderProfileId,
    recipients: input.recipients,
    variables: input.variables,
  })

  await createSendBatchRemote(body, input.idempotencyKey)
}
