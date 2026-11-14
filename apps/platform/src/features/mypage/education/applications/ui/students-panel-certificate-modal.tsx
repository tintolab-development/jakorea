import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PortalStudentRosterItem } from '../api/student-documents-types'
import { useDownloadOrganizationStudentCertificatesMutation } from '../api/student-documents-hooks'
import {
  formatPortalStudentBirthDate,
  formatPortalStudentEmail,
  formatPortalStudentGender,
  formatPortalStudentGradeClass,
  formatPortalStudentPhone,
} from '../lib/student-documents-display'
import {
  type CertificateSelection,
  currentCertificateSelectionKeys,
  resolveSelectedRosterIds,
  toCertificateRosterEntries,
  validateCertificateRosterIds,
} from '../lib/certificate-bulk-download'
import { resolveStudentDocumentsErrorMessage } from '../lib/student-documents-errors'
import { buildCertificateDownloadFileName } from '../lib/certificate-download-file-name'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import fileDownloadBlackUrl from '@/shared/assets/icons/file-download-black.svg'
import { PFAlertModal, PFButton, PFCheckbox, PFLoadingSpinner, PFModal, PFText } from '@/shared/ui'
import styles from './students-panel-certificate-modal.module.css'

type StudentsPanelCertificateModalProps = {
  applicationId: string
  open: boolean
  onClose: () => void
  rows: PortalStudentRosterItem[]
}

export function StudentsPanelCertificateModal({
  applicationId,
  open,
  onClose,
  rows,
}: StudentsPanelCertificateModalProps) {
  const [selection, setSelection] = useState<CertificateSelection>(() => ({
    applicationId,
    keys: new Set(),
  }))
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const downloadCertificates = useDownloadOrganizationStudentCertificatesMutation(applicationId)
  const { displayName } = useMypageMember()
  const isDownloading = downloadCertificates.isPending
  const downloadInFlightRef = useRef(false)

  const rowEntries = useMemo(() => toCertificateRosterEntries(rows), [rows])
  const selectableKeys = useMemo(
    () =>
      Array.from(
        new Set(
          rowEntries.flatMap(entry => (entry.selectionKey == null ? [] : [entry.selectionKey])),
        ),
      ),
    [rowEntries],
  )
  const selectedKeys = currentCertificateSelectionKeys(selection, applicationId)
  const selectedRosterIds = useMemo(
    () => resolveSelectedRosterIds(rowEntries, selectedKeys),
    [rowEntries, selectedKeys],
  )

  useEffect(() => {
    setSelection({ applicationId, keys: new Set() })
    setAlertMessage(null)
  }, [open, rows, applicationId])

  const allSelected =
    selectableKeys.length > 0 && selectableKeys.every(key => selectedKeys.has(key))

  const toggleAll = useCallback(() => {
    setSelection({ applicationId, keys: allSelected ? new Set() : new Set(selectableKeys) })
  }, [applicationId, allSelected, selectableKeys])

  const toggleRow = useCallback(
    (key: string, checked: boolean) => {
      setSelection(prev => {
        const next = new Set(currentCertificateSelectionKeys(prev, applicationId))
        if (checked) next.add(key)
        else next.delete(key)
        return { applicationId, keys: next }
      })
    },
    [applicationId],
  )

  const handleDownload = async () => {
    if (isDownloading || downloadInFlightRef.current) return
    const validationMessage = validateCertificateRosterIds(selectedRosterIds)
    if (validationMessage) {
      setAlertMessage(validationMessage)
      return
    }
    downloadInFlightRef.current = true
    try {
      await downloadCertificates.mutateAsync({
        rosterIds: selectedRosterIds,
        fileName: buildCertificateDownloadFileName({
          memberName: displayName,
          extension: 'zip',
        }),
      })
      onClose()
    } catch (error) {
      setAlertMessage(resolveStudentDocumentsErrorMessage(error, '수료증을 다운로드하지 못했습니다.'))
    } finally {
      downloadInFlightRef.current = false
    }
  }

  return (
    <>
      <PFModal
        showCloseButton={false}
        open={open}
        size="lg"
        mobilePlacement="full"
        title="수료증 발급하기"
        onClose={onClose}
      >
        <div className={styles.body}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            무단결석 없이 마지막까지 모든 교육을 이수한 학생만 수료증 다운로드가 가능합니다.
            파일은 관리자 수료증 양식의 제목·본문·이사장명·하단 정보를 따릅니다. 배경·로고·직인은
            포함되지 않을 수 있습니다.
          </PFText>

          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkboxCell}>
                    <PFCheckbox
                      size="small"
                      checked={allSelected}
                      disabled={selectableKeys.length === 0 || isDownloading}
                      aria-label="전체 선택"
                      onCheckedChange={() => toggleAll()}
                    />
                  </th>
                  <th style={{ width: '56px' }}>
                    <PFText as="span" typo="bd-md-bd" color="black">
                      No
                    </PFText>
                  </th>
                  <th style={{ width: '96px' }}>
                    <PFText as="span" typo="bd-md-bd" color="black">
                      학생명
                    </PFText>
                  </th>
                  <th style={{ width: '64px' }}>
                    <PFText as="span" typo="bd-md-bd" color="black">
                      성별
                    </PFText>
                  </th>
                  <th style={{ width: '128px' }}>
                    <PFText as="span" typo="bd-md-bd" color="black">
                      생년월일
                    </PFText>
                  </th>
                  <th style={{ width: '88px' }}>
                    <PFText as="span" typo="bd-md-bd" color="black">
                      학급
                    </PFText>
                  </th>
                  <th style={{ width: '140px' }}>
                    <PFText as="span" typo="bd-md-bd" color="black">
                      연락처
                    </PFText>
                  </th>
                  <th>
                    <PFText as="span" typo="bd-md-bd" color="black">
                      이메일
                    </PFText>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rowEntries.map(({ row, index, selectionKey }) => (
                  <tr key={`${index}-${selectionKey ?? 'unselectable'}`}>
                    <td className={styles.checkboxCell}>
                      <PFCheckbox
                        size="small"
                        checked={selectionKey != null && selectedKeys.has(selectionKey)}
                        disabled={selectionKey == null || isDownloading}
                        aria-label={`${row.studentName?.trim() || '학생'} 선택`}
                        onCheckedChange={checked => {
                          if (selectionKey != null) toggleRow(selectionKey, checked)
                        }}
                      />
                    </td>
                    <td>
                      <PFText as="span" typo="bd-md-md" color="black">
                        {index + 1}
                      </PFText>
                    </td>
                    <td>
                      <PFText as="span" typo="bd-md-md" color="black">
                        {row.studentName?.trim() || '-'}
                      </PFText>
                    </td>
                    <td>
                      <PFText as="span" typo="bd-md-md" color="black">
                        {formatPortalStudentGender(row.gender)}
                      </PFText>
                    </td>
                    <td>
                      <PFText as="span" typo="bd-md-md" color="black">
                        {formatPortalStudentBirthDate(row.birthDate)}
                      </PFText>
                    </td>
                    <td>
                      <PFText as="span" typo="bd-md-md" color="black">
                        {formatPortalStudentGradeClass(row.grade, row.className)}
                      </PFText>
                    </td>
                    <td>
                      <PFText as="span" typo="bd-md-md" color="black">
                        {formatPortalStudentPhone(row)}
                      </PFText>
                    </td>
                    <td className={styles.left}>
                      <PFText as="span" typo="bd-md-md" color="black">
                        {formatPortalStudentEmail(row)}
                      </PFText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.footer}>
            <PFButton
              type="button"
              className={styles.footerButton}
              variant="secondary"
              size="xlarge"
              disabled={isDownloading}
              onClick={onClose}
            >
              취소
            </PFButton>
            <PFButton
              type="button"
              className={styles.footerButton}
              variant="primary"
              size="xlarge"
              disabled={isDownloading || selectedRosterIds.length === 0}
              onClick={handleDownload}
            >
              <span className={styles.downloadInner}>
                <img
                  className={styles.downloadIcon}
                  src={fileDownloadBlackUrl}
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden="true"
                />
                {isDownloading ? '다운로드 중…' : '수료증 다운받기'}
              </span>
            </PFButton>
          </div>
        </div>
      </PFModal>

      <PFAlertModal
        open={alertMessage != null}
        title="안내"
        description={alertMessage ?? ''}
        confirmLabel="확인"
        onConfirm={() => setAlertMessage(null)}
      />
      {isDownloading ? <PFLoadingSpinner blocking label="수료증을 다운로드하는 중" /> : null}
    </>
  )
}
