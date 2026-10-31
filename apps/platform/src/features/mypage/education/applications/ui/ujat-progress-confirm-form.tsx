import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import { FormTemplateHost, ParagraphCard } from '@/features/form-template'
import {
  focusIncompleteApplicationField,
  resolveUjatInstitutionApplyIncomplete,
} from '@/features/program/lib/ujat-institution-apply-incomplete'
import { coerceApplicationFormDocument } from '@/features/program/lib/application-form-draft'
import { resolveUjatProgressConfirmPreferredEducationScheduleOptions } from '@/features/program/lib/ujat-preferred-education-schedule-options'
import {
  ApplyUjatInstitutionBasicInfo,
  emptyUjatInstitutionBasicInfo,
  ujatInstitutionBasicInfoAnswerFromValues,
  ujatInstitutionBasicInfoValuesFromDraftAnswer,
  type ApplyUjatInstitutionBasicInfoValues,
} from '@/features/program/ui/apply-ujat-institution-basic-info/apply-ujat-institution-basic-info'
import {
  ApplyUjatInstitutionGradeInfo,
  appendUjatInstitutionGradeBlock,
  emptyUjatInstitutionGradeBlocks,
  ujatInstitutionGradeAnswerFromValues,
  ujatInstitutionGradeValuesFromDraftAnswer,
} from '@/features/program/ui/apply-ujat-institution-grade-info/apply-ujat-institution-grade-info'
import {
  ApplyUjatInstitutionClassTime,
  appendUjatInstitutionClassTimeBlock,
  emptyUjatInstitutionClassTimeBlocks,
  ujatInstitutionClassTimeAnswerFromValues,
  ujatInstitutionClassTimeValuesFromDraftAnswer,
} from '@/features/program/ui/apply-ujat-institution-class-time/apply-ujat-institution-class-time'
import {
  ApplyUjatInstitutionPreferredSchedule,
  ujatInstitutionPreferredScheduleAnswerFromValues,
  ujatInstitutionPreferredScheduleValuesFromDraftAnswer,
} from '@/features/program/ui/apply-ujat-institution-preferred-schedule/apply-ujat-institution-preferred-schedule'
import { ApplyPreferredScheduleAddButton } from '@/features/program/ui/apply-preferred-schedule/apply-preferred-schedule'
import { institutionGuidanceParagraphHeading } from '@/features/program/ui/apply-institution-guidance/institution-guidance-paragraph-heading'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { ApplyUjatInstitutionSubmitConfirmation } from '@/features/program/ui/apply-ujat-institution-submit-confirmation/apply-ujat-institution-submit-confirmation'
import { formatDisplayDateTime } from '@/shared/lib'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import type { ProgramApplicationType } from '../api/types'
import type { EducationUjatTemporarySchedule } from '../model/types'
import { usePortalMeFormBindingRender } from '../api/hooks'
import { patchOrganizationGuidanceAnswers } from '../api/institution-guidance-client'
import { platformQueryKeys } from '@/shared/api/query-keys'
import {
  buildUjatAcknowledgedScheduleNavigateState,
  canAcknowledgeDisplayedUjatSchedule,
  isPositiveIntegerRevision,
} from '../lib/ujat-acknowledged-schedule'
import { educationInstitutionGuidanceWritePath } from '../lib/guidance-path'
import {
  resolveInstitutionGuidanceErrorMessage,
  UJAT_STALE_REVISION_ALERT_MESSAGE,
} from '../lib/institution-guidance-errors'
import { UJAT_PROGRESS_CONFIRM_COPY as COPY } from '../lib/ujat-progress-confirm-copy'
import styles from './institution-guidance-write-form.module.css'

type UjatProgressConfirmFormProps = {
  applicationId: string
  applicationType: ProgramApplicationType
  programId: string
  formBindingId?: number
  answers: Record<string, unknown> | undefined
  isRevision: boolean
  temporarySchedule?: EducationUjatTemporarySchedule
  assignmentRevision?: number
  /** GET 상세 `supplement.ujat.preferredEducationDateOptions` — render 후보 없을 때 SSOT */
  preferredEducationDateOptions?: readonly unknown[] | null
}

function pickAnswer(answers: Record<string, unknown> | undefined, keys: readonly string[]): unknown {
  if (!answers) return undefined
  for (const key of keys) {
    if (key in answers) return answers[key]
  }
  return undefined
}

export function UjatTemporaryScheduleSummary({
  temporarySchedule,
}: {
  temporarySchedule?: EducationUjatTemporarySchedule
}) {
  const slots = (temporarySchedule?.slots ?? []).filter(slot => slot.scheduleId != null)
  if (slots.length === 0) return null

  return (
    <ParagraphCard
      dataParagraphId="ujat-temporary-assigned-schedule"
      editableHeading={institutionGuidanceParagraphHeading(
        COPY.temporarySchedule.title,
        COPY.temporarySchedule.description,
        { required: false },
      )}
    >
      <div className={styles.assignedScheduleList} aria-label="관리자 배정 일정 목록">
        {slots.map((slot, index) => {
          const scheduleDate = formatDisplayDateTime(slot.scheduleStartAt)
          const gradeLabel = slot.grade
            ? slot.grade.endsWith('학년')
              ? slot.grade
              : `${slot.grade}학년`
            : null
          return (
            <div
              key={`${slot.scheduleId}-${index}`}
              className={styles.assignedScheduleItem}
              role="listitem"
            >
              <PFText as="p" typo="bd-md-sb" color="black">
                {scheduleDate || '일정 정보 없음'}
              </PFText>
              <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                {[
                  gradeLabel,
                  slot.className,
                  // 0은 CMS 임시배정 미기입 계약값 — "0명"으로 오해하지 않도록 생략
                  slot.studentCount != null && slot.studentCount > 0
                    ? `${slot.studentCount}명`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || '학급 정보 없음'}
              </PFText>
            </div>
          )
        })}
      </div>
    </ParagraphCard>
  )
}

export function UjatProgressConfirmForm({
  applicationId,
  applicationType,
  programId,
  formBindingId,
  answers,
  isRevision,
  temporarySchedule,
  assignmentRevision,
  preferredEducationDateOptions,
}: UjatProgressConfirmFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const formRender = usePortalMeFormBindingRender(programId, formBindingId)
  const preferredOptions = useMemo(() => {
    const document = coerceApplicationFormDocument(formRender.document)
    return resolveUjatProgressConfirmPreferredEducationScheduleOptions({
      runtimeContext: document?.runtimeContext ?? formRender.document?.runtimeContext,
      supplementPreferredEducationDateOptions: preferredEducationDateOptions,
    })
  }, [formRender.document, preferredEducationDateOptions])

  const [basicInfo, setBasicInfo] = useState<ApplyUjatInstitutionBasicInfoValues>(
    () =>
      ujatInstitutionBasicInfoValuesFromDraftAnswer(
        pickAnswer(answers, [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo]),
      ) ?? emptyUjatInstitutionBasicInfo(),
  )
  const [gradeBlocks, setGradeBlocks] = useState(
    () =>
      ujatInstitutionGradeValuesFromDraftAnswer(
        pickAnswer(answers, [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo]),
      ) ?? emptyUjatInstitutionGradeBlocks(),
  )
  const [classTimeBlocks, setClassTimeBlocks] = useState(
    () =>
      ujatInstitutionClassTimeValuesFromDraftAnswer(
        pickAnswer(answers, [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime]),
      ) ?? emptyUjatInstitutionClassTimeBlocks(),
  )
  const [preferredIds, setPreferredIds] = useState(
    () =>
      ujatInstitutionPreferredScheduleValuesFromDraftAnswer(
        pickAnswer(answers, [
          UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule,
        ]),
      ) ?? [],
  )
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [incompleteField, setIncompleteField] = useState<ReturnType<
    typeof resolveUjatInstitutionApplyIncomplete
  >>(null)
  const submittingRef = useRef(false)
  const formRootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setConfirmed(false)
  }, [assignmentRevision, temporarySchedule])

  useEffect(() => {
    focusIncompleteApplicationField(formRootRef.current, incompleteField)
    return () => {
      formRootRef.current
        ?.querySelectorAll<HTMLElement>('[data-application-error="true"]')
        .forEach(element => {
          delete element.dataset.applicationError
        })
    }
  }, [incompleteField])

  const handleContinue = async () => {
    if (submittingRef.current || saving) return
    const incomplete = resolveUjatInstitutionApplyIncomplete({
      basicInfo,
      gradeBlocks,
      classTimeBlocks,
      preferredIds,
      preferredOptions,
      confirmed,
    })
    if (incomplete) {
      setIncompleteField(incomplete)
      setAlertMessage(incomplete.message)
      return
    }
    if (!isRemoteApiConfigured()) {
      setAlertMessage('API가 설정되지 않아 저장할 수 없습니다.')
      return
    }
    if (applicationType !== 'ORGANIZATION') {
      setAlertMessage('기관 프로그램 신청만 진행할 수 있습니다.')
      return
    }
    const revisionAtConfirm = assignmentRevision
    if (
      !canAcknowledgeDisplayedUjatSchedule({
        assignmentRevision: revisionAtConfirm,
        temporarySchedule,
      })
    ) {
      setAlertMessage(
        '관리자 배정 일정을 확인할 수 없습니다. 잠시 후 다시 시도하거나 담당자에게 문의해 주세요.',
      )
      return
    }
    if (!isPositiveIntegerRevision(revisionAtConfirm)) {
      setAlertMessage(
        '배정 일정 확인 정보가 올바르지 않습니다. 화면을 새로고침한 후 다시 확인해 주세요.',
      )
      return
    }
    submittingRef.current = true
    setSaving(true)
    try {
      await patchOrganizationGuidanceAnswers(applicationId, {
        answers: {
          [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo]:
            ujatInstitutionBasicInfoAnswerFromValues(basicInfo),
          [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo]:
            ujatInstitutionGradeAnswerFromValues(gradeBlocks),
          [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime]:
            ujatInstitutionClassTimeAnswerFromValues(classTimeBlocks, gradeBlocks),
          [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule]:
            ujatInstitutionPreferredScheduleAnswerFromValues(preferredIds, preferredOptions),
        },
      })
      const detailQueryKey = platformQueryKeys.mypage.programApplications.detail(
        applicationType,
        applicationId,
      )
      await queryClient.refetchQueries({ queryKey: detailQueryKey, exact: true })
      const latest = queryClient.getQueryData<{
        supplement?: { ujat?: { assignmentRevision?: number } }
      }>(detailQueryKey)
      const latestRevision = latest?.supplement?.ujat?.assignmentRevision
      if (
        typeof latestRevision === 'number' &&
        Number.isInteger(latestRevision) &&
        latestRevision !== revisionAtConfirm
      ) {
        setAlertMessage(UJAT_STALE_REVISION_ALERT_MESSAGE)
        return
      }
      navigate(educationInstitutionGuidanceWritePath(applicationId, applicationType), {
        state: buildUjatAcknowledgedScheduleNavigateState({
          applicationId,
          assignmentRevision: revisionAtConfirm,
        }),
      })
    } catch (error) {
      setAlertMessage(resolveInstitutionGuidanceErrorMessage(error))
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  return (
    <>
      <FormTemplateHost surface="platformUser">
        <div ref={formRootRef} className={styles.paragraphStack}>
          <ParagraphCard
            dataParagraphId={UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo}
            editableHeading={institutionGuidanceParagraphHeading(
              COPY.basicInfo.title,
              COPY.basicInfo.description,
              { titleLeading: COPY.basicInfo.leading },
            )}
          >
            <ApplyUjatInstitutionBasicInfo value={basicInfo} onChange={setBasicInfo} />
          </ParagraphCard>

          <ParagraphCard
            dataParagraphId={UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo}
            editableHeading={institutionGuidanceParagraphHeading(
              COPY.gradeInfo.title,
              COPY.gradeInfo.description,
              {
                titleLeading: COPY.gradeInfo.leading,
                titleTrailing: (
                  <ApplyPreferredScheduleAddButton
                    onClick={() => setGradeBlocks(appendUjatInstitutionGradeBlock)}
                  >
                    {COPY.gradeInfo.addButton}
                  </ApplyPreferredScheduleAddButton>
                ),
              },
            )}
          >
            <ApplyUjatInstitutionGradeInfo value={gradeBlocks} onChange={setGradeBlocks} />
          </ParagraphCard>

          <ParagraphCard
            dataParagraphId={UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime}
            editableHeading={institutionGuidanceParagraphHeading(
              COPY.classTime.title,
              COPY.classTime.description,
              {
                titleLeading: COPY.classTime.leading,
                titleTrailing: (
                  <ApplyPreferredScheduleAddButton
                    onClick={() => setClassTimeBlocks(appendUjatInstitutionClassTimeBlock)}
                  >
                    {COPY.classTime.addButton}
                  </ApplyPreferredScheduleAddButton>
                ),
              },
            )}
          >
            <ApplyUjatInstitutionClassTime
              value={classTimeBlocks}
              onChange={setClassTimeBlocks}
              gradeBlocks={gradeBlocks}
            />
          </ParagraphCard>

          <ParagraphCard
            dataParagraphId={UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule}
            editableHeading={institutionGuidanceParagraphHeading(
              COPY.preferredSchedule.title,
              COPY.preferredSchedule.description,
              { titleLeading: COPY.preferredSchedule.leading },
            )}
          >
            <ApplyUjatInstitutionPreferredSchedule
              options={preferredOptions}
              selectedIds={preferredIds}
              onChange={setPreferredIds}
              optionsReady={!formRender.isLoading}
            />
          </ParagraphCard>

          <ParagraphCard
            dataParagraphId={UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.submitConfirmation}
            editableHeading={institutionGuidanceParagraphHeading(
              COPY.confirm.title,
              COPY.confirm.description,
              { titleLeading: COPY.confirm.leading },
            )}
          >
            <ApplyUjatInstitutionSubmitConfirmation
              control="radio"
              label={COPY.confirm.radioLabel}
              checked={confirmed}
              onCheckedChange={setConfirmed}
            />
          </ParagraphCard>
        </div>
      </FormTemplateHost>

      <div className={styles.actions}>
        <PFButton
          type="button"
          size="xlarge"
          width={240}
          disabled={saving}
          onClick={() => {
            void handleContinue()
          }}
        >
          {saving
            ? COPY.cta.saving
            : isRevision
              ? COPY.cta.continueRevision
              : COPY.cta.continue}
        </PFButton>
      </div>

      <PFAlertModal
        open={alertMessage != null}
        title="안내"
        description={alertMessage ?? undefined}
        onConfirm={() => setAlertMessage(null)}
      />
    </>
  )
}
