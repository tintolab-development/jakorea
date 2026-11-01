import { useId, useMemo, useRef, useState } from 'react'
import illustQuotationUrl from '@/shared/assets/illustration/illust-quotation-no-bg.svg'
import {
  PFAlertModal,
  PFButton,
  PFDataTable,
  PFLoadingSpinner,
  PFPagination,
  PFText,
  type PFDataTableColumn,
} from '@/shared/ui'
import { validateUploadFileSize } from '@/shared/lib/file-upload-policy'
import {
  useDownloadPortalEducationJournal,
  usePortalEducationJournals,
  useSubmitPortalEducationJournal,
} from '../api/education-journals-hooks'
import type { PortalEducationJournal } from '../api/education-journals-client'
import styles from './education-journal-panel.module.css'

const PAGE_SIZE = 10
const EMPTY_JOURNALS: PortalEducationJournal[] = []
const TABLE_MIN_WIDTH = '720px'

type JournalRow = PortalEducationJournal & { displayNo: number }

function fileNameOf(journal: PortalEducationJournal): string {
  return (
    journal.originalFilename?.trim() ||
    journal.journalTitle?.trim() ||
    `교육일지_${journal.journalId ?? ''}`
  )
}

function journalRowKey(journal: PortalEducationJournal): string {
  return String(journal.journalId ?? `${journal.fileObjectId}-${journal.submittedAt}`)
}

function errorMessage(error: unknown): string {
  const responseData = (error as { response?: { data?: unknown } } | null)?.response?.data
  const responseError =
    responseData && typeof responseData === 'object'
      ? (responseData as { error?: { code?: unknown; message?: unknown } }).error
      : undefined
  const code = typeof responseError?.code === 'string' ? responseError.code : ''
  const message = [
    code,
    error instanceof Error ? error.message : '',
    typeof responseError?.message === 'string' ? responseError.message : '',
  ]
    .filter(Boolean)
    .join(' ')
  if (
    message.includes('파일 저장소 업로드에 실패했습니다') ||
    message.includes('INTERNAL_SERVER_ERROR')
  ) {
    return '교육일지 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }
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
  if (message.includes('EDUCATION_JOURNAL_ACCESS_DENIED')) {
    return '이 신청의 교육일지를 조회할 권한이 없습니다.'
  }
  if (message.includes('ORGANIZATION_APPLICATION_NOT_FOUND')) {
    return '기관 신청을 찾을 수 없습니다.'
  }
  if (message.includes('EDUCATION_JOURNAL_APPLICATION_NOT_APPROVED')) {
    return '승인 완료된 기관 신청만 교육일지를 제출할 수 있습니다.'
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
  const [page, setPage] = useState(1)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const journalsQuery = usePortalEducationJournals(programId, organizationApplicationId)
  const submitMutation = useSubmitPortalEducationJournal(programId, organizationApplicationId)
  const downloadMutation = useDownloadPortalEducationJournal()

  const journals = journalsQuery.data ?? EMPTY_JOURNALS
  const totalPages = Math.max(1, Math.ceil(journals.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleJournals = useMemo((): JournalRow[] => {
    const start = (safePage - 1) * PAGE_SIZE
    return journals.slice(start, start + PAGE_SIZE).map((journal, index) => ({
      ...journal,
      displayNo: journals.length - (start + index),
    }))
  }, [journals, safePage])

  const columns = useMemo((): PFDataTableColumn<JournalRow>[] => {
    return [
      {
        key: 'no',
        label: 'No',
        width: '66px',
        render: row => String(row.displayNo),
      },
      {
        key: 'fileName',
        label: '파일명',
        align: 'left',
        render: row => {
          const fileName = fileNameOf(row)
          const fileObjectId = row.fileObjectId
          if (fileObjectId != null && fileObjectId > 0) {
            return (
              <button
                type="button"
                className={styles.fileButton}
                onClick={() =>
                  downloadMutation.mutate(
                    { fileObjectId, fileName },
                    { onError: error => setAlertMessage(errorMessage(error)) }
                  )
                }
                disabled={downloadMutation.isPending}
              >
                {fileName}
              </button>
            )
          }
          return fileName
        },
      },
      {
        key: 'submittedAt',
        label: '제출일자',
        width: '180px',
        render: row => submittedDateLabel(row.submittedAt ?? row.createdAt),
      },
    ]
  }, [downloadMutation])

  const handleFileChange = (file: File | undefined) => {
    if (!enabled || !file || submitMutation.isPending) return
    // 같은 파일을 다시 선택해도 change 이벤트가 발생하도록 초기화한다.
    if (inputRef.current) inputRef.current.value = ''
    const sizeError = validateUploadFileSize(file)
    if (sizeError) {
      setAlertMessage(sizeError)
      return
    }
    submitMutation.mutate(file, {
      onSuccess: () => {
        setPage(1)
      },
      onError: error => {
        setAlertMessage(errorMessage(error))
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
            typo="hl-sm"
            color="black"
            className={styles.title}
          >
            교육일지를 제출해 주세요.
          </PFText>
          <PFText as="p" typo="bd-md-md" color="black" className={styles.description}>
            진행이 완료된 교육에 대한 교육일지를 제출해 주세요. 제공된 엑셀 양식을 작성해 업로드
            해주세요.
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
              variant="certificate"
              onClick={() => inputRef.current?.click()}
              disabled={submitMutation.isPending}
              className={styles.submitButton}
            >
              교육일지 제출하기
              <img
                className={styles.submitIllustration}
                src={illustQuotationUrl}
                alt=""
                width={48}
                height={48}
                aria-hidden="true"
              />
            </PFButton>
          </div>
        ) : null}
      </div>

      {journalsQuery.isLoading ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          교육일지를 불러오는 중입니다.
        </PFText>
      ) : journalsQuery.isError ? (
        <PFText as="p" typo="bd-md-rg" color="error">
          {errorMessage(journalsQuery.error)}
        </PFText>
      ) : (
        <>
          <PFDataTable
            columns={columns}
            rows={visibleJournals}
            rowKey={journalRowKey}
            minWidth={TABLE_MIN_WIDTH}
            emptyMessage="제출된 교육일지가 없습니다."
          />
          {journals.length > 0 && totalPages > 1 ? (
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
      )}

      <PFAlertModal
        open={alertMessage != null}
        title="안내"
        description={alertMessage ?? undefined}
        onConfirm={() => setAlertMessage(null)}
      />

      {submitMutation.isPending ? (
        <div className={styles.submitLoadingOverlay} aria-busy="true">
          <PFLoadingSpinner label="교육일지 제출 처리 중" />
        </div>
      ) : null}
    </section>
  )
}
