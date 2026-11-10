/**
 * 파일 다운로드 유틸리티
 */

import { saveAs } from 'file-saver'
import { recordFileDownload } from '@/entities/download-log/api/download-log-service'
import { guardAdminDownload } from '@/shared/lib/session-admin-role'
import type { DownloadAccessLogMeta } from '@/shared/lib/download-access-log-meta'

/** 파일명의 `/`(경로 구분자)를 `,`로 바꾼다. 예) `버그/이슈 관리` → `버그,이슈 관리` */
export function sanitizeDownloadFileName(filename: string): string {
  return filename.replace(/[/\\]/g, ',')
}

/**
 * 모든 다운로드 파일명 규칙. 이미 `[JA Korea]`로 시작하면 그대로 둔다(생성 파일).
 * 그 외(업로드 원본 등)는 `[JA Korea] {원본 이름}_YYMMDD.확장자` (YYMMDD = 내려받은 날짜, Asia/Seoul).
 * 예) `IMG_2235.PNG` → `[JA Korea] IMG_2235_261110.PNG`
 */
export function toRuleDownloadFileName(filename: string, date: Date = new Date()): string {
  const name = sanitizeDownloadFileName(filename.trim())
  if (name === '' || name.startsWith('[JA Korea]')) return name
  const dot = name.lastIndexOf('.')
  const hasExt = dot > 0 && /^[A-Za-z0-9]{1,10}$/.test(name.slice(dot + 1))
  const base = hasExt ? name.slice(0, dot) : name
  const ext = hasExt ? name.slice(dot) : ''
  return `[JA Korea] ${base}_${formatSeoulYymmdd(date)}${ext}`
}

type RuntimeAuthUser = {
  id?: string
  name?: string
}

export type DownloadBlobOptions = {
  /** true면 서버/stub 다운로드 이력 기록 생략 (인증서 download-logs 등 이미 기록한 경우) */
  skipAccessLog?: boolean
  /** client 이력에 함께 남길 파일 종류·포함 개인정보 */
  accessLog?: DownloadAccessLogMeta
}

function readRuntimeAuthUser(): RuntimeAuthUser | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  const raw = window.localStorage.getItem('auth_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as RuntimeAuthUser
  } catch {
    return null
  }
}

export async function recordDownloadAccessLog(
  filename: string,
  accessLog?: DownloadAccessLogMeta
): Promise<void> {
  const user = readRuntimeAuthUser()
  // ipAddress 생략 — 서버가 요청 IP를 기록 (가짜 IP 전송 시 검증 실패 가능)
  await recordFileDownload({
    fileName: sanitizeDownloadFileName(filename),
    userId: user?.id ?? 'unknown-user',
    userName: user?.name ?? '알 수 없음',
    ...(accessLog ? { accessLog } : {}),
  })
}

/**
 * Blob 파일 다운로드 — 이력 기록 성공 후 저장 (skipAccessLog 제외)
 */
export async function downloadBlob(
  blob: Blob,
  filename: string,
  options?: DownloadBlobOptions
): Promise<void> {
  if (!guardAdminDownload()) return
  // 저장 파일명과 이력 파일명을 같은 규칙 이름으로 맞춘다.
  filename = toRuleDownloadFileName(filename)
  if (!options?.skipAccessLog) {
    if (options?.accessLog) {
      await recordDownloadAccessLog(filename, options.accessLog)
    } else {
      await recordDownloadAccessLog(filename)
    }
  }
  saveAs(blob, filename)
}

/**
 * Excel 파일 다운로드
 */
export async function downloadExcel(
  buffer: ArrayBuffer,
  filename: string,
  options?: Pick<DownloadBlobOptions, 'accessLog'>
): Promise<void> {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  if (options?.accessLog) {
    await downloadBlob(blob, filename, { accessLog: options.accessLog })
    return
  }
  await downloadBlob(blob, filename)
}

/**
 * PDF 파일 다운로드
 */
export async function downloadPDF(buffer: ArrayBuffer, filename: string): Promise<void> {
  const blob = new Blob([buffer], {
    type: 'application/pdf',
  })
  await downloadBlob(blob, filename)
}

/**
 * `Content-Disposition`에서 저장 파일명을 읽는다.
 * RFC 5987 `filename*=UTF-8''…`를 우선하고, 없거나 디코딩에 실패하면 `filename`, 둘 다 없으면 fallback.
 */
export function fileNameFromContentDisposition(
  header: string | null | undefined,
  fallback: string
): string {
  return sanitizeDownloadFileName(parseContentDispositionFileName(header, fallback))
}

/**
 * 서버 헤더 파일명이 `[JA Korea]` 규칙 이름일 때만 쓰고, 아니면(영문 등) `fallback`을 쓴다.
 * 서버가 규칙을 반영하기 전·후 모두 저장 파일명이 규칙을 따르게 한다.
 */
export function ruleFileNameFromContentDisposition(
  header: string | null | undefined,
  fallback: string
): string {
  const fromHeader = fileNameFromContentDisposition(header, '')
  return fromHeader.startsWith('[JA Korea]') ? fromHeader : sanitizeDownloadFileName(fallback)
}

function parseContentDispositionFileName(
  header: string | null | undefined,
  fallback: string
): string {
  if (!header) return fallback
  const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header)?.[1]?.trim().replace(/^"|"$/g, '')
  if (star) {
    try {
      const decoded = decodeURIComponent(star).trim()
      if (decoded) return decoded
    } catch {
      /* ASCII filename으로 넘어간다 */
    }
  }
  const quoted = /filename\s*=\s*"([^"]+)"/i.exec(header)?.[1]?.trim()
  if (quoted) return quoted
  const plain = /filename\s*=\s*([^";]+)/i.exec(header)?.[1]?.trim()
  return plain || fallback
}

/** Asia/Seoul 달력일 YYMMDD */
function formatSeoulYymmdd(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const v = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${v.year}${v.month}${v.day}`
}

/**
 * 공통 파일명 규칙: `[JA Korea] 도메인명_파일 이름_YYMMDD.ext`
 * - xlsx: `[JA Korea] CMS 어드민_{prefix}_YYMMDD.xlsx`
 * - 그 외(pdf·zip 등): `[JA Korea] {prefix}_YYMMDD.ext`
 * - prefix에 이미 `[JA Korea]`가 있으면 접두어를 다시 붙이지 않는다. 빗금은 쉼표로 바꾼다.
 */
export function generateFilename(prefix: string, extension: string, date?: Date): string {
  const stamp = formatSeoulYymmdd(date || new Date())
  const name = sanitizeDownloadFileName(prefix.trim())
  if (name.startsWith('[JA Korea]')) return `${name}_${stamp}.${extension}`
  const domain = extension.toLowerCase() === 'xlsx' ? 'CMS 어드민_' : ''
  return `[JA Korea] ${domain}${name}_${stamp}.${extension}`
}
