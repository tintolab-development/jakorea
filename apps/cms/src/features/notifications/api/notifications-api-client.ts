import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPINotificationsSubset } from '@/shared/api/generated/notifications/notifications-api'
import type {
  ListNotificationTemplatesParams,
  NotificationTemplateListResponse,
} from '@/shared/api/generated/notifications/schemas'

const notificationsRemoteApi = getJAKoreaCMSBackendAPINotificationsSubset()

export async function fetchNotificationTemplatesRemote(
  params: Record<string, string>
): Promise<NotificationTemplateListResponse> {
  const query: ListNotificationTemplatesParams = { params }
  return unwrapApiBody(await notificationsRemoteApi.listNotificationTemplates(query))
}
