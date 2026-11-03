import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Spin } from 'antd'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import { getInquiryAttachments } from '@/features/posts/api/inquiries/admin-inquiries-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { useInquiryDetailQuery } from '@/features/posts/hooks/use-inquiry-detail-query'
import { useInquiryMutations } from '@/features/posts/hooks/use-inquiry-mutations'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'
import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
import { RichTextViewer } from '@/shared/rich-text'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  ActionResultModal,
  CmsButton,
  CmsTextArea,
  ContentModal,
  showRegisterCompletedAlert,
} from '@/shared/ui'
import './admin-inquiry-detail-modal.css'

export interface AdminInquiryDetailModalProps {
  open: boolean
  inquiryId: string | null
  onCancel: () => void
  /** 답변 저장 후 (목록 동기화 등) */
  onSuccess: () => void
  /** 단건 삭제 확인으로 넘기기 전 id 전달 */
  onDeleteClick: (id: string) => void
  canWrite: boolean
}

export function AdminInquiryDetailModal({
  open,
  inquiryId,
  onCancel,
  onSuccess,
  onDeleteClick,
}: AdminInquiryDetailModalProps) {
  const detailQuery = useInquiryDetailQuery(inquiryId, open)
  const attachmentsEnabled = usePostsRemoteEnabled('inquiries', open && Boolean(inquiryId))
  const attachmentsQuery = useQuery({
    queryKey: postsQueryKeys.inquiries.attachments(inquiryId ?? ''),
    queryFn: () => getInquiryAttachments(inquiryId!),
    enabled: attachmentsEnabled,
    staleTime: 30_000,
    retry: false,
  })
  const { replyMutation } = useInquiryMutations()
  const detail = detailQuery.detail
  const attachments = attachmentsQuery.data ?? []

  const handleDownloadAttachment = useCallback(async (fileObjectId: number, fileName: string) => {
    await downloadAdminFile({ fileObjectId, fileName })
  }, [])

  const [answerText, setAnswerText] = useState('')
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [actionResultOpen, setActionResultOpen] = useState(false)
  const [actionResultTitle, setActionResultTitle] = useState('')
  const [actionResultMessage, setActionResultMessage] = useState('')

  useEffect(() => {
    if (!open) return
    setAnswerText(detail?.answerMarkdown ?? '')
    setAnswerError(null)
  }, [detail?.answerMarkdown, open])

  const isAnswerRegistered =
    detail?.status === 'ANSWERED' || Boolean(detail?.answerMarkdown?.trim())

  const handleReplySubmit = useCallback(async () => {
    if (!detail || isAnswerRegistered) return
    const md = answerText.trim()
    if (md === '') {
      setAnswerError('내용을 입력해 주세요.')
      return
    }
    setAnswerError(null)
    try {
      await replyMutation.mutateAsync({ inquiryId: detail.id, content: md })
      onSuccess()
      onCancel()
      showRegisterCompletedAlert()
    } catch (error) {
      setActionResultTitle('답변 등록 실패')
      setActionResultMessage(getPostsApiErrorMessage(error, '답변 등록에 실패했습니다.'))
      setActionResultOpen(true)
    }
  }, [answerText, detail, isAnswerRegistered, onCancel, onSuccess, replyMutation])

  const handleDelete = useCallback(() => {
    if (!detail) return
    onDeleteClick(detail.id)
  }, [detail, onDeleteClick])

  const footer = (
    <>
      <CmsButton
        variant="delete"
        size="medium"
        onClick={handleDelete}
        disabled={!detail || isAnswerRegistered} >
        삭제
      </CmsButton>
      <div className="admin-inquiry-detail-modal__footer-right">
        <CmsButton variant="secondary" size="medium" onClick={onCancel}>
          취소
        </CmsButton>
        <CmsButton
          variant="primary"
          size="medium"
          onClick={handleReplySubmit}
          adminAction="send"
          disabled={!detail || isAnswerRegistered || replyMutation.isPending} >
          답변 등록
        </CmsButton>
      </div>
    </>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="문의상세"
        size="large"
        width={1400}
        className="admin-inquiry-detail-modal"
        wrapClassName="admin-inquiry-detail-modal-wrap"
        footer={footer}
        zIndex={1100}
      >
        {detailQuery.isLoading ? (
          <div
            className="admin-inquiry-detail-modal__empty admin-inquiry-detail-modal__loading"
            role="status"
            aria-label="문의 불러오는 중"
          >
            <Spin size="large" />
          </div>
        ) : detailQuery.privacyMessage ? (
          <div className="admin-inquiry-detail-modal__empty" role="alert">
            {detailQuery.privacyMessage}
          </div>
        ) : detailQuery.isError ? (
          <div className="admin-inquiry-detail-modal__empty" role="alert">
            {getPostsApiErrorMessage(detailQuery.error, '문의를 불러올 수 없습니다.')}
          </div>
        ) : !detail ? (
          <div className="admin-inquiry-detail-modal__empty">문의를 불러올 수 없습니다.</div>
        ) : (
          <div className="admin-inquiry-detail-modal__inner">
            <section className="admin-inquiry-detail-modal__section">
              <DetailInfoForm
                title="문의내용"
                mode="view"
                className="admin-inquiry-detail-modal__content-form"
              >
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field label="문의 회원명" view={detail.memberName} />
                  <DetailInfoForm.Field
                    label="문의일시"
                    view={dayjs(detail.createdAt).format('YYYY.MM.DD HH:mm:ss')}
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field label="연락처" view={detail.phone} />
                  <DetailInfoForm.Field label="이메일" view={detail.email} />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field label="카테고리" view={detail.category} />
                  <DetailInfoForm.Field
                    label="답변 현황"
                    view={
                      detail.status === 'PENDING' ? (
                        <span className="admin-inquiry-detail-modal__status admin-inquiry-detail-modal__status--pending">
                          답변 대기
                        </span>
                      ) : (
                        <span className="admin-inquiry-detail-modal__status admin-inquiry-detail-modal__status--answered">
                          답변 완료
                        </span>
                      )
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="프로그램명"
                    fullRow
                    view={
                      detail.programName == null || detail.programName === ''
                        ? '-'
                        : detail.programName
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field label="문의 제목" fullRow view={detail.title} />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="문의 내용"
                    fullRow
                    view={
                      <RichTextViewer
                        markdown={detail.body}
                        className="admin-inquiry-detail-modal__body-viewer"
                        maxHeight="none"
                      />
                    }
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            </section>

            {attachments.length > 0 ? (
              <section
                className="admin-inquiry-detail-modal__section"
                aria-labelledby="inquiry-detail-attachments-heading"
              >
                <h3
                  id="inquiry-detail-attachments-heading"
                  className="admin-inquiry-detail-modal__section-title"
                >
                  첨부파일
                </h3>
                <ul className="admin-inquiry-detail-modal__attachments">
                  {attachments.map(item => {
                    const fileObjectId = item.fileObjectId
                    const fileName =
                      item.originalFileName?.trim() || `첨부파일-${fileObjectId ?? ''}`
                    return (
                      <li key={item.attachmentId ?? fileObjectId ?? fileName}>
                        {fileObjectId == null ? (
                          fileName
                        ) : (
                          <button
                            type="button"
                            className="admin-inquiry-detail-modal__attachment-link"
                            onClick={() => {
                              void handleDownloadAttachment(fileObjectId, fileName)
                            }}
                          >
                            {fileName}
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}

            <section className="admin-inquiry-detail-modal__section">
              <CmsTextArea
                className="admin-inquiry-detail-modal__answer-field"
                label="내용 (답변)"
                required={!isAnswerRegistered}
                inputSize="large"
                width="100%"
                value={answerText}
                onChange={e => {
                  setAnswerText(e.target.value)
                  if (answerError) setAnswerError(null)
                }}
                placeholder="내용을 입력해 주세요."
                disabled={isAnswerRegistered}
                error={Boolean(answerError)}
                message={answerError ?? undefined}
              />
            </section>
          </div>
        )}
      </ContentModal>
      <ActionResultModal
        open={actionResultOpen}
        title={actionResultTitle}
        body={actionResultMessage}
        onClose={() => setActionResultOpen(false)}
        zIndex={1200}
      />
    </>
  )
}
