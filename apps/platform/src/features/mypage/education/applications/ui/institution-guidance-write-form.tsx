import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION,
  INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION,
} from '@jakorea/form-schema/program-application'
import type { ProgramDetailCase } from '@/features/program'
import { PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE } from '@/features/program/lib/program-apply-messages'
import {
  ApplyInstitutionGuidance,
  type ApplyInstitutionGuidanceAnswers,
} from '@/features/program/ui/apply-institution-guidance/apply-institution-guidance'
import {
  ApplyFormRadioGroup,
} from '@/features/program/ui/apply-form-radio'
import {
  emptyUjatInstitutionGuidanceExtras,
  UJAT_CLASSROOM_SETTING_FIELD,
  UJAT_CLASSROOM_SETTING_OPTIONS,
  UJAT_SNACK_AVAILABILITY_OPTIONS,
  UJAT_SNACK_FIELD,
  type ApplyUjatInstitutionGuidanceExtras,
} from '@/features/program/ui/apply-institution-guidance/ujat-institution-guidance-fields'
import {
  ApplyInstitutionSexOffenseInquiry,
  ApplyInstitutionSexOffenseSubmission,
  ApplyInstitutionSexOffenseUjatWrite,
  shouldShowSexOffenseInquiry,
  type ApplyInstitutionSexOffenseValues,
} from '@/features/program/ui/apply-institution-sex-offense/apply-institution-sex-offense'
import type { ProgramApplicationType } from '../api/types'
import type { PortalProgramApplicationDetail } from '../api/types'
import {
  useConfirmUjatTemporaryScheduleMutation,
  usePatchOrganizationGuidanceAnswersMutation,
} from '../api/institution-guidance-hooks'
import type { TeacherInstitutionGuidanceFormState } from '../lib/institution-guidance-from-answers'
import {
  isUjatStaleRevisionError,
  resolveInstitutionGuidanceErrorMessage,
  resolveUjatTemporaryScheduleConfirmErrorMessage,
  UJAT_STALE_REVISION_ALERT_MESSAGE,
} from '../lib/institution-guidance-errors'
import { UjatTemporaryScheduleSummary } from './ujat-progress-confirm-form'
import type { EducationUjatTemporarySchedule } from '../model/types'
import {
  resolveOrganizationGuidancePatchBlockedMessage,
  type OrganizationGuidancePatchPortalContext,
} from '../lib/institution-guidance-patch-readiness'
import {
  educationInstitutionGuidanceApplicationTabPath,
  educationUjatProgressConfirmPath,
} from '../lib/guidance-path'
import {
  isValidUjatAcknowledgedScheduleForApplication,
  type UjatAcknowledgedSchedule,
  UJAT_SCHEDULE_RECONFIRM_REQUIRED_MESSAGE,
} from '../lib/ujat-acknowledged-schedule'
import { hasInstitutionGuidanceDraftContent } from '../lib/teacher-institution-guidance'
import { isTeacherInstitutionGuidanceSubmitIncomplete } from '../lib/validate-institution-guidance'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { FormTemplateHost, ParagraphCard } from '@/features/form-template'
import { institutionGuidanceParagraphHeading } from '@/features/program/ui/apply-institution-guidance/institution-guidance-paragraph-heading'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import styles from './institution-guidance-write-form.module.css'

type EducationInstitutionGuidanceWriteFormProps = {
  applicationId: string
  applicationType: ProgramApplicationType
  detailCase: ProgramDetailCase | undefined
  initialState: TeacherInstitutionGuidanceFormState
  /** remote PATCH 전 Portal 신청 상세 기준 사전 검사 */
  portalPatchContext?: OrganizationGuidancePatchPortalContext
  variant?: 'general' | 'ujat'
  isEdit?: boolean
  submitPeriodLabel?: string
  ujatAcknowledgedSchedule?: UjatAcknowledgedSchedule | null
  scheduleRevisionDrift?: boolean
  temporarySchedule?: EducationUjatTemporarySchedule
}

export function EducationInstitutionGuidanceWriteForm({
  applicationId,
  applicationType,
  detailCase,
  initialState,
  portalPatchContext,
  variant = 'general',
  submitPeriodLabel,
  ujatAcknowledgedSchedule,
  scheduleRevisionDrift = false,
  temporarySchedule,
}: EducationInstitutionGuidanceWriteFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isUjat = variant === 'ujat'
  const [guidance, setGuidance] = useState<ApplyInstitutionGuidanceAnswers>(initialState.guidance)
  const [sexOffense, setSexOffense] = useState<ApplyInstitutionSexOffenseValues>(
    initialState.sexOffense,
  )
  const [ujatExtras, setUjatExtras] = useState<ApplyUjatInstitutionGuidanceExtras>(
    initialState.ujatExtras ?? emptyUjatInstitutionGuidanceExtras(),
  )
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [afterAlertPath, setAfterAlertPath] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const patchGuidanceMutation = usePatchOrganizationGuidanceAnswersMutation(
    applicationType,
    applicationId,
  )
  const confirmUjatTemporaryScheduleMutation = useConfirmUjatTemporaryScheduleMutation(
    applicationType,
    applicationId,
  )

  const submitLabel = isUjat
    ? '제출하기'
    : hasInstitutionGuidanceDraftContent(initialState.guidance)
      ? '수정하기'
      : '작성하기'

  const handleSubmit = async () => {
    if (
      submittingRef.current ||
      patchGuidanceMutation.isPending ||
      confirmUjatTemporaryScheduleMutation.isPending
    ) {
      return
    }
    const nextSexOffense = isUjat
      ? { ...sexOffense, submissionRequest: sexOffense.submissionRequest || 'request' }
      : sexOffense
    const state: TeacherInstitutionGuidanceFormState = {
      guidance,
      sexOffense: nextSexOffense,
      ujatExtras: isUjat ? ujatExtras : undefined,
    }
    if (
      isTeacherInstitutionGuidanceSubmitIncomplete(guidance, nextSexOffense, {
        ujat: isUjat,
        ujatExtras: isUjat ? ujatExtras : undefined,
      })
    ) {
      setAlertMessage(PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE)
      return
    }

    if (!isRemoteApiConfigured()) {
      setAlertMessage('API가 설정되지 않아 저장할 수 없습니다.')
      return
    }
    if (isUjat) {
      if (scheduleRevisionDrift) {
        setAlertMessage(UJAT_STALE_REVISION_ALERT_MESSAGE)
        setAfterAlertPath(educationUjatProgressConfirmPath(applicationId, applicationType))
        return
      }
      if (
        !isValidUjatAcknowledgedScheduleForApplication(
          ujatAcknowledgedSchedule,
          applicationId,
        )
      ) {
        setAlertMessage(UJAT_SCHEDULE_RECONFIRM_REQUIRED_MESSAGE)
        setAfterAlertPath(educationUjatProgressConfirmPath(applicationId, applicationType))
        return
      }
    }
    submittingRef.current = true
    try {
      const blockedMessage = resolveOrganizationGuidancePatchBlockedMessage(portalPatchContext ?? {})
      if (blockedMessage) {
        setAlertMessage(blockedMessage)
        return
      }
      const acknowledgedRevision = isUjat
        ? ujatAcknowledgedSchedule?.assignmentRevision
        : undefined
      await patchGuidanceMutation.mutateAsync({
        detailCase,
        state,
        existingAnswers: portalPatchContext?.applicationAnswers,
      })

      if (isUjat) {
        const detailQueryKey = platformQueryKeys.mypage.programApplications.detail(
          applicationType,
          applicationId,
        )
        await queryClient.refetchQueries({ queryKey: detailQueryKey, exact: true })
        const latest = queryClient.getQueryData<PortalProgramApplicationDetail>(detailQueryKey)
        const latestRevision = latest?.supplement?.ujat?.assignmentRevision
        if (
          typeof acknowledgedRevision !== 'number' ||
          !Number.isInteger(acknowledgedRevision) ||
          acknowledgedRevision < 1
        ) {
          setAlertMessage(UJAT_SCHEDULE_RECONFIRM_REQUIRED_MESSAGE)
          setAfterAlertPath(educationUjatProgressConfirmPath(applicationId, applicationType))
          return
        }
        if (
          typeof latestRevision === 'number' &&
          Number.isInteger(latestRevision) &&
          latestRevision !== acknowledgedRevision
        ) {
          setAlertMessage(UJAT_STALE_REVISION_ALERT_MESSAGE)
          setAfterAlertPath(educationUjatProgressConfirmPath(applicationId, applicationType))
          return
        }
        try {
          const confirmation = await confirmUjatTemporaryScheduleMutation.mutateAsync(
            acknowledgedRevision,
          )
          if (confirmation.portalBannerState !== 'ADMIN_REVIEW') {
            await queryClient.refetchQueries({ queryKey: detailQueryKey, exact: true })
            const afterConfirm = queryClient.getQueryData<PortalProgramApplicationDetail>(
              detailQueryKey,
            )
            if (afterConfirm?.supplement?.ujat?.portalBannerState !== 'ADMIN_REVIEW') {
              setAlertMessage(
                '일정 확인 응답을 확인하지 못했습니다. 신청 상세를 새로고침 후 다시 시도해 주세요.',
              )
              return
            }
          }
        } catch (confirmError) {
          await queryClient.refetchQueries({ queryKey: detailQueryKey, exact: true })
          const afterError = queryClient.getQueryData<PortalProgramApplicationDetail>(detailQueryKey)
          if (afterError?.supplement?.ujat?.portalBannerState === 'ADMIN_REVIEW') {
            navigate(
              educationInstitutionGuidanceApplicationTabPath(applicationId, applicationType),
              { replace: true },
            )
            return
          }
          if (isUjatStaleRevisionError(confirmError)) {
            setAlertMessage(UJAT_STALE_REVISION_ALERT_MESSAGE)
            setAfterAlertPath(educationUjatProgressConfirmPath(applicationId, applicationType))
            return
          }
          setAlertMessage(resolveUjatTemporaryScheduleConfirmErrorMessage(confirmError))
          return
        }
      }

      navigate(
        educationInstitutionGuidanceApplicationTabPath(applicationId, applicationType),
        { replace: true },
      )
    } catch (error) {
      if (isUjatStaleRevisionError(error)) {
        setAlertMessage(UJAT_STALE_REVISION_ALERT_MESSAGE)
        setAfterAlertPath(educationUjatProgressConfirmPath(applicationId, applicationType))
        return
      }
      setAlertMessage(resolveInstitutionGuidanceErrorMessage(error))
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <>
      <FormTemplateHost surface="platformUser">
        <div className={styles.paragraphStack}>
          {isUjat ? <UjatTemporaryScheduleSummary temporarySchedule={temporarySchedule} /> : null}
          {isUjat ? (
            <ParagraphCard
              dataParagraphId="ujat-institution-guidance-intro"
              editableHeading={institutionGuidanceParagraphHeading(
                'UJAT 프로그램_기관 안내 사항 작성',
                '',
                { required: false },
              )}
            >
              {submitPeriodLabel?.trim() ? (
                <PFText as="p" typo="bd-md-md" color="black">
                  {`제출 기간 : ${submitPeriodLabel.trim()}`}
                </PFText>
              ) : (
                <PFText as="p" typo="bd-md-md" color="black">
                  제출 기간 : -
                </PFText>
              )}
            </ParagraphCard>
          ) : null}

          <ApplyInstitutionGuidance
            layout="paragraphCards"
            variant={isUjat ? 'ujat' : 'general'}
            value={guidance}
            onChange={setGuidance}
          />

          {isUjat ? (
            <>
              <ParagraphCard
                dataParagraphId="institution-guidance-snack"
                editableHeading={institutionGuidanceParagraphHeading(
                  UJAT_SNACK_FIELD.title,
                  UJAT_SNACK_FIELD.description,
                )}
              >
                <ApplyFormRadioGroup
                  name="ujat-guidance-snack"
                  value={ujatExtras.snackAvailability}
                  options={UJAT_SNACK_AVAILABILITY_OPTIONS}
                  onChange={next =>
                    setUjatExtras(current => ({
                      ...current,
                      snackAvailability: next as ApplyUjatInstitutionGuidanceExtras['snackAvailability'],
                    }))
                  }
                />
              </ParagraphCard>

              <ParagraphCard
                dataParagraphId="institution-sex-offense-ujat-write"
                editableHeading={institutionGuidanceParagraphHeading(
                  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.title,
                  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.description,
                )}
              >
                <ApplyInstitutionSexOffenseUjatWrite value={sexOffense} onChange={setSexOffense} />
              </ParagraphCard>

              <ParagraphCard
                dataParagraphId="institution-guidance-classroom"
                editableHeading={institutionGuidanceParagraphHeading(
                  UJAT_CLASSROOM_SETTING_FIELD.title,
                  UJAT_CLASSROOM_SETTING_FIELD.description,
                )}
              >
                <ApplyFormRadioGroup
                  name="ujat-guidance-classroom"
                  value={ujatExtras.classroomSettingConfirmed}
                  options={UJAT_CLASSROOM_SETTING_OPTIONS}
                  onChange={next =>
                    setUjatExtras(current => ({
                      ...current,
                      classroomSettingConfirmed:
                        next as ApplyUjatInstitutionGuidanceExtras['classroomSettingConfirmed'],
                    }))
                  }
                />
              </ParagraphCard>
            </>
          ) : (
            <>
              <ParagraphCard
                dataParagraphId="institution-sex-offense-submission"
                editableHeading={institutionGuidanceParagraphHeading(
                  INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION.title,
                  INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION.description,
                )}
              >
                <ApplyInstitutionSexOffenseSubmission value={sexOffense} onChange={setSexOffense} />
              </ParagraphCard>

              {shouldShowSexOffenseInquiry(sexOffense) ? (
                <ParagraphCard
                  dataParagraphId="institution-sex-offense-inquiry"
                  editableHeading={institutionGuidanceParagraphHeading(
                    INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.title,
                    INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.description,
                  )}
                >
                  <ApplyInstitutionSexOffenseInquiry value={sexOffense} onChange={setSexOffense} />
                </ParagraphCard>
              ) : null}

              <div className={styles.closingCard}>
                <p className={styles.closingText}>작성해주셔서 감사합니다</p>
              </div>
            </>
          )}
        </div>
      </FormTemplateHost>

      <div className={styles.actions}>
        <PFButton
          type="button"
          size="xlarge"
          width={240}
          disabled={
            patchGuidanceMutation.isPending ||
            confirmUjatTemporaryScheduleMutation.isPending
          }
          onClick={() => {
            void handleSubmit()
          }}
        >
          {patchGuidanceMutation.isPending || confirmUjatTemporaryScheduleMutation.isPending
            ? isUjat
              ? '제출 중…'
              : '저장 중…'
            : submitLabel}
        </PFButton>
      </div>

      <PFAlertModal
        open={alertMessage != null}
        title="안내"
        description={alertMessage ?? undefined}
        onConfirm={() => {
          const nextPath = afterAlertPath
          setAlertMessage(null)
          setAfterAlertPath(null)
          if (nextPath) {
            navigate(nextPath, { replace: true })
          }
        }}
      />
    </>
  )
}

export function resolveTeacherInstitutionGuidanceInitialState(
  _applicationId: string,
  fallback: TeacherInstitutionGuidanceFormState,
): TeacherInstitutionGuidanceFormState {
  return fallback
}
