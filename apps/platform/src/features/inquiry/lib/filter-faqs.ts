import type { FaqItem, InquiryListParams } from '../model/types'

export function filterFaqs(
  items: readonly FaqItem[],
  params: Pick<InquiryListParams, 'category'>,
): FaqItem[] {
  const filtered =
    params.category === '전체'
      ? [...items]
      : items.filter(item => item.category === params.category)

  return filtered.sort((a, b) => a.order - b.order)
}
