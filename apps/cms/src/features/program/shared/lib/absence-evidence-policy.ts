/**
 * CMS 출결 정정 — 결석(사유 불참) 증빙 첨부 정책
 *
 * 근거: 프론트 계약 「CMS 출결 정정 결석 증빙 첨부 한도」(2026-11-16), Figma 4082:109940.
 * 서버 `AdminAbsenceEvidenceService`와 같은 한도 — 최대 10개, 파일당 20MiB, 이번 첨부 합계 100MiB,
 * PDF/JPG/JPEG/PNG(확장자·MIME 쌍 일치), 0바이트 거절, 사유 2000자.
 *
 * 현재 적용 화면: UJAT 참여 봉사자 상세 출결 정정 팝업(`ProgramAttendanceCorrectionModal variant="ujat"`).
 */

import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'

const MIB = 1024 * 1024

export const ABSENCE_EVIDENCE_MAX_FILES = 10
export const ABSENCE_EVIDENCE_MAX_FILE_BYTES = 20 * MIB
export const ABSENCE_EVIDENCE_MAX_TOTAL_BYTES = 100 * MIB
export const ABSENCE_EVIDENCE_REASON_MAX_LENGTH = 2000

export const ABSENCE_EVIDENCE_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

/** 시안 4082:109940 — 문서 고정 문장 앞에 시안의 「- 」 */
export const ABSENCE_EVIDENCE_GUIDE_LINE =
  '- 파일은 PDF, JPG, PNG 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.'

/** 서버 error.message와 같은 문장(문서 5절). 파일당 용량·0바이트는 문서에 서버 문구가 없어 기존 CMS 문구. */
export const ABSENCE_EVIDENCE_MESSAGES = {
  tooMany: '결석 증빙 파일은 10개까지 첨부할 수 있습니다.',
  totalSizeExceeded: '결석 증빙 파일은 합계 100MB까지 첨부할 수 있습니다.',
  fileTypeNotAllowed: '결석 증빙 파일은 PDF, JPG, PNG 형식만 첨부할 수 있습니다.',
  fileTooLarge: '파일당 최대 20MB까지 업로드 가능합니다.',
  emptyFile: '업로드할 파일이 비어 있습니다.',
} as const

/** 저장 실패 시 서버 error.message를 그대로 팝업 인라인 오류로 보여 줄 코드(문서 5절 표) */
export const ABSENCE_EVIDENCE_SAVE_ERROR_CODES: ReadonlySet<string> = new Set([
  'ABSENCE_EVIDENCE_TOO_MANY',
  'ABSENCE_EVIDENCE_TOTAL_SIZE_EXCEEDED',
  'ABSENCE_EVIDENCE_FILE_TYPE_NOT_ALLOWED',
  'ABSENCE_EVIDENCE_NOT_ALLOWED',
  'ABSENCE_EVIDENCE_FILE_MISMATCH',
  'ABSENCE_EVIDENCE_FILE_NOT_AVAILABLE',
])

const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

type FileLike = { name: string; type: string; size: number }

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? '' : name.slice(dot + 1).trim().toLowerCase()
}

/** 확장자가 pdf/jpg/jpeg/png이고 MIME이 그 확장자의 MIME과 같을 때만 true (대소문자 무시) */
export function isAllowedAbsenceEvidenceFileType(file: Pick<FileLike, 'name' | 'type'>): boolean {
  const expected = MIME_BY_EXTENSION[extensionOf(file.name)]
  if (!expected) return false
  return file.type.trim().toLowerCase() === expected
}

/**
 * 선택·드롭·붙여넣기 공통 검증. 파일마다 형식 → 0바이트 → 파일당 용량 → 개수 → 합계 순으로 보고,
 * 통과한 파일만 받는다. 합계는 이번 정정에 첨부한 파일만 본다(이전 저장 증빙 미포함).
 */
export function screenAbsenceEvidenceFiles<T extends FileLike>(
  current: ReadonlyArray<Pick<FileLike, 'size'>>,
  incoming: ReadonlyArray<T>
): { accepted: T[]; rejectionMessages: string[] } {
  const accepted: T[] = []
  const messages = new Set<string>()
  let count = current.length
  let totalBytes = current.reduce((sum, file) => sum + file.size, 0)

  for (const file of incoming) {
    if (!isAllowedAbsenceEvidenceFileType(file)) {
      messages.add(ABSENCE_EVIDENCE_MESSAGES.fileTypeNotAllowed)
      continue
    }
    if (file.size <= 0) {
      messages.add(ABSENCE_EVIDENCE_MESSAGES.emptyFile)
      continue
    }
    if (file.size > ABSENCE_EVIDENCE_MAX_FILE_BYTES) {
      messages.add(ABSENCE_EVIDENCE_MESSAGES.fileTooLarge)
      continue
    }
    if (count >= ABSENCE_EVIDENCE_MAX_FILES) {
      messages.add(ABSENCE_EVIDENCE_MESSAGES.tooMany)
      continue
    }
    if (totalBytes + file.size > ABSENCE_EVIDENCE_MAX_TOTAL_BYTES) {
      messages.add(ABSENCE_EVIDENCE_MESSAGES.totalSizeExceeded)
      continue
    }
    accepted.push(file)
    count += 1
    totalBytes += file.size
  }

  return { accepted, rejectionMessages: [...messages] }
}

function readServerErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return undefined
  const envelope = data as { message?: unknown; error?: { message?: unknown } }
  const nested = envelope.error?.message
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  return typeof envelope.message === 'string' && envelope.message.trim()
    ? envelope.message.trim()
    : undefined
}

/** 문서 표의 코드면 서버 error.message 그대로, 아니면 null(기존 공통 오류 처리로) */
export function resolveAbsenceEvidenceSaveErrorMessage(error: unknown): string | null {
  const code = getApiErrorCode(error)
  if (!code || !ABSENCE_EVIDENCE_SAVE_ERROR_CODES.has(code)) return null
  return readServerErrorMessage(error) ?? null
}

export function isAbsenceEvidenceSaveError(error: unknown): boolean {
  return resolveAbsenceEvidenceSaveErrorMessage(error) != null
}
