import { useMemo } from 'react'
import {
  buildBulkDeleteGuideTitle,
  buildBulkDomainDeleteMessageLines,
  buildDomainEntityDeleteMessageLines } from '@/shared/ui/delete-guide-messages'

interface UseDeleteGuideAlertsOptions<T> {
  items: T[]
  domainLabel: string
  bulkCounterPhrase: string
  particleTargetNoun: string
  getDisplayName: (item: T) => string
  singleTitle?: string
}

interface UseDeleteGuideAlertsResult {
  title: string
  lines: string[]
}

/**
 * 단건/다건 삭제 안내 모달의 제목과 본문 라인을 공통으로 구성한다.
 */
export function useDeleteGuideMessages<T>({
  items,
  domainLabel,
  bulkCounterPhrase,
  particleTargetNoun,
  getDisplayName,
  singleTitle }: UseDeleteGuideAlertsOptions<T>): UseDeleteGuideAlertsResult {
  return useMemo(() => {
    const isMulti = items.length >= 2
    const title = isMulti ? buildBulkDeleteGuideTitle(domainLabel) : (singleTitle ?? `${domainLabel} 삭제 안내`)

    if (items.length === 0) {
      return { title, lines: [] }
    }

    const lines = isMulti
      ? buildBulkDomainDeleteMessageLines(
          items.length,
          bulkCounterPhrase,
          particleTargetNoun,
          domainLabel
        )
      : buildDomainEntityDeleteMessageLines([getDisplayName(items[0])], domainLabel)

    return { title, lines }
  }, [bulkCounterPhrase, domainLabel, getDisplayName, items, particleTargetNoun, singleTitle])
}
