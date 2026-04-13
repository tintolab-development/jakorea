/**
 * 수료증 미리보기 — 우측 필드명 ↔ 캔버스 영역 매핑 및 딤 규칙 (순수 로직)
 */

export type CertificateCanvasRegion =
  | 'canvas'
  | 'logo'
  | 'education'
  | 'title'
  | 'contentFrame'
  | 'confirm'
  | 'chairmanName'
  | 'stamp'
  | 'footerAddress'
  | 'footerPhone'
  | 'footerFax'
  | 'footerWebsite'

/** 우측 커스텀 필드(name) → 캔버스 하이라이트 영역 */
export const TEMPLATE_FIELD_TO_CANVAS_REGION: Record<string, CertificateCanvasRegion> = {
  titleName: 'title',
  bodyContent: 'confirm',
  chairmanName: 'chairmanName',
  chairmanSeal: 'stamp',
  orgAddress: 'footerAddress',
  orgPhone: 'footerPhone',
  orgFax: 'footerFax',
  orgWebsite: 'footerWebsite',
  orgLogo: 'logo',
  orgLogo02: 'education',
  certificateBackground: 'canvas',
  participantInfo: 'contentFrame',
}

/** 캔버스 영역 클릭 시 연결할 필드 name(한 영역에 복수 필드가 매핑되면 대표 1개) */
export const CANVAS_REGION_TO_FIELD_NAME: Record<CertificateCanvasRegion, string> = {
  canvas: 'certificateBackground',
  logo: 'orgLogo',
  education: 'orgLogo02',
  title: 'titleName',
  contentFrame: 'participantInfo',
  confirm: 'bodyContent',
  chairmanName: 'chairmanName',
  stamp: 'chairmanSeal',
  footerAddress: 'orgAddress',
  footerPhone: 'orgPhone',
  footerFax: 'orgFax',
  footerWebsite: 'orgWebsite',
}

const FOOTER_FIELD_REGIONS = [
  'footerAddress',
  'footerPhone',
  'footerFax',
  'footerWebsite',
] as const satisfies readonly CertificateCanvasRegion[]

export function resolveCanvasRegion(activeFieldName: string | null | undefined): CertificateCanvasRegion | null {
  if (activeFieldName == null || activeFieldName === '') return null
  return TEMPLATE_FIELD_TO_CANVAS_REGION[activeFieldName] ?? null
}

/** 우측 필드 선택 시 — 해당 블록이 아니면 미리보기에서 딤(투명도) */
export function shouldDim(
  active: CertificateCanvasRegion | null,
  block: CertificateCanvasRegion | 'decor'
): boolean {
  if (active == null) return false
  if (block === 'decor') return true
  return active !== block
}

/** 푸터 하위 — 주소/전화/팩스/웹 각각 또는 고정 브랜드 문구 딤 */
export function shouldDimFooterPart(
  active: CertificateCanvasRegion | null,
  part: 'brand' | (typeof FOOTER_FIELD_REGIONS)[number]
): boolean {
  if (active == null) return false
  if (part === 'brand') return true
  if (!FOOTER_FIELD_REGIONS.includes(active as (typeof FOOTER_FIELD_REGIONS)[number])) {
    return true
  }
  return active !== part
}
