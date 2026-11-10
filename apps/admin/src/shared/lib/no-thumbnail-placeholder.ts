/**
 * 「썸네일 없음」 표식 이미지 — 임시 우회 (QA 2026-11-10)
 *
 * 보고서·임팩트 스토리 썸네일을 선택 항목으로 바꿨지만 서버는 아직 thumbnailAssetId 필수다.
 * 썸네일 없이 저장하면 이 표식 이미지를 대신 올려 서버 검증을 통과시키고,
 * 어드민 응답 변환에서는 원본 파일명(표식)을 보고 썸네일 없음으로 되돌린다.
 *
 * - 보고서: 1×1 투명 PNG — 사용자 홈페이지 보고서 카드가 1×1 이미지를 표지 없음으로 그린다.
 * - 임팩트 스토리: 사용자 홈페이지 기본 카드 이미지와 같은 파일 — 썸네일 없을 때와 화면이 같다.
 *
 * 백엔드가 thumbnailAssetId 를 nullable 로 바꾸면 이 파일과 사용처를 지우고,
 * DB 에서 original_name = NO_THUMBNAIL_FILE_NAME 인 썸네일을 NULL 로 정리한다.
 */
import impactStoryCardDefaultUrl from '@/assets/images/no-thumbnail/impact-story-card-default.png'

export const NO_THUMBNAIL_FILE_NAME = '__no-thumbnail__.png'

/** 1×1 완전 투명 RGBA PNG (68 bytes) */
const TRANSPARENT_1X1_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII='

export function isNoThumbnailPlaceholder(originalName?: string | null): boolean {
  return originalName === NO_THUMBNAIL_FILE_NAME
}

/** 보고서용 표식 — 1×1 투명 PNG */
export function createReportNoThumbnailFile(): File {
  const bytes = Uint8Array.from(atob(TRANSPARENT_1X1_PNG_BASE64), char => char.charCodeAt(0))
  return new File([bytes], NO_THUMBNAIL_FILE_NAME, { type: 'image/png' })
}

/** 임팩트 스토리용 표식 — 사용자 홈페이지 기본 카드 이미지 */
export async function createImpactStoryNoThumbnailFile(): Promise<File> {
  const response = await fetch(impactStoryCardDefaultUrl)
  const blob = await response.blob()
  return new File([blob], NO_THUMBNAIL_FILE_NAME, { type: 'image/png' })
}
