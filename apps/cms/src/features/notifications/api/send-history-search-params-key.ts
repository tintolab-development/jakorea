import {
  applySendHistoryFiltersToSearchParams,
  readSendHistoryFiltersFromParams,
} from '@/features/notifications/model/alimtalk-send-history/filter-url'
import {
  applyMailSendHistoryFiltersToSearchParams,
  readMailSendHistoryFiltersFromParams,
} from '@/features/notifications/model/mail-send-history/filter-url'
import {
  applySmsSendHistoryFiltersToSearchParams,
  readSmsSendHistoryFiltersFromParams,
} from '@/features/notifications/model/sms-send-history/filter-url'

/**
 * 발송 이력 목록 queryKey — `modal`/`send`/`tab` 등 UI 전용 파라미터 제외.
 * 모달 닫힘만으로 키가 바뀌어 deliveries가 이중 호출되는 것을 막는다.
 */
export function mailSendHistorySearchParamsKey(searchParams: URLSearchParams): string {
  return applyMailSendHistoryFiltersToSearchParams(
    new URLSearchParams(),
    readMailSendHistoryFiltersFromParams(searchParams)
  ).toString()
}

export function smsSendHistorySearchParamsKey(searchParams: URLSearchParams): string {
  return applySmsSendHistoryFiltersToSearchParams(
    new URLSearchParams(),
    readSmsSendHistoryFiltersFromParams(searchParams)
  ).toString()
}

export function alimtalkSendHistorySearchParamsKey(searchParams: URLSearchParams): string {
  return applySendHistoryFiltersToSearchParams(
    new URLSearchParams(),
    readSendHistoryFiltersFromParams(searchParams)
  ).toString()
}
