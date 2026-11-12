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
  unitCount?: number
  sessionDescription?: string
  createdAt?: string
  /** 목록 카드용 233×320 썸네일(QA-0495). 아직 변형이 없으면 `null` → `thumbnailUrl` */
  thumbnailUrlW233?: string | null
  /** 목록 카드용 2배(466×640) 썸네일(QA-0495). 아직 변형이 없으면 `null` → `thumbnailUrl` */
  thumbnailUrlW466?: string | null
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
