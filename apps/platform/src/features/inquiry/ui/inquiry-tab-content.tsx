import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  INQUIRY_PAGE_SIZE,
  MYPAGE_INQUIRIES_WRITE_PATH,
  useMockOneToOneInquiriesCatalog,
  type InquiryListParams,
  type OneToOneInquiryItem,
} from '@/features/inquiry'
import { PFButton, PFPagination } from '@/shared/ui'
import { InquiryAccordionList } from './inquiry-accordion-list'
import styles from './inquiry-tab-content.module.css'

type InquiryTabContentProps = {
  params: InquiryListParams
  onParamsChange: (next: Partial<InquiryListParams>) => void
}

export function InquiryTabContent({ params, onParamsChange }: InquiryTabContentProps) {
  const navigate = useNavigate()
  const catalog = useMockOneToOneInquiriesCatalog()
  const [items, setItems] = useState<OneToOneInquiryItem[]>(() => [...catalog])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sortedItems = useMemo(
    () => [...items].sort((left, right) => left.order - right.order),
    [items],
  )

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / INQUIRY_PAGE_SIZE))
  const currentPage = Math.min(params.page, totalPages)
  const pageItems = sortedItems.slice(
    (currentPage - 1) * INQUIRY_PAGE_SIZE,
    currentPage * INQUIRY_PAGE_SIZE,
  )

  const handleDelete = (id: string) => {
    setItems(previous => previous.filter(item => item.id !== id))
    if (expandedId === id) {
      setExpandedId(null)
    }
  }

  const handleWriteClick = () => {
    navigate(MYPAGE_INQUIRIES_WRITE_PATH)
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <PFButton size="xlarge" type="button" onClick={handleWriteClick}>
          1:1 문의 작성하기
        </PFButton>
      </div>

      <InquiryAccordionList
        items={pageItems}
        expandedId={expandedId}
        onExpandedChange={setExpandedId}
        onDelete={handleDelete}
      />

      {sortedItems.length > 0 ? (
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
