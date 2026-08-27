import { useMemo, useState } from 'react'
import {
  INQUIRY_PAGE_SIZE,
  useMockOneToOneInquiriesCatalog,
  type InquiryListParams,
  type OneToOneInquiryItem,
  type OneToOneInquiryWritePayload,
} from '@/features/inquiry'
import { PFButton, PFPagination } from '@/shared/ui'
import { InquiryAccordionList } from './inquiry-accordion-list'
import { OneToOneInquiryWriteModal } from './one-to-one-inquiry-write-modal'
import styles from './inquiry-tab-content.module.css'

type InquiryTabContentProps = {
  params: InquiryListParams
  onParamsChange: (next: Partial<InquiryListParams>) => void
}

function formatCreatedAt(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}년 ${month}월 ${day}일`
}

function createInquiryItem(
  payload: OneToOneInquiryWritePayload,
  order: number,
): OneToOneInquiryItem {
  return {
    id: `inq-${Date.now()}`,
    category: payload.category,
    title: payload.title,
    status: 'pending',
    createdAt: formatCreatedAt(new Date()),
    programName: payload.programName,
    question: payload.content,
    order,
  }
}

export function InquiryTabContent({ params, onParamsChange }: InquiryTabContentProps) {
  const catalog = useMockOneToOneInquiriesCatalog()
  const [items, setItems] = useState<OneToOneInquiryItem[]>(() => [...catalog])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)

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

  const handleCreateInquiry = (payload: OneToOneInquiryWritePayload) => {
    const nextOrder = items.reduce((maxOrder, item) => Math.max(maxOrder, item.order), 0) + 1
    setItems(previous => [createInquiryItem(payload, nextOrder), ...previous])
    onParamsChange({ page: 1 })
    setExpandedId(null)
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <PFButton size="xlarge" type="button" onClick={() => setIsWriteModalOpen(true)}>
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

      <OneToOneInquiryWriteModal
        open={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onSubmit={handleCreateInquiry}
      />
    </div>
  )
}
