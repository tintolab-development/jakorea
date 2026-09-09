import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPINotificationsSubset } from '@/shared/api/generated/notifications/notifications-api'
import customInstance from '@/shared/api/orval-mutator'
import type {
  CategoryCreateRequest,
  CategoryMoveRequest,
  CategoryMutationResponse,
  CategoryTreeParams,
  CategoryTreeResponse,
  CategoryUpdateRequest,
  CreateRequest,
  CreateResponse,
  EmailAttachmentBindRequest,
  EmailAttachmentMutationResponse,
  ListSenderProfilesParams,
  NotificationDeliveryDetailResponse,
  NotificationDeliveryListResponse,
  NotificationTemplateListResponse,
  NotificationTemplatePreviewResponse,
  NotificationTemplateResponse,
  NotificationTemplateUpsertRequest,
  PageResponseRecipientCandidateResponse,
  RecipientCandidatesParams,
  SenderProfileListResponse,
  SyncResultResponse,
  SyncSenderProfilesParams,
  SyncTemplatesParams,
  TemplateMoveRequest,
  TemplateMoveResponse,
  TemplateDeleteResponse,
  TemplateVariablesParams,
  CatalogResponse,
  ArchiveNotificationTemplateParams,
  NotificationTemplateMutationResponse,
} from '@/shared/api/generated/notifications/schemas'

const MUTATION_OPTIONS = { skipGlobalErrorAlert: true } as const

const notificationsRemoteApi = getJAKoreaCMSBackendAPINotificationsSubset()

/**
 * Orval `ListNotificationTemplatesParams`는 `{ params: Record }` 래퍼라
 * axios에 그대로 넘기면 `?params[channelType]=…` 로 나가 channelType 필터가 무시된다.
 * → flat query (`?channelType=SMS`)로 호출한다.
 */
export async function fetchNotificationTemplatesRemote(
  params: Record<string, string>
): Promise<NotificationTemplateListResponse> {
  return unwrapApiBody(
    await customInstance<unknown>({
      url: '/api/admin/notification-templates',
      method: 'GET',
      params,
    })
  )
}

export async function fetchNotificationTemplateRemote(
  templateId: number
): Promise<NotificationTemplateResponse> {
  return unwrapApiBody(await notificationsRemoteApi.getTemplate(templateId))
}

export async function fetchNotificationTemplatePreviewRemote(
  templateId: number
): Promise<NotificationTemplatePreviewResponse> {
  return unwrapApiBody(await notificationsRemoteApi.previewTemplate(templateId))
}

export async function fetchCategoryTreeRemote(
  params: CategoryTreeParams
): Promise<CategoryTreeResponse> {
  return unwrapApiBody(await notificationsRemoteApi.categoryTree(params))
}

export async function createCategoryRemote(
  body: CategoryCreateRequest
): Promise<CategoryMutationResponse> {
  return unwrapApiBody(await notificationsRemoteApi.createCategory(body, MUTATION_OPTIONS))
}

export async function updateCategoryRemote(
  categoryId: number,
  body: CategoryUpdateRequest
): Promise<CategoryMutationResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.updateCategory(categoryId, body, MUTATION_OPTIONS)
  )
}

export async function deleteCategoryRemote(categoryId: number): Promise<CategoryMutationResponse> {
  return unwrapApiBody(await notificationsRemoteApi.deleteCategory(categoryId, MUTATION_OPTIONS))
}

export async function moveCategoryRemote(
  body: { categoryId: number; parentId?: number | null }
): Promise<CategoryMutationResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.moveCategory(body as CategoryMoveRequest, MUTATION_OPTIONS)
  )
}

export async function moveTemplateRemote(
  templateId: number,
  body: { categoryId?: number | null }
): Promise<TemplateMoveResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.moveTemplate(
      templateId,
      body as TemplateMoveRequest,
      MUTATION_OPTIONS
    )
  )
}

/** NHN Hub DELETE 후 CMS archive. 성공 시 data.tree 사용. bulk-delete 경로는 쓰지 않음. */
export async function deleteNotificationTemplateRemote(
  templateId: number,
  params?: ArchiveNotificationTemplateParams
): Promise<TemplateDeleteResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.archiveNotificationTemplate(templateId, params, MUTATION_OPTIONS)
  )
}

export async function createNotificationTemplateRemote(
  body: NotificationTemplateUpsertRequest
): Promise<NotificationTemplateMutationResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.createNotificationTemplate(body, MUTATION_OPTIONS)
  )
}

export async function updateNotificationTemplateRemote(
  templateId: number,
  body: NotificationTemplateUpsertRequest
): Promise<NotificationTemplateMutationResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.updateNotificationTemplate(templateId, body, MUTATION_OPTIONS)
  )
}

export async function bindEmailAttachmentRemote(
  templateId: number,
  body: EmailAttachmentBindRequest
): Promise<EmailAttachmentMutationResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.bindEmailAttachment(templateId, body, MUTATION_OPTIONS)
  )
}

export async function unbindEmailAttachmentRemote(
  templateId: number,
  attachmentId: number
): Promise<EmailAttachmentMutationResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.unbindEmailAttachment(templateId, attachmentId, MUTATION_OPTIONS)
  )
}

/**
 * Body 없음 — NHN live pull / local approval mark (FE 일반 화면은 templates[] 미전송).
 * channelType을 넘기면 upsertedCount가 해당 채널 템플릿만 집계된다(타 채널 합산 아님).
 */
export async function syncNotificationTemplatesRemote(
  params?: SyncTemplatesParams
): Promise<SyncResultResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.syncTemplates(undefined, params, MUTATION_OPTIONS)
  )
}

export async function syncSenderProfilesRemote(
  params?: SyncSenderProfilesParams
): Promise<SyncResultResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.syncSenderProfiles(params, { skipGlobalErrorAlert: true })
  )
}

export async function fetchSenderProfilesRemote(
  params: ListSenderProfilesParams
): Promise<SenderProfileListResponse> {
  return unwrapApiBody(await notificationsRemoteApi.listSenderProfiles(params))
}

export async function fetchRecipientCandidatesRemote(
  params: RecipientCandidatesParams
): Promise<PageResponseRecipientCandidateResponse> {
  return unwrapApiBody(await notificationsRemoteApi.recipientCandidates(params))
}

export async function fetchTemplateVariablesRemote(
  params?: TemplateVariablesParams
): Promise<CatalogResponse> {
  return unwrapApiBody(await notificationsRemoteApi.templateVariables(params))
}

export async function createSendBatchRemote(
  body: CreateRequest,
  idempotencyKey: string
): Promise<CreateResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.create6(body, {
      headers: { 'Idempotency-Key': idempotencyKey },
      skipGlobalErrorAlert: true,
    })
  )
}

export async function fetchNotificationDeliveriesRemote(
  params: Record<string, string>
): Promise<NotificationDeliveryListResponse> {
  // ListNotificationDeliveriesParams도 `{ params }` 래퍼 — flat query로 호출
  return unwrapApiBody(
    await customInstance<unknown>({
      url: '/api/admin/notification-deliveries',
      method: 'GET',
      params,
    })
  )
}

export async function fetchNotificationDeliveryRemote(
  deliveryId: number
): Promise<NotificationDeliveryDetailResponse> {
  return unwrapApiBody(await notificationsRemoteApi.getNotificationDelivery(deliveryId))
}
