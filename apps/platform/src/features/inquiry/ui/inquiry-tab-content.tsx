import { useMemo, useState } from 'react'
import {
  INQUIRY_PAGE_SIZE,
  useCreateMyInquiryMutation,
  useDeleteMyInquiryMutation,
  useInquiryWriteOptionsQuery,
  useMyInquiriesQuery,
  useMyInquiryDetailQuery,
  type InquiryListParams,
  type OneToOneInquiryItem,
  type OneToOneInquiryWritePayload,
} from '@/features/inquiry'
import { PFButton, PFPagination, PFText } from '@/shared/ui'
import {
  getInquiryApiErrorMessage,
  INQUIRY_DELETE_ERROR_FALLBACK,
} from '../lib/inquiry-errors'
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
  order: number
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
  const remoteInquiries = useMyInquiriesQuery()
  const [localItems, setLocalItems] = useState<OneToOneInquiryItem[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [inquiryError, setInquiryError] = useState<string | null>(null)
  const remoteDetail = useMyInquiryDetailQuery(remoteInquiries.enabled ? expandedId : null)
  const writeOptions = useInquiryWriteOptionsQuery(remoteInquiries.enabled)
  const createInquiry = useCreateMyInquiryMutation()
  const deleteInquiry = useDeleteMyInquiryMutation()

  const items = useMemo(() => {
    const source = remoteInquiries.enabled ? remoteInquiries.items : localItems
    if (!remoteDetail.detail || !expandedId) return source
    return source.map(item => (item.id === expandedId ? { ...item, ...remoteDetail.detail } : item))
  }, [expandedId, localItems, remoteDetail.detail, remoteInquiries.enabled, remoteInquiries.items])

  const sortedItems = useMemo(
    () => [...items].sort((left, right) => left.order - right.order),
    [items]
  )

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / INQUIRY_PAGE_SIZE))
  const currentPage = Math.min(params.page, totalPages)
  const pageItems = sortedItems.slice(
    (currentPage - 1) * INQUIRY_PAGE_SIZE,
    currentPage * INQUIRY_PAGE_SIZE
  )

  const handleDelete = async (id: string) => {
    if (deletingId) return
    setInquiryError(null)
    if (remoteInquiries.enabled) {
      setDeletingId(id)
      try {
        await deleteInquiry.mutateAsync(id)
      } catch (error) {
        setInquiryError(getInquiryApiErrorMessage(error, INQUIRY_DELETE_ERROR_FALLBACK))
        return
      } finally {
        setDeletingId(null)
      }
    } else {
      setLocalItems(previous => previous.filter(item => item.id !== id))
    }
    if (expandedId === id) {
      setExpandedId(null)
    }
  }

  const handleCreateInquiry = async (
    payload: OneToOneInquiryWritePayload,
    idempotencyKey: string,
  ) => {
    if (remoteInquiries.enabled) {
      await createInquiry.mutateAsync({ payload, idempotencyKey })
    } else {
      const nextOrder = localItems.reduce((maxOrder, item) => Math.max(maxOrder, item.order), 0) + 1
      setLocalItems(previous => [createInquiryItem(payload, nextOrder), ...previous])
    }
    onParamsChange({ page: 1 })
    setExpandedId(null)
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <PFButton
          size="xlarge"
          type="button"
          onClick={() => {
            setInquiryError(null)
            setIsWriteModalOpen(true)
          }}
        >
          1:1 문의 작성하기
        </PFButton>
      </div>

      {inquiryError ? (
        <PFText as="p" typo="bd-sm-md" color="error" role="alert" className={styles.error}>
          {inquiryError}
        </PFText>
      ) : null}

      <InquiryAccordionList
        items={pageItems}
        expandedId={expandedId}
        onExpandedChange={setExpandedId}
        onDelete={handleDelete}
        deletingId={deletingId}
        loading={remoteInquiries.isLoading}
        emptyMessage="등록된 1:1 문의가 없습니다."
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
        programOptions={writeOptions.enabled ? writeOptions.programOptions : undefined}
        categoryOptions={
          writeOptions.enabled && writeOptions.categoryOptions.length > 0
            ? writeOptions.categoryOptions
            : undefined
        }
      />
    </div>
  )
}
