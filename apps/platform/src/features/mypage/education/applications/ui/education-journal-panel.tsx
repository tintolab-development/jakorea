import { useId, useMemo, useRef, useState } from 'react'
import { PFPagination, PFButton, PFText } from '@/shared/ui'
import {
  useDownloadPortalEducationJournal,
  usePortalEducationJournals,
  useSubmitPortalEducationJournal,
} from '../api/education-journals-hooks'
import type { PortalEducationJournal } from '../api/education-journals-client'
import styles from './education-journal-panel.module.css'

const PAGE_SIZE = 10
const EMPTY_JOURNALS: PortalEducationJournal[] = []

function fileNameOf(journal: PortalEducationJournal): string {
  return (
    journal.originalFilename?.trim() ||
    journal.journalTitle?.trim() ||
    `교육일지_${journal.journalId ?? ''}`
  )
}

function errorMessage(error: unknown): string {
  const responseData = (error as { response?: { data?: unknown } } | null)?.response?.data
  const responseError =
    responseData && typeof responseData === 'object'
      ? (responseData as { error?: { code?: unknown; message?: unknown } }).error
      : undefined
  const code = typeof responseError?.code === 'string' ? responseError.code : ''
  const message =
    [code, error instanceof Error ? error.message : '', typeof responseError?.message === 'string' ? responseError.message : '']
      .filter(Boolean)
      .join(' ')
  if (message.includes('TRAINED_TEACHER_EDUCATION_JOURNAL_DISABLED')) {
    return '교육일지를 사용하지 않는 프로그램입니다.'
  }
  if (message.includes('TRAINED_TEACHER_APPLICATION_NOT_APPROVED')) {
    return '승인 완료된 기관 신청만 교육일지를 제출할 수 있습니다.'
  }
  if (message.includes('EDUCATION_JOURNAL_FILE_PURPOSE_INVALID')) {
    return '교육일지 용도로 업로드한 파일만 제출할 수 있습니다.'
  }
  if (message.includes('EDUCATION_JOURNAL_FILE_NOT_AVAILABLE')) {
    return '사용할 수 없는 교육일지 파일입니다. 파일을 다시 업로드해 주세요.'
  }
  if (message.includes('EDUCATION_JOURNAL_FILE_NOT_OWNED')) {
    return '본인이 업로드한 교육일지 파일만 등록할 수 있습니다.'
  }
  if (message.includes('EDUCATION_JOURNAL_DUPLICATE')) {
    return '이미 제출한 교육일지 파일입니다.'
  }
  return message || '교육일지 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

function submittedDateLabel(value: string | undefined): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function EducationJournalPanel({
  programId,
  organizationApplicationId,
  enabled,
}: {
  programId: string
  organizationApplicationId: string
  enabled: boolean
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [page, setPage] = useState(1)
  const journalsQuery = usePortalEducationJournals(programId, organizationApplicationId)
  const submitMutation = useSubmitPortalEducationJournal(programId, organizationApplicationId)
  const downloadMutation = useDownloadPortalEducationJournal()

  const journals = journalsQuery.data ?? EMPTY_JOURNALS
  const totalPages = Math.max(1, Math.ceil(journals.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleJournals = useMemo(
    () => journals.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [journals, safePage]
  )

  const handleFileChange = (file: File | undefined) => {
    if (!enabled || !file || submitMutation.isPending) return
    setSelectedFile(file)
    // 같은 파일을 다시 선택해도 change 이벤트가 발생하도록 초기화한다.
    if (inputRef.current) inputRef.current.value = ''
    submitMutation.mutate(file, {
      onSuccess: () => {
        setSelectedFile(null)
        setPage(1)
      },
    })
  }

  return (
    <section className={styles.panel} aria-labelledby={`${inputId}-title`}>
      <div className={styles.header}>
        <div className={styles.stepCopy}>
          <PFText
            id={`${inputId}-title`}
            as="h2"
            typo="hd-sm"
            color="black"
            className={styles.title}
          >
            <span className={styles.step}>Step 1</span> 교육일지를 제출해 주세요
          </PFText>
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600" className={styles.description}>
            교육 진행 후 교육일지를 파일로 제출해 주세요.
          </PFText>
        </div>
        {enabled ? (
          <div className={styles.submitRow}>
            <input
              ref={inputRef}
              id={inputId}
              className={styles.hiddenInput}
              type="file"
              accept=".xlsx,.xls,.csv,.doc,.docx"
              onChange={event => handleFileChange(event.target.files?.[0])}
              disabled={submitMutation.isPending}
            />
            <PFButton
              type="button"
              variant="primary"
              size="medium"
              onClick={() => inputRef.current?.click()}
              disabled={submitMutation.isPending}
              className={styles.submitButton}
            >
              {submitMutation.isPending ? '제출 중' : '교육일지 제출하기'}
            </PFButton>
          </div>
        ) : null}
      </div>

      {selectedFile ? (
        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600" className={styles.selectedFile}>
          {selectedFile.name} 업로드 중입니다.
        </PFText>
      ) : null}

      {journalsQuery.isLoading ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          교육일지를 불러오는 중입니다.
        </PFText>
      ) : journalsQuery.isError ? (
        <PFText as="p" typo="bd-md-rg" color="error">
          {errorMessage(journalsQuery.error)}
        </PFText>
      ) : journals.length ? (
        <>
          <div className={styles.table} role="table" aria-label="제출한 교육일지 목록">
            <div className={`${styles.tableRow} ${styles.tableHeader}`} role="row">
              <span role="columnheader">No</span>
              <span role="columnheader">파일명</span>
              <span role="columnheader">제출일자</span>
            </div>
            {visibleJournals.map((journal, index) => {
              const fileName = fileNameOf(journal)
              const fileObjectId = journal.fileObjectId
              return (
                <div
                  key={journal.journalId ?? `${fileObjectId}-${journal.submittedAt}-${index}`}
                  className={styles.tableRow}
                  role="row"
                >
                  <span className={styles.number} role="cell">
                    {journals.length - ((safePage - 1) * PAGE_SIZE + index)}
                  </span>
                  <span className={styles.fileCell} role="cell">
                    {fileObjectId != null && fileObjectId > 0 ? (
                      <button
                        type="button"
                        className={styles.fileButton}
                        onClick={() => downloadMutation.mutate({ fileObjectId, fileName })}
                        disabled={downloadMutation.isPending}
                      >
                        {fileName}
                      </button>
                    ) : (
                      fileName
                    )}
                  </span>
                  <span className={styles.date} role="cell">
                    {submittedDateLabel(journal.submittedAt ?? journal.createdAt)}
                  </span>
                </div>
              )
            })}
          </div>
          {totalPages > 1 ? (
            <div className={styles.pagination}>
              <PFPagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
                ariaLabel="교육일지 페이지"
              />
            </div>
          ) : null}
        </>
      ) : (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          제출된 교육일지가 없습니다.
        </PFText>
      )}

      {submitMutation.isError ? (
        <PFText as="p" typo="bd-sm-rg" color="error" className={styles.error}>
          {errorMessage(submitMutation.error)}
        </PFText>
      ) : null}
      {downloadMutation.isError ? (
        <PFText as="p" typo="bd-sm-rg" color="error" className={styles.error}>
          {errorMessage(downloadMutation.error)}
        </PFText>
      ) : null}
    </section>
  )
}
