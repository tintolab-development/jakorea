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
import { homepageAttachmentDownloadErrorMessage } from '@/shared/lib/protected-attachment-download'
import { useProtectedFileDownload } from '@/shared/lib/use-protected-file-download'
import { formatDateTimeDotWithKoreanWeekday } from '@/shared/lib/format-display'
import {
  CmsButton,
  ConfirmModal,
  CONTENT_MODAL_FOOTER_START_CLASS,
  ContentModal,
  PageContentLoading,
  useCmsAlert,
} from '@/shared/ui'

import './detail-modal.css'

dayjs.locale('ko')

type Props = {
  open: boolean
  data: CorporateConsultation | null
  loading?: boolean
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onConfirm: () => void
  onDelete: () => void
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
      <path d="M11.5 2.5V5.8H14.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export function CorporateConsultationDetailModal({
  open,
  data,
  loading = false,
  confirmLoading = false,
  deleteLoading = false,
  onCancel,
  onConfirm,
  onDelete,
}: Props) {
  const { showAlert } = useCmsAlert()
  const { runProtectedDownload, filePasswordModal } = useProtectedFileDownload()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open) setDeleteConfirmOpen(false)
  }, [open])

  const isConfirmed = data?.status === 'confirmed'
  const waiting = loading && !data
  const busy = confirmLoading || deleteLoading || waiting

  const confirmedView = (() => {
    if (!data?.confirmedAt) {
      return <span>-</span>
    }
    const name = data.confirmedByName?.trim() || '-'
    return (
      <span className="corp-consult-detail-modal__confirmed">
        <span>{formatDateTimeDotWithKoreanWeekday(data.confirmedAt)}</span>
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
    data?.attachmentFileName && shouldUseCorporateConsultationRemoteApi() ? (
      <button
        type="button"
        className="corp-consult-detail-modal__attachment"
        // 권한 설정 V1.2: 신청자 첨부는 개인정보(HOMEPAGE_PII_VIEW). Program Viewer는 클릭 시 접근 불가 안내.
        data-homepage-action="pii"
        onClick={() => {
          if (!data?.id) return
          runProtectedDownload({
            kind: 'HOMEPAGE_PII_ATTACHMENT',
            zIndex: 1400,
            download: async password => {
              try {
                await downloadCorporateConsultationAttachmentService(
                  data.id,
                  data.attachmentAssetId,
                  password,
                  data.attachmentFileName ?? 'download'
                )
              } catch (error) {
                showAlert({
                  title: '다운로드 실패',
                  content: homepageAttachmentDownloadErrorMessage(
                    error,
                    '첨부파일 다운로드에 실패했습니다.'
                  ),
                })
                throw error
              }
            },
          })
        }}
      >
        <FileIcon className="corp-consult-detail-modal__file-icon" />
        <span>{data.attachmentFileName}</span>
      </button>
    ) : (
      <span>{data?.attachmentFileName || '-'}</span>
    )

  const footer = (
    <>
      <CmsButton
        className={CONTENT_MODAL_FOOTER_START_CLASS}
        variant="delete"
        size="medium"
        type="button"
        loading={deleteLoading}
        disabled={busy}
        onClick={() => setDeleteConfirmOpen(true)} >
        신청 삭제
      </CmsButton>
      <CmsButton
        variant="secondary"
        size="medium"
        type="button"
        disabled={busy}
        onClick={onCancel} >
        닫기
      </CmsButton>
      <CmsButton
        variant="primary"
        size="medium"
        type="button"
        loading={confirmLoading}
        disabled={busy || isConfirmed || !data}
        onClick={onConfirm} >
        신청 확인
      </CmsButton>
    </>
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
        {waiting ? (
          <PageContentLoading />
        ) : data ? (
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
                      view={<span>{formatDateTimeDotWithKoreanWeekday(data.appliedAt)}</span>}
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

      {filePasswordModal}
      <ConfirmModal
        open={deleteConfirmOpen}
        title="신청 삭제"
        content={'선택한 상담 신청을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.'}
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
