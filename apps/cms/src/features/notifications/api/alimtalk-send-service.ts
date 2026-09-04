import {
  buildCreateSendBatchRequest,
  mapRecipientCandidates,
  mapTemplateVariablesCatalog,
  type AlimtalkTemplateVariable,
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
import { ALIMTALK_SEND_RECIPIENT_MOCK } from '@/features/notifications/model/alimtalk-send/mock'
import type { AlimtalkSendRecipient } from '@/features/notifications/model/alimtalk-send/types'
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
  if (!shouldUseAlimtalkSendRemoteApi()) {
    return [{ profileId: 1, senderKey: 'mock-sender', displayName: 'JA Korea' }]
  }
  const dto = await fetchSenderProfilesRemote({
    channelType: ALIMTALK_API_CHANNEL_TYPE,
    useYn: true,
  })
  return mapSenderProfileOptions(dto.items)
}

export async function getAlimtalkRecipientCandidates(input: {
  programId?: number
  keyword?: string
  participantType?: string
  page?: number
  size?: number
}): Promise<AlimtalkSendRecipient[]> {
  if (!shouldUseAlimtalkSendRemoteApi()) {
    return ALIMTALK_SEND_RECIPIENT_MOCK
  }
  const dto = await fetchRecipientCandidatesRemote({
    channelType: ALIMTALK_API_CHANNEL_TYPE,
    programId: input.programId,
    keyword: input.keyword,
    participantType: input.participantType,
    page: input.page ?? 0,
    size: input.size ?? 100,
  })
  return mapRecipientCandidates(dto.items)
}

export async function getAlimtalkTemplateVariables(input?: {
  category?: string
  keyword?: string
}): Promise<AlimtalkTemplateVariable[]> {
  if (!shouldUseAlimtalkSendRemoteApi()) return []
  const dto = await fetchTemplateVariablesRemote({
    category: input?.category,
    keyword: input?.keyword,
  })
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

  const programIdRaw = input.programId
  const programId =
    programIdRaw && programIdRaw !== 'all' && Number.isFinite(Number(programIdRaw))
      ? Number(programIdRaw)
      : undefined

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
