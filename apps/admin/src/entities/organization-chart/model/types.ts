/**
 * 조직도 관리 도메인 타입
 */

export type OrganizationChartInfo = {
  mainTitle: string
  imageUrl: string
  imageFileName?: string
  /** Homepage asset id (remote). mock에서는 없을 수 있음 */
  imageAssetId?: number
  updatedAt: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
}

export type OrganizationChartSaveInput = {
  mainTitle: string
  imageUrl: string
  imageFileName?: string
  /** remote: 기존 asset 유지 */
  imageAssetId?: number
  /** remote: 새 이미지 File (submit 시 upload). mock은 data URL */
  imageFile?: File | null
}
