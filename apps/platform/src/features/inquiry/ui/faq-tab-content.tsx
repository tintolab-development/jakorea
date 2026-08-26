import { useMemo, useState } from 'react'
import {
  FAQ_CATEGORY_OPTIONS,
  FAQ_PAGE_SIZE,
  filterFaqs,
  useMockFaqsCatalog,
  type InquiryListParams,
} from '@/features/inquiry'
import {
  PFAccordionList,
  PFPagination,
  PFSearchFilter,
  type PFAccordionListItem,
} from '@/shared/ui'
import { FilterBar } from '@/widgets/search-list-layout'
import styles from './faq-tab-content.module.css'

type FaqTabContentProps = {
  params: InquiryListParams
  onParamsChange: (next: Partial<InquiryListParams>) => void
}

export function FaqTabContent({ params, onParamsChange }: FaqTabContentProps) {
  const faqs = useMockFaqsCatalog()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredFaqs = useMemo(() => filterFaqs(faqs, params), [faqs, params])

  const totalPages = Math.max(1, Math.ceil(filteredFaqs.length / FAQ_PAGE_SIZE))
  const currentPage = Math.min(params.page, totalPages)
  const pageItems = filteredFaqs.slice(
    (currentPage - 1) * FAQ_PAGE_SIZE,
    currentPage * FAQ_PAGE_SIZE,
  )

  const accordionItems: PFAccordionListItem[] = pageItems.map(item => ({
    id: item.id,
    categoryLabel: item.category,
    title: item.title,
    question: item.question,
    answer: item.answer,
  }))

  const categoryOptions = FAQ_CATEGORY_OPTIONS.map(option => ({
    value: option.value,
    label: option.label,
  }))

  const handleCategoryChange = (category: string) => {
    onParamsChange({
      category: category as InquiryListParams['category'],
      page: 1,
    })
    setExpandedId(null)
  }

  const handleFilterReset = () => {
    onParamsChange({ category: '전체', page: 1 })
    setExpandedId(null)
  }

  return (
    <div className={styles.root}>
      <div className={styles.filters}>
        <FilterBar onReset={handleFilterReset}>
          <PFSearchFilter
            label="카테고리"
            options={categoryOptions}
            value={params.category}
            onChange={handleCategoryChange}
          />
        </FilterBar>
      </div>

      <PFAccordionList
        items={accordionItems}
        expandedId={expandedId}
        onExpandedChange={setExpandedId}
        emptyMessage="선택한 카테고리에 등록된 FAQ가 없습니다."
      />

      {filteredFaqs.length > 0 ? (
        <div className={styles.pagination}>
          <PFPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={page => {
              onParamsChange({ page })
              setExpandedId(null)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
