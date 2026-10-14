import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PortalStudentRosterItem } from '../api/student-documents-types'
import {
  formatPortalStudentBirthDate,
  formatPortalStudentGender,
  formatPortalStudentGradeClass,
} from '../lib/student-documents-display'
import fileDownloadBlackUrl from '@/shared/assets/icons/file-download-black.svg'
import { PFAlertModal, PFButton, PFCheckbox, PFModal, PFText } from '@/shared/ui'
import styles from './students-panel-certificate-modal.module.css'

function rosterRowKey(row: PortalStudentRosterItem, index: number): string {
  if (row.rosterId != null) return String(row.rosterId)
  return `${index}-${row.studentName ?? ''}-${row.studentNo ?? ''}-${row.birthDate ?? ''}`
}

type StudentsPanelCertificateModalProps = {
  open: boolean
  onClose: () => void
  rows: PortalStudentRosterItem[]
}

export function StudentsPanelCertificateModal({
  open,
  onClose,
  rows,
}: StudentsPanelCertificateModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const rowEntries = useMemo(
    () => rows.map((row, index) => ({ row, index, key: rosterRowKey(row, index) })),
    [rows],
  )

  const allKeys = useMemo(() => rowEntries.map(entry => entry.key), [rowEntries])

  useEffect(() => {
    if (!open) {
      setSelectedKeys(new Set())
      setIsDownloading(false)
      return
    }
    setSelectedKeys(new Set())
  }, [open, rows])

  const allSelected = allKeys.length > 0 && allKeys.every(key => selectedKeys.has(key))

  const toggleAll = useCallback(() => {
    setSelectedKeys(allSelected ? new Set() : new Set(allKeys))
  }, [allKeys, allSelected])

  const toggleRow = useCallback((key: string, checked: boolean) => {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
  }, [])

  const handleDownload = () => {
    if (selectedKeys.size === 0) {
      setAlertMessage('수료증을 발급할 학생을 선택해 주세요.')
      return
    }
    setIsDownloading(true)
    window.setTimeout(() => {
      setIsDownloading(false)
      setAlertMessage('수료증 다운로드 기능을 준비 중입니다.')
    }, 200)
  }

  return (
    <>
      <PFModal
        open={open}
        size="lg"
        mobilePlacement="full"
        title="수료증 발급하기"
        onClose={onClose}
        closeOnBackdropClick={!isDownloading}
      >
        <div className={styles.body}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            무단결석 없이 마지막까지 모든 교육을 이수한 학생만 수료증 발급이 가능합니다.
          </PFText>

          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkboxCell}>
                    <PFCheckbox
                      size="small"
                      checked={allSelected}
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
                {rowEntries.map(({ row, index, key }) => (
                  <tr key={key}>
                    <td className={styles.checkboxCell}>
                      <PFCheckbox
                        size="small"
                        checked={selectedKeys.has(key)}
                        aria-label={`${row.studentName?.trim() || '학생'} 선택`}
                        onCheckedChange={checked => toggleRow(key, checked)}
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
                        {row.maskedPhone?.trim() || '-'}
                      </PFText>
                    </td>
                    <td className={styles.left}>
                      <PFText as="span" typo="bd-md-md" color="black">
                        {row.maskedEmail?.trim() || '-'}
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
              disabled={isDownloading || selectedKeys.size === 0}
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
    </>
  )
}
