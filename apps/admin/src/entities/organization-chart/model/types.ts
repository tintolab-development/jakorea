/**
 * 조직도 관리 도메인 타입
 */

export type OrganizationChartInfo = {
  mainTitle: string
  imageUrl: string
  imageFileName?: string
  updatedAt: string
}

export type OrganizationChartSaveInput = {
  mainTitle: string
  imageUrl: string
  imageFileName?: string
}
