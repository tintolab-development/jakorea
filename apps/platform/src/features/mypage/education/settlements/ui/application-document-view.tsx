import { useEffect, useState } from 'react'
import type { SettlementApplicationDocumentResponse } from '../api/application-document-types'
import { requestSettlementApplicationDocumentAttachmentDownload } from '../api/application-document-client'
import {
  buildReceiptTransportDistanceRow,
  buildSettlementDocumentBasicRows,
  buildSettlementDocumentCalcRows,
  displaySettlementDocumentText,
  buildSettlementDocumentLineSpans,
  formatSettlementDocumentAmount,
  formatSettlementDocumentLectureDateParts,
  formatSettlementDocumentSignedAmount,
  formatSettlementDocumentTotalLabel,
  layoutSettlementDocumentInfoRows,
  settlementDocumentFirstColumnHeader,
  settlementDocumentFirstColumnValue,
  settlementDocumentLinesSectionTitle,
  settlementDocumentPayDeductionLabel,
  showSettlementDocumentAttachmentsPage,
  shouldShowSettlementDocumentFirstColumn,
  warnIfSettlementDocumentTotalMismatch,
  type SettlementDocumentInfoRow,
} from '../lib/format-application-document'
import { fetchPortalSignedDownloadBlob } from '@/shared/lib/portal-signed-download-fetch'
import styles from './application-document-view.module.css'

export type SettlementApplicationDocumentPage = 'summary' | 'attachments'

/** 첫 열을 숨길 때 일자 병합용 단일 그룹 키 (화면에 표시하지 않음) */
const NO_FIRST_COLUMN_GROUP = 'no-first-column'

type EducationSettlementApplicationDocumentViewProps = {
  document: SettlementApplicationDocumentResponse
  programTitle?: string | null
  /** `application.programConfig.programType` — 개인형이면 「참여 기관명」열 미노출 */
  programType?: string | null
  page?: SettlementApplicationDocumentPage
  onRefreshDocument: () => void | Promise<unknown>
  refreshing?: boolean
}

function saveAttachmentBlob(fileName: string, blob: Blob): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName || '첨부파일'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

function formatAttachmentSize(fileSize: number | undefined): string | null {
  if (!Number.isFinite(fileSize) || fileSize == null || fileSize < 0) return null
  if (fileSize < 1024) return `${fileSize} B`
  if (fileSize < 1024 * 1024) return `${Math.round(fileSize / 1024)} KB`
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
}

/** 시안 `line`(1px 구분선)으로 값 나누기 — 예: 날짜 | 회차, 계좌 | 예금주 */
function DividedParts({ parts, className }: { parts: string[]; className: string }) {
  if (parts.length < 2) return <>{parts[0] ?? ''}</>
  return (
    <span className={className}>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} className={styles.partGroup}>
          {index > 0 ? <span className={styles.partDivider} aria-hidden /> : null}
          <span>{part}</span>
        </span>
      ))}
    </span>
  )
}

/** value === null(제출 스냅샷 값 없음)이면 빈 칸 — `-`·기본값을 그리지 않는다 */
function InfoValue({ row }: { row: SettlementDocumentInfoRow }) {
  if (row.value == null) return null
  return row.parts ? (
    <DividedParts parts={row.parts} className={styles.infoParts} />
  ) : (
    <>{row.value}</>
  )
}

function InfoTable({ rows }: { rows: SettlementDocumentInfoRow[] }) {
  return (
    <div className={styles.infoTableWrap}>
      <table className={styles.infoTable}>
        <colgroup>
          <col className={styles.colInfoLabel} />
          <col />
          <col className={styles.colInfoLabel} />
          <col />
        </colgroup>
        <tbody>
          {layoutSettlementDocumentInfoRows(rows).map(([left, right]) => (
            <tr key={left.label}>
              <th scope="row">{left.label}</th>
              {right ? (
                <>
                  <td>
                    <InfoValue row={left} />
                  </td>
                  <th scope="row">{right.label}</th>
                  <td>
                    <InfoValue row={right} />
                  </td>
                </>
              ) : (
                <td colSpan={3}>
                  <InfoValue row={left} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EducationSettlementApplicationDocumentView({
  document,
  programTitle,
  programType,
  page = 'summary',
  onRefreshDocument,
  refreshing = false,
}: EducationSettlementApplicationDocumentViewProps) {
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)

  useEffect(() => {
    warnIfSettlementDocumentTotalMismatch(document)
  }, [document])

  const handleAttachmentDownload = async (
    attachment: SettlementApplicationDocumentResponse['attachments'][number]
  ) => {
    const fileObjectId = attachment.fileObjectId
    const validFileObjectId =
      typeof fileObjectId === 'number' && Number.isSafeInteger(fileObjectId) && fileObjectId > 0
        ? fileObjectId
        : null
    if (validFileObjectId == null || downloadingAttachmentId != null) {
      return
    }
    const fileName = attachment.originalFileName?.trim() || `첨부파일-${validFileObjectId}`
    setDownloadingAttachmentId(validFileObjectId)
    setAttachmentError(null)
    try {
      const resolved =
        await requestSettlementApplicationDocumentAttachmentDownload(validFileObjectId)
      const downloadUrl = resolved.downloadUrl?.trim()
      if (!downloadUrl) throw new Error('download url missing')
      const blob = await fetchPortalSignedDownloadBlob(downloadUrl, resolved.requiredHeaders, {
        acceptAnyContent: true,
      })
      if (blob.size < 1 || /\bjson\b/i.test(blob.type)) {
        throw new Error('empty attachment')
      }
      saveAttachmentBlob(fileName, blob)
    } catch {
      setAttachmentError('첨부파일 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      void Promise.resolve(onRefreshDocument()).catch(() => undefined)
    } finally {
      setDownloadingAttachmentId(null)
    }
  }

  /** 영수증(RECEIPT_SETTLEMENT)은 calcInfo = null — 지급조서 전용 산출 정보는 그리지 않는다 */
  const calcInfo = document.documentType === 'PAYMENT_STATEMENT' ? document.calcInfo : null
  const showCalc = calcInfo != null
  const receiptDistanceRow = buildReceiptTransportDistanceRow(document)
  const basicRows = [
    ...buildSettlementDocumentBasicRows(document.basicInfo),
    ...(receiptDistanceRow ? [receiptDistanceRow] : []),
  ]
  const calcRows = calcInfo != null ? buildSettlementDocumentCalcRows(calcInfo, document.lines) : []
  const showFirstColumn = shouldShowSettlementDocumentFirstColumn(document.documentType, programType)
  const linesColumnCount = showFirstColumn ? 6 : 5
  const firstColumnHeader = settlementDocumentFirstColumnHeader(document.documentType)
  const linesTitle = settlementDocumentLinesSectionTitle(document.documentType)
  const lineCells = document.lines.map(line => {
    const dateParts = formatSettlementDocumentLectureDateParts(line)
    return {
      first: showFirstColumn
        ? settlementDocumentFirstColumnValue(document.documentType, line, programTitle)
        : NO_FIRST_COLUMN_GROUP,
      dateParts,
      date: dateParts.join(' | '),
    }
  })
  const lineSpans = buildSettlementDocumentLineSpans(lineCells)

  if (page === 'attachments' && showSettlementDocumentAttachmentsPage(document)) {
    return (
      <div className={styles.body}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>첨부</h2>
          {document.attachments.length === 0 ? (
            <p className={styles.attachmentMeta}>첨부 없음</p>
          ) : (
            <ul className={styles.attachmentList}>
              {document.attachments.map((attachment, index) => {
                const fileObjectId = attachment.fileObjectId
                const label =
                  attachment.originalFileName?.trim() ||
                  (fileObjectId != null ? `첨부 ${fileObjectId}` : `첨부 ${index + 1}`)
                const size = formatAttachmentSize(attachment.fileSize)
                return (
                  <li
                    key={`${attachment.submissionFileId ?? fileObjectId ?? 'attachment'}-${index}`}
                    className={styles.attachmentItem}
                  >
                    <p className={styles.attachmentName}>{label}</p>
                    {size || attachment.contentType ? (
                      <span className={styles.attachmentMeta}>
                        {[attachment.contentType, size].filter(Boolean).join(' · ')}
                      </span>
                    ) : null}
                    {fileObjectId != null ? (
                      <button
                        type="button"
                        className={styles.attachmentOpen}
                        disabled={downloadingAttachmentId === fileObjectId || refreshing}
                        onClick={() => void handleAttachmentDownload(attachment)}
                      >
                        {downloadingAttachmentId === fileObjectId ? '다운로드 중...' : '다운로드'}
                      </button>
                    ) : (
                      <span className={styles.attachmentMeta}>
                        다운로드할 파일 정보가 없습니다.
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {attachmentError ? <p className={styles.attachmentError}>{attachmentError}</p> : null}
        </section>
      </div>
    )
  }

  return (
    <div className={styles.body}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>기본 정보</h2>
        <InfoTable rows={basicRows} />
      </section>

      {showCalc ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>강사비 산출 정보</h2>
          <InfoTable rows={calcRows} />
        </section>
      ) : null}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{linesTitle}</h2>
        <div className={styles.linesWrap}>
          <table className={styles.linesTable}>
            <colgroup>
              {showFirstColumn ? <col className={styles.colProgram} /> : null}
              <col className={styles.colDate} />
              <col className={styles.colPay} />
              <col className={styles.colCategory} />
              <col className={styles.colItem} />
              <col className={styles.colAmount} />
            </colgroup>
            <thead>
              <tr>
                {showFirstColumn ? <th scope="col">{firstColumnHeader}</th> : null}
                <th scope="col">교육 진행 일자</th>
                <th scope="col">지급/공제</th>
                <th scope="col">구분</th>
                <th scope="col">항목 설명</th>
                <th scope="col">정산 금액</th>
              </tr>
            </thead>
            <tbody>
              {document.lines.length === 0 ? (
                <tr>
                  <td colSpan={linesColumnCount} className={styles.emptyCell}>
                    제출 정보 없음
                  </td>
                </tr>
              ) : (
                document.lines.map((line, index) => {
                  const cell = lineCells[index]!
                  const span = lineSpans[index]!
                  return (
                    <tr key={`${line.category ?? ''}-${line.description ?? ''}-${index}`}>
                      {showFirstColumn && span.firstRowSpan > 0 ? (
                        <td rowSpan={span.firstRowSpan > 1 ? span.firstRowSpan : undefined}>
                          {cell.first}
                        </td>
                      ) : null}
                      {span.dateRowSpan > 0 ? (
                        <td rowSpan={span.dateRowSpan > 1 ? span.dateRowSpan : undefined}>
                          <DividedParts parts={cell.dateParts} className={styles.lineParts} />
                        </td>
                      ) : null}
                      <td>{settlementDocumentPayDeductionLabel(line)}</td>
                      <td>{displaySettlementDocumentText(line.category)}</td>
                      <td>{displaySettlementDocumentText(line.description)}</td>
                      <td className={styles.amountCell}>
                        {formatSettlementDocumentSignedAmount(line.amount)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            <tfoot>
              <tr className={styles.summaryRow}>
                <th scope="row" colSpan={showFirstColumn ? 2 : 1}>
                  합계
                </th>
                <td colSpan={3} className={styles.summaryFormula}>
                  {formatSettlementDocumentTotalLabel(document.total)}
                </td>
                <td className={`${styles.amountCell} ${styles.summaryTotal}`}>
                  {formatSettlementDocumentAmount(document.total.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  )
}
