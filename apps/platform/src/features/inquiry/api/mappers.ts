import {
  formatDisplayDateRange,
  formatDisplayDateTime,
} from '../../../shared/lib/format-display-date.ts'
import type { OneToOneInquiryItem, OneToOneInquiryStatus } from '../model/types'
import type { PortalInquiryDetail, PortalInquiryListItem } from './client'

function formatInquiryTimestamp(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  return formatDisplayDateTime(trimmed) || trimmed
}

export function mapInquiryStatus(
  status: string | undefined,
  displayStatus: string | undefined
): OneToOneInquiryStatus {
  const label = displayStatus?.trim() ?? ''
  if (label.includes('대기')) return 'pending'
  if (label.includes('완료') || label.includes('답변')) return 'answered'
  const token = (status ?? '').trim().toUpperCase()
  if (token === 'ANSWERED' || token === 'COMPLETED' || token === 'DONE') return 'answered'
  return 'pending'
}

export function mapInquiryListItem(
  item: PortalInquiryListItem,
  index: number
): OneToOneInquiryItem | null {
  if (item.inquiryId == null) return null
  return {
    id: String(item.inquiryId),
    category: item.category?.trim() || '기타',
    title: item.title?.trim() || '문의',
    status: mapInquiryStatus(item.status, item.displayStatus),
    createdAt: formatDisplayDateRange(item.inquiredAt, item.inquiredAt, {
      weekday: false,
      empty: '',
    }),
    answeredAt: formatInquiryTimestamp(item.answeredAt) || undefined,
    programName: item.programName?.trim() || '해당 없음',
    question: '',
    order: index,
  }
}

export function mapInquiryDetail(detail: PortalInquiryDetail): Partial<OneToOneInquiryItem> {
  const answers = detail.answers ?? []
  const answer = answers
    .map(item => item.content?.trim())
    .filter(Boolean)
    .join('\n\n')
  const latestAnswer = [...answers].reverse().find(item => item.answeredAt?.trim())
  return {
    category: detail.category?.trim() || undefined,
    title: detail.title?.trim() || undefined,
    status: mapInquiryStatus(detail.status, detail.displayStatus),
    createdAt: formatInquiryTimestamp(detail.inquiredAt) || undefined,
    answeredAt: formatInquiryTimestamp(latestAnswer?.answeredAt ?? detail.answeredAt) || undefined,
    programName: detail.programName?.trim() || undefined,
    question: detail.content?.trim() || '',
    answer: answer || undefined,
  }
}
