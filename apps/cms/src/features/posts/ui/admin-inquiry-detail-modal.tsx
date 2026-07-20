import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Spin } from 'antd'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import { shouldUseInquiriesRemoteApi } from '@/features/posts/api/inquiries/admin-inquiries-service'
import { useInquiryDetailQuery } from '@/features/posts/hooks/use-inquiry-detail-query'
import { useInquiryMutations } from '@/features/posts/hooks/use-inquiry-mutations'
import { RichTextViewer } from '@/shared/rich-text'
import { ActionResultModal, CmsButton, ContentModal } from '@/shared/ui'
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
  canWrite,
}: AdminInquiryDetailModalProps) {
  const inquiriesRemote = shouldUseInquiriesRemoteApi()
  const detailQuery = useInquiryDetailQuery(inquiryId, open)
  const { replyMutation } = useInquiryMutations()
  const detail = detailQuery.data ?? null

  const [answerText, setAnswerText] = useState('')
  const [actionResultOpen, setActionResultOpen] = useState(false)
  const [actionResultTitle, setActionResultTitle] = useState('')
  const [actionResultMessage, setActionResultMessage] = useState('')

  useEffect(() => {
    if (!open) return
    setAnswerText(detail?.answerMarkdown ?? '')
  }, [detail?.answerMarkdown, open])

  const isAnswerRegistered = detail?.status === 'ANSWERED'

  const handleReplySubmit = useCallback(async () => {
    if (!detail || !canWrite || isAnswerRegistered) return
    const md = answerText.trim()
    if (md === '') {
      return
    }
    try {
      await replyMutation.mutateAsync({ inquiryId: detail.id, content: md })
      onSuccess()
      onCancel()
    } catch (error) {
      setActionResultTitle('답변 등록 실패')
      setActionResultMessage(getPostsApiErrorMessage(error, '답변 등록에 실패했습니다.'))
      setActionResultOpen(true)
    }
  }, [answerText, canWrite, detail, isAnswerRegistered, onCancel, onSuccess, replyMutation])

  const handleDelete = useCallback(() => {
    if (!detail || !canWrite || inquiriesRemote) return
    onDeleteClick(detail.id)
  }, [canWrite, detail, inquiriesRemote, onDeleteClick])

  const footer = (
    <>
      <CmsButton
        variant="delete"
        size="medium"
        onClick={handleDelete}
        disabled={!canWrite || !detail || inquiriesRemote}
        title={inquiriesRemote ? '문의 삭제 API가 제공되지 않습니다.' : undefined}
      >
        문의삭제
      </CmsButton>
      <div className="admin-inquiry-detail-modal__footer-right">
        <CmsButton variant="secondary" size="medium" onClick={onCancel}>
          취소
        </CmsButton>
        <CmsButton
          variant="primary"
          size="medium"
          onClick={handleReplySubmit}
          disabled={!canWrite || !detail || isAnswerRegistered || replyMutation.isPending}
        >
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
        ) : !detail ? (
          <div className="admin-inquiry-detail-modal__empty">문의를 불러올 수 없습니다.</div>
        ) : (
          <div className="admin-inquiry-detail-modal__inner">
            <section
              className="admin-inquiry-detail-modal__section"
              aria-labelledby="inquiry-detail-content-heading"
            >
              <h3
                id="inquiry-detail-content-heading"
                className="admin-inquiry-detail-modal__section-title"
              >
                문의내용
              </h3>
              <div className="admin-inquiry-detail-modal__table-wrap">
                <table className="admin-inquiry-detail-modal__info-table">
                  <tbody>
                    <tr>
                      <th
                        scope="row"
                        className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label"
                      >
                        문의 회원명
                      </th>
                      <td className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value">
                        {detail.memberName}
                      </td>
                      <th
                        scope="row"
                        className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label"
                      >
                        문의일시
                      </th>
                      <td className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value">
                        {dayjs(detail.createdAt).format('YYYY.MM.DD HH:mm:ss')}
                      </td>
                    </tr>
                    <tr>
                      <th
                        scope="row"
                        className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label"
                      >
                        연락처
                      </th>
                      <td className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value">
                        {detail.phone}
                      </td>
                      <th
                        scope="row"
                        className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label"
                      >
                        이메일
                      </th>
                      <td className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value">
                        {detail.email}
                      </td>
                    </tr>
                    <tr>
                      <th
                        scope="row"
                        className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label"
                      >
                        카테고리
                      </th>
                      <td className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value">
                        {detail.category}
                      </td>
                      <th
                        scope="row"
                        className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label"
                      >
                        답변 현황
                      </th>
                      <td className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value">
                        {detail.status === 'PENDING' ? (
                          <span className="admin-inquiry-detail-modal__status admin-inquiry-detail-modal__status--pending">
                            답변 대기
                          </span>
                        ) : (
                          <span className="admin-inquiry-detail-modal__status admin-inquiry-detail-modal__status--answered">
                            답변 완료
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th
                        scope="row"
                        className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label"
                      >
                        문의 제목
                      </th>
                      <td
                        className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value"
                        colSpan={3}
                      >
                        {detail.title}
                      </td>
                    </tr>
                    <tr>
                      <th
                        scope="row"
                        className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label"
                      >
                        문의 내용
                      </th>
                      <td
                        className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value admin-inquiry-detail-modal__cell--multiline"
                        colSpan={3}
                      >
                        <RichTextViewer
                          markdown={detail.body}
                          className="admin-inquiry-detail-modal__body-viewer"
                          maxHeight="none"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section
              className="admin-inquiry-detail-modal__section"
              aria-labelledby="inquiry-detail-reply-heading"
            >
              <h3
                id="inquiry-detail-reply-heading"
                className="admin-inquiry-detail-modal__section-title admin-inquiry-detail-modal__section-title--reply"
              >
                내용 (답변)
              </h3>
              {canWrite ? (
                <textarea
                  className="admin-inquiry-detail-modal__answer-textarea"
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  placeholder="문의에 답변을 입력해 주세요."
                  disabled={isAnswerRegistered}
                />
              ) : (
                <div className="admin-inquiry-detail-modal__answer-readonly">
                  {detail.answerMarkdown && detail.answerMarkdown.length > 0 ? (
                    <RichTextViewer
                      markdown={detail.answerMarkdown}
                      className="admin-inquiry-detail-modal__answer-viewer"
                      maxHeight="none"
                    />
                  ) : (
                    <span className="admin-inquiry-detail-modal__answer-placeholder">
                      등록된 답변이 없습니다.
                    </span>
                  )}
                </div>
              )}
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
