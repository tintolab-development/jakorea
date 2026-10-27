import { axiosInstance } from '@/shared/instance/axios-instance'
import type { PublicApplicationNotification } from '../model/types'

export const PUBLIC_APPLICATION_NOTIFICATIONS_PATH = '/api/admin/notifications/public-applications'

export async function listPublicApplicationNotificationsService(): Promise<
  PublicApplicationNotification[]
> {
  const response = await axiosInstance.get<PublicApplicationNotification[]>(
    PUBLIC_APPLICATION_NOTIFICATIONS_PATH,
    { params: { size: 50 } }
  )
  return response.data
}

export async function retryPublicApplicationNotificationService(
  id: number
): Promise<PublicApplicationNotification> {
  const response = await axiosInstance.post<PublicApplicationNotification>(
    `${PUBLIC_APPLICATION_NOTIFICATIONS_PATH}/${id}/retry`
  )
  return response.data
}
