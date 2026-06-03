import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { getAdminInquiryDetail, submitAdminInquiryReply } from '@/features/posts/api/admin-inquiry-mock-store'
import type { AdminInquiryDetail } from '@/features/posts/model/admin-inquiry-management.types'
import { RichTextViewer } from '@/shared/rich-text'
import { CmsButton, ContentModal } from '@/shared/ui'
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
  const detail = useMemo<AdminInquiryDetail | null>(() => {
    if (!open || !inquiryId) return null
    return getAdminInquiryDetail(inquiryId)
  }, [open, inquiryId])

  const [answerText, setAnswerText] = useState('')

  useEffect(() => {
    if (!open) return
    setAnswerText(detail?.answerMarkdown ?? '')
  }, [detail?.answerMarkdown, open])

  const isAnswerRegistered = detail?.status === 'ANSWERED'

  const handleReplySubmit = useCallback(() => {
    if (!detail || !canWrite || isAnswerRegistered) return
    const md = answerText.trim()
    if (md === '') {
      return
    }
    const ok = submitAdminInquiryReply(detail.id, md)
    if (ok) {
      onSuccess()
      onCancel()
    } else {
      console.debug('adminInquiryDetailModal submitReply failed')
    }
  }, [answerText, canWrite, detail, isAnswerRegistered, onCancel, onSuccess])

  const handleDelete = useCallback(() => {
    if (!detail || !canWrite) return
    onDeleteClick(detail.id)
  }, [canWrite, detail, onDeleteClick])

  const footer = (
    <>
      <CmsButton
        variant="delete"
        size="large"
        onClick={handleDelete}
        disabled={!canWrite || !detail}
      >
        문의삭제
      </CmsButton>
      <div className="admin-inquiry-detail-modal__footer-right">
        <CmsButton variant="secondary" size="large" onClick={onCancel}>
          취소
        </CmsButton>
        <CmsButton
          variant="primary"
          size="large"
          onClick={handleReplySubmit}
          disabled={!canWrite || !detail || isAnswerRegistered}
        >
          답변 등록
        </CmsButton>
      </div>
    </>
  )

  return (
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
      {!detail ? (
        <div className="admin-inquiry-detail-modal__empty">문의를 불러올 수 없습니다.</div>
      ) : (
        <div className="admin-inquiry-detail-modal__inner">
          <section className="admin-inquiry-detail-modal__section" aria-labelledby="inquiry-detail-content-heading">
            <h3 id="inquiry-detail-content-heading" className="admin-inquiry-detail-modal__section-title">
              문의내용
            </h3>
            <div className="admin-inquiry-detail-modal__table-wrap">
              <table className="admin-inquiry-detail-modal__info-table">
                <tbody>
                  <tr>
                    <th scope="row" className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label">
                      문의 회원명
                    </th>
                    <td className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value">
                      {detail.memberName}
                    </td>
                    <th scope="row" className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label">
                      문의일시
                    </th>
                    <td className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value">
                      {dayjs(detail.createdAt).format('YYYY.MM.DD HH:mm:ss')}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label">
                      연락처
                    </th>
                    <td className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value">
                      {detail.phone}
                    </td>
                    <th scope="row" className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label">
                      이메일
                    </th>
                    <td className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value">
                      {detail.email}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label">
                      카테고리
                    </th>
                    <td className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--value">
                      {detail.category}
                    </td>
                    <th scope="row" className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label">
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
                    <th scope="row" className="admin-inquiry-detail-modal__cell admin-inquiry-detail-modal__cell--label">
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

          <section className="admin-inquiry-detail-modal__section" aria-labelledby="inquiry-detail-reply-heading">
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
                  <span className="admin-inquiry-detail-modal__answer-placeholder">등록된 답변이 없습니다.</span>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </ContentModal>
  )
}
