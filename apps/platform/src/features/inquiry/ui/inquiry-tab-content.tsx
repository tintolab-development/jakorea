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
import { formatDisplayDateTime } from '@/shared/lib/format-display-date'
import type { PlatformAlertCopy } from '@/shared/lib/platform-alert-copy'
import { resolvePlatformErrorAlert } from '@/shared/lib/platform-error-alert'
import { PFAlertModal, PFButton, PFModal, PFPagination, PFText } from '@/shared/ui'
import cancelConfirmStyles from '@/features/mypage/education/applications/ui/cancel-confirm.module.css'
import { readInquiryServerErrorMessage } from '../lib/inquiry-errors'
import { InquiryAccordionList } from './inquiry-accordion-list'
import { OneToOneInquiryWriteModal } from './one-to-one-inquiry-write-modal'
import styles from './inquiry-tab-content.module.css'

type InquiryTabContentProps = {
  params: InquiryListParams
  onParamsChange: (next: Partial<InquiryListParams>) => void
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
    createdAt: formatDisplayDateTime(new Date()),
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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  /** 삭제 실패 — 시안 「처리 실패 / 처리 제한 / 네트워크 오류」 팝업 */
  const [deleteErrorAlert, setDeleteErrorAlert] = useState<PlatformAlertCopy | null>(null)
  const remoteDetail = useMyInquiryDetailQuery(remoteInquiries.enabled ? expandedId : null)
  const writeOptions = useInquiryWriteOptionsQuery(remoteInquiries.enabled)
  const createInquiry = useCreateMyInquiryMutation()
  const deleteInquiry = useDeleteMyInquiryMutation()

  const items = useMemo(() => {
    const source = remoteInquiries.enabled ? remoteInquiries.items : localItems
    if (!remoteDetail.detail || !expandedId) return source
    // 상세에 없는 값(undefined)이 목록 값(프로그램명 '해당 없음' 등)을 지우지 않게 정의된 값만 덮는다
    const detail = Object.fromEntries(
      Object.entries(remoteDetail.detail).filter(([, value]) => value !== undefined)
    ) as Partial<OneToOneInquiryItem>
    return source.map(item => (item.id === expandedId ? { ...item, ...detail } : item))
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

  const handleDelete = (id: string) => {
    if (deletingId) return
    setPendingDeleteId(id)
  }

  const handleCancelDelete = () => {
    if (deletingId) return
    setPendingDeleteId(null)
  }

  const handleConfirmDelete = async () => {
    const id = pendingDeleteId
    if (!id || deletingId) return
    if (remoteInquiries.enabled) {
      setDeletingId(id)
      try {
        await deleteInquiry.mutateAsync(id)
      } catch (error) {
        // 확인 창을 닫고 오류 팝업을 띄운다
        setPendingDeleteId(null)
        setDeleteErrorAlert(
          resolvePlatformErrorAlert(error, { serverMessage: readInquiryServerErrorMessage }),
        )
        return
      } finally {
        setDeletingId(null)
      }
    } else {
      setLocalItems(previous => previous.filter(item => item.id !== id))
    }
    setPendingDeleteId(null)
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
          onClick={() => setIsWriteModalOpen(true)}
        >
          1:1 문의 작성하기
        </PFButton>
      </div>

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

      <PFModal
        open={pendingDeleteId !== null}
        size="sm"
        onClose={handleCancelDelete}
        showCloseButton={false}
      >
        <div className={cancelConfirmStyles.content}>
          <div className={cancelConfirmStyles.textBlock}>
            <PFText as="div" typo="hl-lg" color="black" className={cancelConfirmStyles.title}>
              문의를 삭제할까요?
            </PFText>
            <PFText as="p" typo="bd-md-rg" color="neutral-warm-600" className={cancelConfirmStyles.description}>
              삭제한 문의는 되돌릴 수 없습니다.
            </PFText>
          </div>
          <div className={cancelConfirmStyles.actions}>
            <PFButton
              type="button"
              variant="tertiary"
              size="xlarge"
              disabled={deletingId !== null}
              onClick={handleCancelDelete}
            >
              취소
            </PFButton>
            <PFButton
              type="button"
              variant="primary"
              size="xlarge"
              disabled={deletingId !== null}
              onClick={() => {
                void handleConfirmDelete()
              }}
            >
              삭제
            </PFButton>
          </div>
        </div>
      </PFModal>

      <PFAlertModal
        open={deleteErrorAlert != null}
        title={deleteErrorAlert?.title ?? ''}
        description={deleteErrorAlert?.description}
        onConfirm={() => setDeleteErrorAlert(null)}
      />

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
