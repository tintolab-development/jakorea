import type {
  Notice,
  NoticeCreateInput,
  NoticeListFilter,
  NoticeUpdateInput,
} from '@/entities/notices/model/types'
import { shouldUseNoticesRemoteApi } from './capabilities'
import {
  createNotice as createLocal,
  getNoticeById,
  readNotices,
  removeNotices as removeLocal,
  setNoticePublic as setPublicLocal,
  updateNotice as updateLocal,
} from './store'

export async function listNoticesService(filter?: NoticeListFilter): Promise<Notice[]> {
  if (shouldUseNoticesRemoteApi()) {
    throw new Error('Notices remote API is not implemented yet')
  }
  return readNotices(filter)
}

export async function getNoticeService(id: string): Promise<Notice | null> {
  if (shouldUseNoticesRemoteApi()) {
    throw new Error('Notices remote API is not implemented yet')
  }
  return getNoticeById(id)
}

export async function createNoticeService(input: NoticeCreateInput): Promise<Notice> {
  if (shouldUseNoticesRemoteApi()) {
    throw new Error('Notices remote API is not implemented yet')
  }
  return createLocal(input)
}

export async function updateNoticeService(input: NoticeUpdateInput): Promise<Notice> {
  if (shouldUseNoticesRemoteApi()) {
    throw new Error('Notices remote API is not implemented yet')
  }
  return updateLocal(input)
}

export async function removeNoticesService(ids: string[]): Promise<void> {
  if (shouldUseNoticesRemoteApi()) {
    throw new Error('Notices remote API is not implemented yet')
  }
  removeLocal(ids)
}

export async function setNoticePublicService(
  id: string,
  isPublic: boolean
): Promise<Notice> {
  if (shouldUseNoticesRemoteApi()) {
    throw new Error('Notices remote API is not implemented yet')
  }
  return setPublicLocal(id, isPublic)
}
