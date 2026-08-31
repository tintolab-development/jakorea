export type EducationInProgressNotice = {
  id: string
  title: string
  content: string
  authorName: string
  publishedAt: string
  read: boolean
  viewCount: number
  commentCount: number
  reactionCount: number
}

export type EducationInProgressFile = {
  id: string
  fileName: string
  uploadedAt: string
  fileSizeBytes: number
  postId?: string
}
