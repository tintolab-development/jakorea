import { isValidElement, type ReactNode } from 'react'
import { PLATFORM_ALERT_COPY, type PlatformAlertCopy } from '@/shared/lib/platform-alert-copy'
import {
  isPlatformNetworkError,
  isPlatformRateLimitedError,
  resolvePlatformErrorAlert,
} from '@/shared/lib/platform-error-alert'

/**
 * 마이페이지 교육 화면 오류 팝업 — 시안 「오류 제한 팝업」(14491-2533).
 * 네트워크 → 네트워크 오류 안내, 429 → 처리 제한, 그 밖 → 처리 실패.
 *
 * 기존 화면별 `resolveXxxErrorMessage(error, fallback)`를 그대로 쓰되 fallback은 ''로 넘긴다.
 * - 서버가 보낸 메시지는 설명에 그대로 쓴다.
 * - 오류 코드별 업무 안내(예: 기한 지남)도 설명에 쓴다.
 * - FE가 만든 일반 실패 문구(「…에 실패했습니다」「…하지 못했습니다」)는 쓰지 않고 시안 「처리 실패」 설명을 쓴다.
 */
const FE_GENERIC_FAILURE_PATTERN = /(실패했습니다|실패했어요|하지 못했습니다|하지 못했어요|오류가 발생했습니다)/

type ResolveMessage = (error: unknown, fallback: string) => string | null | undefined

function readResponseMessage(error: unknown): string {
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data
  if (!data || typeof data !== 'object') return ''
  const record = data as { message?: unknown; error?: { message?: unknown } }
  const nested = record.error?.message
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  return typeof record.message === 'string' ? record.message.trim() : ''
}

export function resolveEducationErrorAlert(
  error: unknown,
  resolveMessage?: ResolveMessage,
): PlatformAlertCopy {
  return resolvePlatformErrorAlert(error, {
    serverMessage: target => {
      const responseMessage = readResponseMessage(target)
      const message = (resolveMessage ? resolveMessage(target, '') : responseMessage)?.trim() ?? ''
      if (!message) return ''
      if (message === responseMessage) return message
      return FE_GENERIC_FAILURE_PATTERN.test(message) ? '' : message
    },
  })
}

/** 교육 화면 팝업 상태 — 시안 오류 팝업 문구 또는 업무 안내(제목 「안내」) */
export type EducationAlert = {
  title: string
  description?: ReactNode
}

/** 시안에 따로 없는 업무 안내(기한·상태 변경 등) — 기존처럼 제목 「안내」 */
export function educationNoticeAlert(description: ReactNode): EducationAlert {
  return { title: '안내', description }
}

/** `Error.message`를 그대로 쓰는 화면용 (`resolveEducationErrorAlert`의 두 번째 인자) */
export function readErrorMessage(error: unknown, fallback = ''): string {
  return error instanceof Error && error.message.trim() ? error.message.trim() : fallback
}

/** `ReactNode` 문구와 시안 팝업 문구(EducationAlert)를 구분한다 */
export function isEducationAlert(value: unknown): value is EducationAlert {
  return (
    value != null &&
    typeof value === 'object' &&
    !isValidElement(value) &&
    typeof (value as { title?: unknown }).title === 'string'
  )
}

/**
 * 미리보기(강의보고서·정산 신청서 등) 불러오기 실패 — 시안 「미리보기 실패 시」(14504-51221).
 * 네트워크·처리 제한은 해당 공통 팝업을 쓴다.
 */
export function resolveEducationPreviewErrorAlert(error: unknown): PlatformAlertCopy {
  if (isPlatformNetworkError(error)) return PLATFORM_ALERT_COPY.networkError
  if (isPlatformRateLimitedError(error)) return PLATFORM_ALERT_COPY.rateLimited
  return PLATFORM_ALERT_COPY.previewFailed
}
