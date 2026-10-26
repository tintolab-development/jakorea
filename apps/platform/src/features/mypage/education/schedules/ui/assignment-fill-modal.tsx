import { useCallback, useMemo, useState } from 'react'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { parsePortalProgramId } from '@/features/program/api/mappers'
import { getProgramApplicationApiErrorMessage } from '@/features/program/lib/application-api-error'
import type { ProgramApplicationType } from '../../applications/api/types'
import type { EducationSurveyListEntry } from '../../surveys/lib/survey-list-types'
import {
  EMPTY_SURVEY_SIDECAR,
  type SurveySidecarState,
} from '../../surveys/lib/survey-sidecar'
import { writingFormDraftFromApplicationForm } from '@/features/program/lib/application-form-draft'
import { PFAlertModal, PFButton, PFModal, PFText } from '@/shared/ui'
import { VolunteerAssignmentPanelSkeleton } from '@/features/mypage/shared/ui'
import {
  buildUjatDocumentAnswers,
  buildUjatDocumentFileObjectIds,
  hasUjatDocumentSubmitPayload,
  validateUjatDocumentFill,
  type UjatDocumentAttachedFile,
} from '@/features/mypage/volunteer/ujat-schedules/lib/document-answers'
import { UjatEducationDocumentFormBody } from '@/features/mypage/volunteer/ujat-schedules/ui/document-form-body'
import type { EducationScheduleAssignment } from '../model/types'
import { getQueryRetryHttpStatus } from '@/shared/lib/query-retry'
import { hasRenderableAssignmentFormSchema } from '../api/assignment-client'
import {
  usePortalAssignmentFormBindingQuery,
  usePortalAssignmentFormResponseQuery,
  useRevisePortalAssignmentMutation,
  useSubmitPortalAssignmentMutation,
} from '../api/assignment-hooks'
import styles from '@/features/mypage/volunteer/ujat-schedules/ui/document-fill-modal.module.css'

type EducationAssignmentFillModalProps = {
  open: boolean
  assignment: EducationScheduleAssignment
  formEntry: EducationSurveyListEntry | null
  programId: string
  scheduleId: number | null
  applicationType: ProgramApplicationType | null | undefined
  applicationId: string | null | undefined
  onClose: () => void
}

function isRevisionStatus(status: EducationScheduleAssignment['status']): boolean {
  return status === 'submitted' || status === 'feedback'
}

export function EducationAssignmentFillModal({
  open,
  assignment,
  formEntry,
  programId,
  scheduleId,
  applicationType,
  applicationId,
  onClose,
}: EducationAssignmentFillModalProps) {
  const numericProgramId = parsePortalProgramId(programId)
  const bindingId =
    formEntry?.bindingId != null && formEntry.bindingId > 0 ? formEntry.bindingId : null
  const revision = isRevisionStatus(assignment.status)
  const responseId = assignment.formResponseId ?? null
  const bindingQuery = usePortalAssignmentFormBindingQuery(numericProgramId, bindingId, {
    enabled: open && bindingId != null,
  })
  const responseQuery = usePortalAssignmentFormResponseQuery(responseId, {
    enabled: open && revision,
  })
  const submitMutation = useSubmitPortalAssignmentMutation(applicationType, applicationId)
  const reviseMutation = useRevisePortalAssignmentMutation(applicationType, applicationId)

  const responseForm = responseQuery.detail?.form ?? null
  const existingAnswers = responseQuery.detail?.answers ?? null
  const templateVersionId =
    bindingQuery.document?.templateVersionId ?? formEntry?.templateVersionId ?? null
  const seedDraft = useMemo(() => {
    if (!open) return null
    if (revision && responseQuery.isLoading) return null
    return writingFormDraftFromApplicationForm(
      responseForm ?? bindingQuery.document?.form ?? null,
      existingAnswers,
    )
  }, [bindingQuery.document?.form, existingAnswers, open, responseForm, responseQuery.isLoading, revision])
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
    String(bindingId ?? ''),
    String(responseId ?? ''),
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

  if (seededKey !== seedKey) {
    setSeededKey(seedKey)
    setDraft(seedDraft)
    setSidecar(EMPTY_SURVEY_SIDECAR)
    setFiles(seedFiles)
  }

  const updateParagraph = useCallback<FormUpdateParagraph>((id, updater) => {
    setDraft(previous =>
      previous
        ? {
            ...previous,
            paragraphs: previous.paragraphs.map(paragraph =>
              paragraph.id === id ? updater(paragraph) : paragraph,
            ),
          }
        : previous,
    )
  }, [])

  const handleSubmit = () => {
    if (
      !draft ||
      numericProgramId == null ||
      bindingId == null ||
      scheduleId == null ||
      scheduleId <= 0 ||
      templateVersionId == null
    ) {
      return
    }
    if (revision ? formEntry?.canResubmit !== true : formEntry?.canSubmit !== true) {
      return
    }

    if (revision && responseId == null) {
      setAlertTitle('제출본 확인')
      setAlertDescription('기존 과제 제출본을 확인하지 못했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.')
      setAlertOpen(true)
      return
    }

    const validation = validateUjatDocumentFill(draft, sidecar, files)
    if (!validation.ok) {
      setAlertTitle('입력 확인')
      setAlertDescription(validation.message)
      setAlertOpen(true)
      return
    }

    const answers = buildUjatDocumentAnswers(
      draft,
      sidecar,
      bindingQuery.document?.form ?? null,
    )
    const fileObjectIdsByQuestion = buildUjatDocumentFileObjectIds(files)
    if (!hasUjatDocumentSubmitPayload(answers, files)) {
      setAlertTitle('입력 확인')
      setAlertDescription('제출할 내용이 없습니다.')
      setAlertOpen(true)
      return
    }

    if (revision && responseId != null) {
      reviseMutation.mutate(
        { formResponseId: responseId, body: { answers, fileObjectIdsByQuestion } },
        {
          onSuccess: () => {
            setAlertTitle('안내')
            setAlertDescription('과제 수정 제출이 완료되었습니다.')
            setCloseAfterAlert(true)
            setAlertOpen(true)
          },
          onError: error => {
            setAlertTitle('제출 실패')
            setAlertDescription(
              getProgramApplicationApiErrorMessage(
                error,
                '과제 수정 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.',
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
        programId: numericProgramId,
        bindingId,
        body: {
          templateVersionId,
          programId: numericProgramId,
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
          setAlertDescription('과제 제출이 완료되었습니다.')
          setCloseAfterAlert(true)
          setAlertOpen(true)
        },
        onError: error => {
          setAlertTitle('제출 실패')
          setAlertDescription(
            getProgramApplicationApiErrorMessage(
              error,
              '과제 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.',
            ),
          )
          setAlertOpen(true)
        },
      },
    )
  }

  const loading =
    (bindingQuery.enabled && bindingQuery.isLoading) ||
    (responseQuery.enabled && responseQuery.isLoading)
  const forbidden =
    getQueryRetryHttpStatus(bindingQuery.error) === 403 ||
    getQueryRetryHttpStatus(responseQuery.error) === 403
  const loadError =
    (bindingQuery.enabled && bindingQuery.isError) ||
    (responseQuery.enabled && responseQuery.isError)
  const sourceForm = responseForm ?? bindingQuery.document?.form ?? null
  const hasSchema =
    seedDraft != null &&
    (hasRenderableAssignmentFormSchema(sourceForm) || seedDraft.paragraphs.length > 0)
  const submitting = submitMutation.isPending || reviseMutation.isPending
  const missingForm = open && (formEntry == null || bindingId == null)

  return (
    <>
      <PFModal
        open={open}
        onClose={onClose}
        title={`과제 ${revision ? '수정' : '제출'}`}
        size="lg"
      >
        <div className={styles.body}>
          {missingForm ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              연결된 과제 양식을 찾을 수 없습니다.
            </PFText>
          ) : loading ? (
            <VolunteerAssignmentPanelSkeleton statusMessage="과제 양식을 불러오는 중입니다." />
          ) : loadError ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {forbidden
                ? '과제 양식에 접근할 권한이 없습니다.'
                : '과제 양식을 불러오지 못했습니다.'}
            </PFText>
          ) : !hasSchema || !draft ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              과제 양식을 불러오지 못했습니다.
            </PFText>
          ) : (
            <>
              <UjatEducationDocumentFormBody
                draft={draft}
                programTitle={formEntry?.title || '과제'}
                onUpdateParagraph={updateParagraph}
                sidecar={sidecar}
                onSidecarChange={setSidecar}
                files={files}
                onFilesChange={setFiles}
              />
              <div className={styles.actions}>
                <PFButton
                  type="button"
                  variant="primary"
                  size="xlarge"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? '제출 중' : revision ? '수정 제출하기' : '제출하기'}
                </PFButton>
              </div>
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
