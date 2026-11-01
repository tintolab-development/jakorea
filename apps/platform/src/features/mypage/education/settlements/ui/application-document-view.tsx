import { useEffect, useRef } from 'react'
import type { SettlementApplicationDocumentResponse } from '../api/application-document-types'
import {
  buildSettlementDocumentBasicRows,
  buildSettlementDocumentCalcRows,
  displaySettlementDocumentText,
  formatSettlementDocumentAmount,
  formatSettlementDocumentLectureDate,
  formatSettlementDocumentTotalLabel,
  isSettlementDocumentDeductionLine,
  settlementDocumentPayDeductionLabel,
  warnIfSettlementDocumentTotalMismatch,
} from '../lib/format-application-document'
import { PFButton, PFInfoReview, PFText } from '@/shared/ui'
import styles from './application-document-view.module.css'

type EducationSettlementApplicationDocumentViewProps = {
  document: SettlementApplicationDocumentResponse
  onBack: () => void
  onRefreshDocument: () => void | Promise<unknown>
  refreshing?: boolean
}

function isImageContentType(contentType: string | null, fileName: string | null): boolean {
  if (contentType?.toLowerCase().startsWith('image/')) return true
  const name = fileName?.toLowerCase() ?? ''
  return /\.(png|jpe?g|gif|webp|bmp)$/.test(name)
}

function isPdfContentType(contentType: string | null, fileName: string | null): boolean {
  if (contentType?.toLowerCase().includes('pdf')) return true
  return (fileName?.toLowerCase() ?? '').endsWith('.pdf')
}

export function EducationSettlementApplicationDocumentView({
  document,
  onBack,
  onRefreshDocument,
  refreshing = false,
}: EducationSettlementApplicationDocumentViewProps) {
  const refreshOnceRef = useRef(false)

  useEffect(() => {
    warnIfSettlementDocumentTotalMismatch(document)
  }, [document])

  useEffect(() => {
    const expires = document.attachments
      .map(item => Date.parse(item.viewUrlExpiresAt))
      .filter(value => Number.isFinite(value))
    if (expires.length === 0) return
    const soonest = Math.min(...expires)
    const delay = Math.max(5_000, soonest - Date.now() - 30_000)
    const timer = window.setTimeout(() => {
      void onRefreshDocument()
    }, delay)
    return () => window.clearTimeout(timer)
  }, [document.attachments, onRefreshDocument])

  const handleAttachmentError = () => {
    if (refreshOnceRef.current || refreshing) return
    refreshOnceRef.current = true
    void Promise.resolve(onRefreshDocument()).finally(() => {
      window.setTimeout(() => {
        refreshOnceRef.current = false
      }, 2_000)
    })
  }

  const showCalc =
    document.documentType === 'PAYMENT_STATEMENT' && document.calcInfo != null
  const basicRows = buildSettlementDocumentBasicRows(document.basicInfo)
  const calcRows = showCalc ? buildSettlementDocumentCalcRows(document.calcInfo!) : []

  return (
    <div className={styles.page}>
      <header className={styles.docHeader}>
        <PFText as="h1" typo="hd-sm" color="black" className={styles.docTitle}>
          {document.title.trim() || 'JA KOREA 정산 신청서'}
        </PFText>
      </header>

      <section className={styles.section}>
        <PFText as="h2" typo="form-section-title" color="black" className={styles.sectionTitle}>
          기본 정보
        </PFText>
        <PFInfoReview rows={basicRows} accentFirstRow={false} />
      </section>

      {showCalc ? (
        <section className={styles.section}>
          <PFText as="h2" typo="form-section-title" color="black" className={styles.sectionTitle}>
            강의비 산출 정보
          </PFText>
          <PFInfoReview rows={calcRows} accentFirstRow={false} />
        </section>
      ) : null}

      <section className={styles.section}>
        <PFText as="h2" typo="form-section-title" color="black" className={styles.sectionTitle}>
          강의비 산출 내역
        </PFText>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">참여 기관명</th>
                <th scope="col">강의 진행 일자</th>
                <th scope="col">지급/공제</th>
                <th scope="col">구분</th>
                <th scope="col">항목명</th>
                <th scope="col">금액</th>
              </tr>
            </thead>
            <tbody>
              {document.lines.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    제출 정보 없음
                  </td>
                </tr>
              ) : (
                document.lines.map((line, index) => {
                  const deduction = isSettlementDocumentDeductionLine(line)
                  return (
                    <tr
                      key={`${line.category ?? ''}-${line.description ?? ''}-${index}`}
                      className={deduction ? styles.deductionRow : undefined}
                    >
                      <td>{displaySettlementDocumentText(line.institutionName)}</td>
                      <td>{formatSettlementDocumentLectureDate(line)}</td>
                      <td>{settlementDocumentPayDeductionLabel(line)}</td>
                      <td>{displaySettlementDocumentText(line.category)}</td>
                      <td>{displaySettlementDocumentText(line.description)}</td>
                      <td className={styles.amountCell}>
                        {formatSettlementDocumentAmount(line.amount)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className={styles.totalLabel}>
                  {formatSettlementDocumentTotalLabel(document.total)}
                </td>
                <td className={styles.amountCell}>
                  {formatSettlementDocumentAmount(document.total.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {document.attachments.length > 0 ? (
        <section className={styles.section}>
          <PFText as="h2" typo="form-section-title" color="black" className={styles.sectionTitle}>
            첨부
          </PFText>
          <ul className={styles.attachmentList}>
            {document.attachments.map(attachment => {
              const label = attachment.fileName?.trim() || `첨부 ${attachment.fileObjectId}`
              const image = isImageContentType(attachment.contentType, attachment.fileName)
              const pdf = isPdfContentType(attachment.contentType, attachment.fileName)
              return (
                <li key={attachment.fileObjectId} className={styles.attachmentItem}>
                  <PFText as="p" typo="bd-sm-md" color="neutral-cool-600" className={styles.attachmentName}>
                    {label}
                  </PFText>
                  {image ? (
                    <a
                      className={styles.attachmentLink}
                      href={attachment.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        className={styles.attachmentImage}
                        src={attachment.viewUrl}
                        alt={label}
                        onError={handleAttachmentError}
                      />
                    </a>
                  ) : pdf ? (
                    <iframe
                      className={styles.attachmentFrame}
                      title={label}
                      src={attachment.viewUrl}
                      onError={handleAttachmentError}
                    />
                  ) : (
                    <a
                      className={styles.attachmentOpen}
                      href={attachment.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      새 탭에서 열기
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <div className={styles.actions}>
        <PFButton type="button" variant="tertiary" size="xlarge" width="100%" onClick={onBack}>
          이전
        </PFButton>
      </div>
    </div>
  )
}
