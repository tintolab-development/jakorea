/** GET /api/portal/public/program-results — 로그인 없이 호출 */

export type ProgramResultCategory = {
  categoryId: number
  categoryName: string
}

export type ProgramResultListItem = {
  resultId: number
  categoryId: number
  categoryName: string
  title: string
  announcedAt: string
  viewCount: number
}

export type ProgramResultAttachment = {
  originalFilename: string
  fileSize?: number
  downloadEndpoint: string
}

export type ProgramResultNeighbor = {
  resultId: number
  title: string
} | null

export type ProgramResultDetail = ProgramResultListItem & {
  content: string
  attachments: ProgramResultAttachment[]
  previous: ProgramResultNeighbor
  next: ProgramResultNeighbor
}

export type ProgramResultListPage = {
  items: ProgramResultListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  categories: ProgramResultCategory[]
}

export type ProgramResultSort = 'LATEST' | 'TITLE'

export type ProgramResultListQuery = {
  page: number
  size: number
  categoryId?: number
  keyword?: string
  sort?: ProgramResultSort
}
