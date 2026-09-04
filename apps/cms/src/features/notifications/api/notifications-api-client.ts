import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPINotificationsSubset } from '@/shared/api/generated/notifications/notifications-api'
import type {
  CategoryCreateRequest,
  CategoryMoveRequest,
  CategoryMutationResponse,
  CategoryTreeParams,
  CategoryTreeResponse,
  CategoryUpdateRequest,
  CreateRequest,
  CreateResponse,
  ListNotificationDeliveriesParams,
  ListNotificationTemplatesParams,
  ListSenderProfilesParams,
  NotificationDeliveryDetailResponse,
  NotificationDeliveryListResponse,
  NotificationTemplateListResponse,
  NotificationTemplatePreviewResponse,
  NotificationTemplateResponse,
  PageResponseRecipientCandidateResponse,
  RecipientCandidatesParams,
  SenderProfileListResponse,
  SyncResultResponse,
  SyncSenderProfilesParams,
  TemplateMoveRequest,
  TemplateMoveResponse,
  TemplateVariablesParams,
  CatalogResponse,
  ArchiveNotificationTemplateParams,
  NotificationTemplateMutationResponse,
} from '@/shared/api/generated/notifications/schemas'

const MUTATION_OPTIONS = { skipGlobalErrorAlert: true } as const

const notificationsRemoteApi = getJAKoreaCMSBackendAPINotificationsSubset()

export async function fetchNotificationTemplatesRemote(
  params: Record<string, string>
): Promise<NotificationTemplateListResponse> {
  const query: ListNotificationTemplatesParams = { params }
  return unwrapApiBody(await notificationsRemoteApi.listNotificationTemplates(query))
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
): Promise<NotificationTemplateMutationResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.archiveNotificationTemplate(templateId, params, MUTATION_OPTIONS)
  )
}

/** Body 없음 — NHN live pull / local approval mark (FE 일반 화면은 templates[] 미전송) */
export async function syncNotificationTemplatesRemote(): Promise<SyncResultResponse> {
  return unwrapApiBody(
    await notificationsRemoteApi.syncTemplates(undefined, { skipGlobalErrorAlert: true })
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
  const query: ListNotificationDeliveriesParams = { params }
  return unwrapApiBody(await notificationsRemoteApi.listNotificationDeliveries(query))
}

export async function fetchNotificationDeliveryRemote(
  deliveryId: number
): Promise<NotificationDeliveryDetailResponse> {
  return unwrapApiBody(await notificationsRemoteApi.getNotificationDelivery(deliveryId))
}
