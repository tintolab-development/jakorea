import { useCallback, useMemo, useState } from 'react'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { writingFormDraftFromApplicationForm } from '@/features/program/lib/application-form-draft'
import { getProgramApplicationApiErrorMessage } from '@/features/program/lib/application-api-error'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import { downloadUjatEducationDocumentFile } from '../api/education-documents-client'
import {
  EMPTY_SURVEY_SIDECAR,
  type SurveySidecarState,
} from '@/features/mypage/education/surveys/lib/survey-sidecar'
import { PFAlertModal, PFButton, PFModal, PFText } from '@/shared/ui'
import { VolunteerAssignmentPanelSkeleton } from '@/features/mypage/shared/ui'
import {
  useReviseUjatEducationDocumentMutation,
  useSubmitUjatEducationDocumentMutation,
  useUjatEducationFormBindingQuery,
  useUjatEducationFormResponseQuery,
} from '../api/education-documents-hooks'
import {
  buildUjatDocumentAnswers,
  buildUjatDocumentFileObjectIds,
  hasUjatDocumentSubmitPayload,
  validateUjatDocumentFill,
  type UjatDocumentAttachedFile,
} from '../lib/document-answers'
import {
  canEnterUjatEducationDocumentRevise,
  canEnterUjatEducationDocumentWrite,
  ujatEducationDocumentTitle,
  type UjatEducationDocumentKind,
  type UjatEducationDocumentSlot,
} from '../lib/documents'
import type { UjatDocumentFillMode } from './document-slot'
import {
  UjatEducationDocumentFormBody,
  UjatLegacyEducationDocumentResponseBody,
} from './document-form-body'
import styles from './document-fill-modal.module.css'

type UjatEducationDocumentFillModalProps = {
  open: boolean
  mode: UjatDocumentFillMode | null
  kind: UjatEducationDocumentKind | null
  slot: UjatEducationDocumentSlot | null
  programId: number | null
  scheduleId: number | null
  applicationType: ProgramApplicationType | null | undefined
  applicationId: string | null | undefined
  onClose: () => void
}

export function UjatEducationDocumentFillModal({
  open,
  mode,
  kind,
  slot,
  programId,
  scheduleId,
  applicationType,
  applicationId,
  onClose,
}: UjatEducationDocumentFillModalProps) {
  const title = kind ? ujatEducationDocumentTitle(kind) : '교육 문서'
  const readOnly = mode === 'view'
  const writeAllowed = slot != null && mode === 'write' && canEnterUjatEducationDocumentWrite(slot)
  const reviseAllowed =
    slot != null && mode === 'revise' && canEnterUjatEducationDocumentRevise(slot)
  const canLoadBinding =
    open &&
    slot != null &&
    programId != null &&
    programId > 0 &&
    slot.programFormBindingId != null &&
    slot.programFormBindingId > 0 &&
    slot.templateVersionId != null &&
    slot.templateVersionId > 0 &&
    (writeAllowed || reviseAllowed)
  const needsExistingResponse =
    open &&
    slot?.formResponseId != null &&
    slot.formResponseId > 0 &&
    (mode === 'revise' || mode === 'view')

  const bindingQuery = useUjatEducationFormBindingQuery(
    programId,
    slot?.programFormBindingId ?? null,
    { enabled: canLoadBinding },
  )
  const responseQuery = useUjatEducationFormResponseQuery(slot?.formResponseId ?? null, {
    enabled: needsExistingResponse,
  })
  const submitMutation = useSubmitUjatEducationDocumentMutation(applicationType, applicationId)
  const reviseMutation = useReviseUjatEducationDocumentMutation(applicationType, applicationId)

  const existingAnswers = responseQuery.detail?.answers ?? null
  const responseForm = responseQuery.detail?.form ?? null
  const seedDraft = useMemo(() => {
    if (!open) return null
    if (needsExistingResponse && responseQuery.isLoading) return null
    const form = readOnly ? responseForm : responseForm ?? bindingQuery.document?.form ?? null
    return writingFormDraftFromApplicationForm(
      form,
      existingAnswers,
    )
  }, [
    bindingQuery.document?.form,
    existingAnswers,
    needsExistingResponse,
    open,
    readOnly,
    responseForm,
    responseQuery.isLoading,
  ])
  const seedFiles = useMemo<UjatDocumentAttachedFile[]>(
    () =>
      (responseQuery.detail?.files ?? []).map(file => ({
        questionKey: file.questionKey ?? '',
        fileObjectId: file.fileObjectId,
        fileName: file.originalFileName,
        downloadable: file.downloadable,
      })),
    [responseQuery.detail?.files],
  )
  const seedKey = [
    open ? 'open' : 'closed',
    String(slot?.programFormBindingId ?? ''),
    String(slot?.formResponseId ?? ''),
    mode ?? '',
    seedDraft ? 'ready' : 'pending',
    String(seedFiles.length),
  ].join(':')

  const [draft, setDraft] = useState<WritingFormDraft | null>(seedDraft)
  const [sidecar, setSidecar] = useState<SurveySidecarState>(EMPTY_SURVEY_SIDECAR)
  const [files, setFiles] = useState<UjatDocumentAttachedFile[]>(seedFiles)
  const [seededKey, setSeededKey] = useState(seedKey)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('안내')
  const [alertDescription, setAlertDescription] = useState('')
  const [closeAfterAlert, setCloseAfterAlert] = useState(false)
  const [downloadingFileObjectId, setDownloadingFileObjectId] = useState<number | null>(null)

  if (seededKey !== seedKey) {
    setSeededKey(seedKey)
    setDraft(seedDraft)
    setSidecar(EMPTY_SURVEY_SIDECAR)
    setFiles(seedFiles)
  }

  const updateParagraph = useCallback<FormUpdateParagraph>((id, updater) => {
    setDraft(prev =>
      prev
        ? {
            ...prev,
            paragraphs: prev.paragraphs.map(paragraph =>
              paragraph.id === id ? updater(paragraph) : paragraph,
            ),
          }
        : prev,
    )
  }, [])

  const handleSubmit = () => {
    if (!slot || !kind || programId == null || scheduleId == null || !draft) return
    if (readOnly) return
    if (mode === 'write' && !writeAllowed) return
    if (mode === 'revise' && !reviseAllowed) return
    if (mode === 'write' && slot.formResponseId != null) return

    const validation = validateUjatDocumentFill(draft, sidecar, files)
    if (!validation.ok) {
      setAlertTitle('입력 확인')
      setAlertDescription(validation.message)
      setAlertOpen(true)
      return
    }

    const answers = buildUjatDocumentAnswers(draft, sidecar, bindingQuery.document?.form ?? null)
    const fileObjectIdsByQuestion = buildUjatDocumentFileObjectIds(files)
    if (!hasUjatDocumentSubmitPayload(answers, files)) {
      setAlertTitle('입력 확인')
      setAlertDescription('제출할 내용이 없습니다.')
      setAlertOpen(true)
      return
    }

    const bindingId = slot.programFormBindingId
    const templateVersionId = slot.templateVersionId
    if (bindingId == null || templateVersionId == null) return

    if (mode === 'revise' && slot.formResponseId != null) {
      reviseMutation.mutate(
        {
          formResponseId: slot.formResponseId,
          scheduleId,
          body: { answers, fileObjectIdsByQuestion },
        },
        {
          onSuccess: () => {
            setAlertTitle('안내')
            setAlertDescription(`${title} 수정 제출이 완료되었습니다.`)
            setCloseAfterAlert(true)
            setAlertOpen(true)
          },
          onError: error => {
            setAlertTitle('제출 실패')
            setAlertDescription(
              getProgramApplicationApiErrorMessage(
                error,
                `${title} 수정 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.`,
              ),
            )
            setAlertOpen(true)
          },
        },
      )
      return
    }

    submitMutation.mutate(
      {
        programId,
        bindingId,
        scheduleId,
        body: {
          templateVersionId,
          programId,
          programFormBindingId: bindingId,
          programScheduleId: scheduleId,
          contextType: 'PROGRAM_SCHEDULE',
          contextId: scheduleId,
          answers,
          fileObjectIdsByQuestion,
        },
      },
      {
        onSuccess: () => {
          setAlertTitle('안내')
          setAlertDescription(`${title} 제출이 완료되었습니다.`)
          setCloseAfterAlert(true)
          setAlertOpen(true)
        },
        onError: error => {
          setAlertTitle('제출 실패')
          setAlertDescription(
            getProgramApplicationApiErrorMessage(
              error,
              `${title} 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.`,
            ),
          )
          setAlertOpen(true)
        },
      },
    )
  }

  const handleDownloadFile = useCallback(async (file: UjatDocumentAttachedFile) => {
    if (!readOnly || file.downloadable !== true || file.fileObjectId <= 0) return
    setDownloadingFileObjectId(file.fileObjectId)
    try {
      await downloadUjatEducationDocumentFile({
        fileObjectId: file.fileObjectId,
        originalFileName: file.fileName,
        downloadable: file.downloadable,
      })
    } catch (error) {
      setAlertTitle('다운로드 실패')
      setAlertDescription(
        getProgramApplicationApiErrorMessage(
          error,
          '첨부파일을 다운로드하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        ),
      )
      setAlertOpen(true)
    } finally {
      setDownloadingFileObjectId(null)
    }
  }, [readOnly])

  const loading =
    (canLoadBinding && bindingQuery.isLoading) ||
    (needsExistingResponse && responseQuery.isLoading)
  const loadError =
    (canLoadBinding && bindingQuery.isError) || (needsExistingResponse && responseQuery.isError)
  const missingPublishedTemplate =
    open &&
    !readOnly &&
    slot != null &&
    (slot.templateVersionId == null || slot.programFormBindingId == null)
  const submitting = submitMutation.isPending || reviseMutation.isPending

  return (
    <>
      <PFModal
        open={open}
        onClose={onClose}
        title={mode === 'view' ? `${title} 보기` : `${title} ${mode === 'revise' ? '수정' : '작성'}`}
        size="lg"
      >
        <div className={styles.body}>
          {missingPublishedTemplate ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {title} 양식이 아직 준비되지 않았습니다.
            </PFText>
          ) : loading ? (
            <VolunteerAssignmentPanelSkeleton statusMessage={`${title}을 불러오는 중입니다.`} />
          ) : loadError ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {getProgramApplicationApiErrorMessage(
                bindingQuery.error ?? responseQuery.error,
                `${title}을 불러오지 못했습니다.`,
              )}
            </PFText>
          ) : readOnly && responseQuery.detail?.form === null ? (
            <UjatLegacyEducationDocumentResponseBody
              answers={responseQuery.detail.answers}
              files={files}
              onDownloadFile={handleDownloadFile}
              downloadingFileObjectId={downloadingFileObjectId}
            />
          ) : !seedDraft || !draft ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {title} 양식을 표시할 수 없습니다.
            </PFText>
          ) : (
            <>
              <UjatEducationDocumentFormBody
                draft={draft}
                programTitle={title}
                onUpdateParagraph={updateParagraph}
                sidecar={sidecar}
                onSidecarChange={setSidecar}
                files={files}
                onFilesChange={setFiles}
                readOnly={readOnly}
                onDownloadFile={handleDownloadFile}
                downloadingFileObjectId={downloadingFileObjectId}
              />
              {readOnly ? null : (
                <div className={styles.actions}>
                  <PFButton
                    type="button"
                    variant="primary"
                    size="xlarge"
                    disabled={submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? '제출 중' : mode === 'revise' ? '수정 제출하기' : '제출하기'}
                  </PFButton>
                </div>
              )}
            </>
          )}
        </div>
      </PFModal>
      <PFAlertModal
        open={alertOpen}
        title={alertTitle}
        description={alertDescription}
        onConfirm={() => {
          setAlertOpen(false)
          if (closeAfterAlert) {
            setCloseAfterAlert(false)
            onClose()
          }
        }}
      />
    </>
  )
}
