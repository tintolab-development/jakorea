/**
 * 기업 후원 상담 신청 상세 모달 (조회 전용)
 */

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { CorporateConsultation } from '@/entities/corporate-consultation/model/types'
import { shouldUseCorporateConsultationRemoteApi } from '@/features/corporate-consultation/api/capabilities'
import { downloadCorporateConsultationAttachmentService } from '@/features/corporate-consultation/api/service'
import { DEFAULT_CONFIRM_ACTOR } from '@/features/corporate-consultation/api/store'
import { CmsButton, ConfirmModal, ContentModal, useCmsAlert } from '@/shared/ui'

import './detail-modal.css'

dayjs.locale('ko')

type Props = {
  open: boolean
  data: CorporateConsultation | null
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onConfirm: () => void
  onDelete: () => void
}

function formatDateTimeWithWeekday(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  return d.format('YYYY.MM.DD(ddd) HH:mm')
}

function statusLabel(status: CorporateConsultation['status']): string {
  return status === 'confirmed' ? '확인 완료' : '확인 대기'
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M5.5 2.5h6.2L14.5 5.3V16.5a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 2.5V5.8H14.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CorporateConsultationDetailModal({
  open,
  data,
  confirmLoading = false,
  deleteLoading = false,
  onCancel,
  onConfirm,
  onDelete,
}: Props) {
  const { showAlert } = useCmsAlert()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open) setDeleteConfirmOpen(false)
  }, [open])

  const isConfirmed = data?.status === 'confirmed'
  const busy = confirmLoading || deleteLoading

  const confirmedView = (() => {
    if (!data?.confirmedAt) {
      return <span>-</span>
    }
    const name = data.confirmedByName?.trim() || DEFAULT_CONFIRM_ACTOR
    return (
      <span className="corp-consult-detail-modal__confirmed">
        <span>{formatDateTimeWithWeekday(data.confirmedAt)}</span>
        <DetailInfoForm.TdDivider />
        <span>{name}</span>
      </span>
    )
  })()

  const linkView =
    data?.linkUrl && data.linkUrl.trim() ? (
      <a
        className="corp-consult-detail-modal__link"
        href={data.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {data.linkUrl}
      </a>
    ) : (
      <span>-</span>
    )

  const attachmentView =
    data?.attachmentFileName ? (
      shouldUseCorporateConsultationRemoteApi() ? (
        <button
          type="button"
          className="corp-consult-detail-modal__attachment"
          onClick={() => {
            if (!data?.id) return
            void downloadCorporateConsultationAttachmentService(data.id)
              .then(result => {
                if (!result?.downloadUrl) {
                  showAlert({
                    title: '다운로드 실패',
                    content: '첨부파일을 불러오지 못했습니다.',
                  })
                  return
                }
                window.open(result.downloadUrl, '_blank', 'noopener,noreferrer')
              })
              .catch(() => {
                showAlert({
                  title: '다운로드 실패',
                  content: '첨부파일 다운로드에 실패했습니다.',
                })
              })
          }}
        >
          <FileIcon className="corp-consult-detail-modal__file-icon" />
          <span>{data.attachmentFileName}</span>
        </button>
      ) : data.attachmentUrl ? (
        <a
          className="corp-consult-detail-modal__attachment"
          href={data.attachmentUrl}
          download={data.attachmentFileName}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FileIcon className="corp-consult-detail-modal__file-icon" />
          <span>{data.attachmentFileName}</span>
        </a>
      ) : (
        <span>{data.attachmentFileName}</span>
      )
    ) : (
      <span>-</span>
    )

  const footer = (
    <div className="corp-consult-detail-modal__footer">
      <CmsButton
        variant="delete"
        size="large"
        type="button"
        loading={deleteLoading}
        disabled={busy}
        onClick={() => setDeleteConfirmOpen(true)}
      >
        신청 삭제
      </CmsButton>
      <div className="corp-consult-detail-modal__footer-end">
        <CmsButton
          variant="secondary"
          size="large"
          type="button"
          disabled={busy}
          onClick={onCancel}
        >
          닫기
        </CmsButton>
        <CmsButton
          variant="primary"
          size="large"
          type="button"
          loading={confirmLoading}
          disabled={busy || isConfirmed || !data}
          onClick={onConfirm}
        >
          신청 확인
        </CmsButton>
      </div>
    </div>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="기업 후원 상담 신청 상세"
        size="large"
        className="corp-consult-detail-modal"
        footer={footer}
      >
        {data ? (
          <div className="corp-consult-detail-modal__scroll">
            <section
              className="corp-consult-detail-modal__section"
              aria-labelledby="corp-consult-apply-heading"
            >
              <h3
                id="corp-consult-apply-heading"
                className="corp-consult-detail-modal__section-title"
              >
                신청 정보
              </h3>
              <div className="corp-consult-detail-modal__apply-tables">
                {/* ① 처리 메타 — 신청일시~동의 */}
                <DetailInfoForm
                  title="신청 처리 정보"
                  hideHeader
                  mode="view"
                  className="corp-consult-detail-modal__table corp-consult-detail-modal__table--process"
                >
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="신청일시"
                      view={<span>{formatDateTimeWithWeekday(data.appliedAt)}</span>}
                      edit={null}
                      readOnlyDisplay
                    />
                    <DetailInfoForm.Field
                      label="확인일시"
                      view={confirmedView}
                      edit={null}
                      readOnlyDisplay
                    />
                  </DetailInfoForm.Row>
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="처리 상태"
                      view={
                        <span
                          className={
                            data.status === 'pending'
                              ? 'corp-consult-detail-modal__status corp-consult-detail-modal__status--pending'
                              : 'corp-consult-detail-modal__status corp-consult-detail-modal__status--confirmed'
                          }
                        >
                          {statusLabel(data.status)}
                        </span>
                      }
                      edit={null}
                      readOnlyDisplay
                    />
                    <DetailInfoForm.Field
                      label="개인정보 수집·이용 동의"
                      view={<span>{data.privacyConsent ? '동의' : '-'}</span>}
                      edit={null}
                      readOnlyDisplay
                    />
                  </DetailInfoForm.Row>
                </DetailInfoForm>

                {/* ② 기업·담당자 — 기업명·담당자명 기준 분리 */}
                <DetailInfoForm
                  title="기업·담당자 정보"
                  hideHeader
                  mode="view"
                  className="corp-consult-detail-modal__table corp-consult-detail-modal__table--company"
                >
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="기업명"
                      view={<span>{data.companyName || '-'}</span>}
                      edit={null}
                      readOnlyDisplay
                    />
                    <DetailInfoForm.Field
                      label="담당자명"
                      view={<span>{data.contactName || '-'}</span>}
                      edit={null}
                      readOnlyDisplay
                    />
                  </DetailInfoForm.Row>
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="부서/직함명"
                      view={<span>{data.departmentTitle || '-'}</span>}
                      edit={null}
                      readOnlyDisplay
                    />
                    <DetailInfoForm.Field
                      label="담당자 연락처"
                      view={<span>{data.phone || '-'}</span>}
                      edit={null}
                      readOnlyDisplay
                    />
                  </DetailInfoForm.Row>
                </DetailInfoForm>
              </div>
            </section>

            <section
              className="corp-consult-detail-modal__section"
              aria-labelledby="corp-consult-content-heading"
            >
              <h3
                id="corp-consult-content-heading"
                className="corp-consult-detail-modal__section-title"
              >
                상담 정보
              </h3>
              <DetailInfoForm
                title="상담 정보"
                hideHeader
                mode="view"
                className="corp-consult-detail-modal__table corp-consult-detail-modal__table--consult"
              >
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="상담 내용"
                    view={
                      <span className="corp-consult-detail-modal__content">
                        {data.content?.trim() || '-'}
                      </span>
                    }
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="링크 삽입"
                    view={linkView}
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="첨부파일"
                    view={attachmentView}
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            </section>
          </div>
        ) : null}
      </ContentModal>

      <ConfirmModal
        open={deleteConfirmOpen}
        title="신청 삭제"
        content={
          '선택한 상담 신청을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.'
        }
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={deleteLoading}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          onDelete()
        }}
      />
    </>
  )
}
