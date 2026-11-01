import { useEffect, useState } from 'react'
import type { SettlementApplicationDocumentResponse } from '../api/application-document-types'
import { requestSettlementApplicationDocumentAttachmentDownload } from '../api/application-document-client'
import {
  buildSettlementDocumentBasicRows,
  buildSettlementDocumentCalcRows,
  displaySettlementDocumentText,
  formatSettlementDocumentAmount,
  formatSettlementDocumentLectureDate,
  formatSettlementDocumentSignedAmount,
  formatSettlementDocumentTotalLabel,
  isSettlementDocumentDeductionLine,
  settlementDocumentFirstColumnHeader,
  settlementDocumentFirstColumnValue,
  settlementDocumentLinesSectionTitle,
  settlementDocumentPayDeductionLabel,
  warnIfSettlementDocumentTotalMismatch,
} from '../lib/format-application-document'
import { fetchPortalSignedDownloadBlob } from '@/shared/lib/portal-signed-download-fetch'
import styles from './application-document-view.module.css'

export type SettlementApplicationDocumentPage = 'summary' | 'attachments'

type EducationSettlementApplicationDocumentViewProps = {
  document: SettlementApplicationDocumentResponse
  programTitle?: string | null
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

function pairInfoRows(
  rows: Array<{ label: string; value: string }>,
): Array<[ { label: string; value: string }, { label: string; value: string } | null ]> {
  const pairs: Array<
    [{ label: string; value: string }, { label: string; value: string } | null]
  > = []
  for (let i = 0; i < rows.length; i += 2) {
    pairs.push([rows[i]!, rows[i + 1] ?? null])
  }
  return pairs
}

export function EducationSettlementApplicationDocumentView({
  document,
  programTitle,
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

  const showCalc = document.documentType === 'PAYMENT_STATEMENT' && document.calcInfo != null
  const basicRows = buildSettlementDocumentBasicRows(document.basicInfo)
  const calcRows = showCalc ? buildSettlementDocumentCalcRows(document.calcInfo!) : []
  const firstColumnHeader = settlementDocumentFirstColumnHeader(document.documentType)
  const linesTitle = settlementDocumentLinesSectionTitle(document.documentType)

  if (page === 'attachments') {
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
                      <span className={styles.attachmentMeta}>다운로드할 파일 정보가 없습니다.</span>
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
        <div className={styles.infoTableWrap}>
          <table className={styles.infoTable}>
            <tbody>
              {pairInfoRows(basicRows).map(([left, right]) => (
                <tr key={left.label}>
                  <th scope="row">{left.label}</th>
                  <td>{left.value}</td>
                  {right ? (
                    <>
                      <th scope="row">{right.label}</th>
                      <td>{right.value}</td>
                    </>
                  ) : (
                    <>
                      <th scope="row" />
                      <td />
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showCalc ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>강의비 산출 정보</h2>
          <div className={styles.infoTableWrap}>
            <table className={styles.infoTable}>
              <tbody>
                {pairInfoRows(calcRows).map(([left, right]) => (
                  <tr key={left.label}>
                    <th scope="row">{left.label}</th>
                    <td>{left.value}</td>
                    {right ? (
                      <>
                        <th scope="row">{right.label}</th>
                        <td>{right.value}</td>
                      </>
                    ) : (
                      <>
                        <th scope="row" />
                        <td />
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{linesTitle}</h2>
        <div className={styles.linesWrap}>
          <table className={styles.linesTable}>
            <colgroup>
              <col className={styles.colProgram} />
              <col className={styles.colDate} />
              <col className={styles.colPay} />
              <col className={styles.colCategory} />
              <col className={styles.colItem} />
              <col className={styles.colAmount} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">{firstColumnHeader}</th>
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
                      <td>
                        {settlementDocumentFirstColumnValue(
                          document.documentType,
                          line,
                          programTitle,
                        )}
                      </td>
                      <td>{formatSettlementDocumentLectureDate(line)}</td>
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
                <th scope="row">합계</th>
                <td colSpan={4} className={styles.summaryFormula}>
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
