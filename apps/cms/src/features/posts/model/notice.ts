/**
 * CMS 공지 — FE view model (API adapter 출력)
 */

export interface NoticeAttachment {
  name: string
  fileUrl?: string
  fileObjectId?: number
  attachmentId?: number
  fileSize?: number
}

export interface Notice {
  id: string
  resourceId?: number
  title: string
  content: string
  category: string
  categoryId?: number
  createdAt: string
  updatedAt?: string
  isImportant: boolean
  viewCount: number
  hasAttachment: boolean
  attachments?: NoticeAttachment[]
  author: string
  status: 'published' | 'draft' | 'archived'
}
