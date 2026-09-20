export type PublicTextbookBusinessField = {
  id?: number
  fieldCode?: string
  displayName?: string
  description?: string
  notice?: string
  displayOrder?: number
}

export type PublicTextbookTarget = {
  id?: number
  targetCode?: string
  targetName?: string
  colorHex?: string
  displayOrder?: number
}

export type PublicTextbookListItem = {
  id?: number
  thumbnailUrl?: string
  businessField?: PublicTextbookBusinessField
  targets?: PublicTextbookTarget[]
  educationEffect?: string
  textbookName?: string
  description?: string
  createdAt?: string
}

export type PublicTextbookListPage = {
  items?: PublicTextbookListItem[]
  totalCount?: number
  page?: number
  size?: number
  totalPages?: number
}

export type PublicTextbookDetail = PublicTextbookListItem & {
  unitCount?: number
  sessionDescription?: string
  unitIntroHtml?: string
}
