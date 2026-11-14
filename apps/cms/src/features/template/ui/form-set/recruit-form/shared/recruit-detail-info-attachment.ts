import { FILE_SELECT_MAX_FILE_BYTES } from '@/shared/ui/file-select-field-limits'

/** 모집 양식 상세 정보 — 썸네일·첨부 파일당 최대 용량 */
export const RECRUIT_DETAIL_FILE_MAX_BYTES = FILE_SELECT_MAX_FILE_BYTES

export const RECRUIT_DETAIL_FILE_SIZE_EXCEEDED_MESSAGE =
  '파일은 최대 20MB까지 업로드 가능합니다.'

/**
 * 안내 줄 머리 「-  」: 시안은 하이픈 뒤 공백 두 칸(2026-11-13 확인). HTML 공백 접힘을 피하려고 첫 칸은 NBSP.
 */

/** 모집 양식 상세 정보 — 썸네일 이미지 안내 */
export const RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES = [
  '-\u00A0 파일은 최대 20MB까지 JPG, PNG 형식만 등록 가능합니다.',
  '-\u00A0 첨부 파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

/** 모집 양식 상세 정보 — 첨부 파일 허용 형식 */
export const RECRUIT_DETAIL_ATTACHMENT_ACCEPT =
  '.jpg,.jpeg,.png,.xls,.xlsx,.pdf,.doc,.docx'

/** 모집 양식 상세 정보 — 첨부 파일 안내 */
export const RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES = [
  '-\u00A0 파일은 최대 20MB까지 JPG, PNG, Excel, PDF, Word 형식만 등록 가능합니다.',
  '-\u00A0 첨부 파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

/** 일반 프로그램(등록 위저드·상세 모집 정보) — 썸네일 안내 시안 문구 */
export const GENERAL_RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES = [
  '-\u00A0 파일은 JPG, PNG 형식만 등록 가능하며, 최대 20MB까지 첨부할 수 있습니다.',
  RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES[1],
]

/** 일반 프로그램(등록 위저드·상세 모집 정보) — 첨부 안내 시안 문구 (HWP 포함, 최대 10개·총 100MB) */
export const GENERAL_RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES = [
  '-\u00A0 파일은 JPG, PNG, HWP, Excel, PDF, Word 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.',
  RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES[1],
]

export const GENERAL_RECRUIT_DETAIL_ATTACHMENT_ACCEPT = `${RECRUIT_DETAIL_ATTACHMENT_ACCEPT},.hwp,.hwpx`
export const GENERAL_RECRUIT_DETAIL_ATTACHMENT_MAX_COUNT = 10
export const GENERAL_RECRUIT_DETAIL_ATTACHMENT_COUNT_EXCEEDED_MESSAGE =
  '첨부 파일은 최대 10개까지 등록할 수 있습니다.'
