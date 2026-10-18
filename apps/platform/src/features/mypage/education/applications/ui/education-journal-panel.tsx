import { useId, useRef, useState } from 'react'
import { PFButton, PFText } from '@/shared/ui'
import {
  useDownloadPortalEducationJournal,
  usePortalEducationJournals,
  useSubmitPortalEducationJournal,
} from '../api/education-journals-hooks'
import type { PortalEducationJournal } from '../api/education-journals-client'
import styles from './education-journal-panel.module.css'

function fileNameOf(journal: PortalEducationJournal): string {
  return (
    journal.originalFilename?.trim() ||
    journal.journalTitle?.trim() ||
    `교육일지_${journal.journalId ?? ''}`
  )
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('TRAINED_TEACHER_EDUCATION_JOURNAL_DISABLED')) {
    return '교육일지를 사용하지 않는 프로그램입니다.'
  }
  if (message.includes('TRAINED_TEACHER_APPLICATION_NOT_APPROVED')) {
    return '승인 완료된 기관 신청만 교육일지를 제출할 수 있습니다.'
  }
  if (message.includes('EDUCATION_JOURNAL_FILE_NOT_OWNED')) {
    return '본인이 업로드한 교육일지 파일만 등록할 수 있습니다.'
  }
  return message || '교육일지 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

export function EducationJournalPanel({
  programId,
  organizationApplicationId,
}: {
  programId: string
  organizationApplicationId: string
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const journalsQuery = usePortalEducationJournals(programId, organizationApplicationId)
  const submitMutation = useSubmitPortalEducationJournal(programId, organizationApplicationId)
  const downloadMutation = useDownloadPortalEducationJournal()

  const submit = () => {
    if (!selectedFile || submitMutation.isPending) return
    submitMutation.mutate(selectedFile, {
      onSuccess: () => {
        setSelectedFile(null)
        if (inputRef.current) inputRef.current.value = ''
      },
    })
  }

  return (
    <section className={styles.panel} aria-labelledby={`${inputId}-title`}>
      <div className={styles.header}>
        <div>
          <PFText id={`${inputId}-title`} as="h2" typo="hd-sm" color="black">
            교육일지
          </PFText>
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
            교육일지를 제출하고 제출한 파일을 확인할 수 있어요.
          </PFText>
        </div>
        <div className={styles.submitRow}>
          <input
            ref={inputRef}
            id={inputId}
            className={styles.hiddenInput}
            type="file"
            onChange={event => setSelectedFile(event.target.files?.[0] ?? null)}
            disabled={submitMutation.isPending}
          />
          <PFButton
            type="button"
            variant="tertiary"
            size="medium"
            onClick={() => inputRef.current?.click()}
            disabled={submitMutation.isPending}
          >
            파일 선택
          </PFButton>
          <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600" className={styles.fileName}>
            {selectedFile?.name ?? '선택된 파일 없음'}
          </PFText>
          <PFButton
            type="button"
            variant="primary"
            size="medium"
            onClick={submit}
            disabled={!selectedFile || submitMutation.isPending}
          >
            {submitMutation.isPending ? '제출 중' : '제출'}
          </PFButton>
        </div>
      </div>

      {journalsQuery.isLoading ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          교육일지를 불러오는 중입니다.
        </PFText>
      ) : journalsQuery.isError ? (
        <PFText as="p" typo="bd-md-rg" color="error">
          {errorMessage(journalsQuery.error)}
        </PFText>
      ) : journalsQuery.data?.length ? (
        <ul className={styles.list}>
          {journalsQuery.data.map(journal => (
            <li
              key={journal.journalId ?? `${journal.fileObjectId}-${journal.submittedAt}`}
              className={styles.item}
            >
              <div>
                <PFText as="p" typo="bd-md-md" color="black">
                  {fileNameOf(journal)}
                </PFText>
                <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
                  {journal.submittedAt ?? journal.createdAt ?? ''}
                </PFText>
              </div>
              {journal.fileObjectId != null && journal.fileObjectId > 0 ? (
                <PFButton
                  type="button"
                  variant="tertiary"
                  size="small"
                  onClick={() =>
                    downloadMutation.mutate({
                      fileObjectId: journal.fileObjectId!,
                      fileName: fileNameOf(journal),
                    })
                  }
                  disabled={downloadMutation.isPending}
                >
                  다운로드
                </PFButton>
              ) : null}
            </li>
          ))}
        </ul>
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
