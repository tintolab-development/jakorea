import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  ApplyInstitutionSexOffenseInquiry,
  ApplyInstitutionSexOffenseSubmission,
  shouldShowSexOffenseInquiry,
  type ApplyInstitutionSexOffenseValues,
} from '@/features/program/ui/apply-institution-sex-offense/apply-institution-sex-offense'
import type { ProgramApplicationType } from '../api/types'
import { savePortalTeacherInstitutionGuidance } from '../api/institution-guidance-client'
import type { TeacherInstitutionGuidanceFormState } from '../lib/institution-guidance-from-answers'
import { educationInstitutionGuidanceApplicationTabPath } from '../lib/guidance-path'
import { hasInstitutionGuidanceDraftContent } from '../lib/teacher-institution-guidance'
import { isTeacherInstitutionGuidanceSubmitIncomplete } from '../lib/validate-institution-guidance'
import {
  getMockTeacherInstitutionGuidanceFormState,
  updateMockTeacherInstitutionGuidanceFormState,
} from '../lib/mock-applications'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'
import { FormTemplateHost, ParagraphCard } from '@/features/form-template'
import { institutionGuidanceParagraphHeading } from '@/features/program/ui/apply-institution-guidance/institution-guidance-paragraph-heading'
import { PFAlertModal, PFButton } from '@/shared/ui'
import styles from './institution-guidance-write-form.module.css'

type EducationInstitutionGuidanceWriteFormProps = {
  applicationId: string
  applicationType: ProgramApplicationType
  detailCase: ProgramDetailCase | undefined
  initialState: TeacherInstitutionGuidanceFormState
}

export function EducationInstitutionGuidanceWriteForm({
  applicationId,
  applicationType,
  detailCase,
  initialState,
}: EducationInstitutionGuidanceWriteFormProps) {
  const navigate = useNavigate()
  const [guidance, setGuidance] = useState<ApplyInstitutionGuidanceAnswers>(initialState.guidance)
  const [sexOffense, setSexOffense] = useState<ApplyInstitutionSexOffenseValues>(
    initialState.sexOffense,
  )
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submitLabel = hasInstitutionGuidanceDraftContent(initialState.guidance)
    ? '수정하기'
    : '작성하기'

  const handleSubmit = async () => {
    const state: TeacherInstitutionGuidanceFormState = { guidance, sexOffense }
    if (isTeacherInstitutionGuidanceSubmitIncomplete(guidance, sexOffense)) {
      setAlertMessage(PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE)
      return
    }

    setSubmitting(true)
    try {
      const useMockPersist =
        !isRemoteApiConfigured() || shouldUsePlatformMockData()
      if (useMockPersist) {
        updateMockTeacherInstitutionGuidanceFormState(applicationId, state)
      } else {
        await savePortalTeacherInstitutionGuidance({
          applicationType,
          applicationId,
          detailCase,
          state,
        })
      }
      navigate(
        educationInstitutionGuidanceApplicationTabPath(applicationId, applicationType),
        { replace: true },
      )
    } catch {
      setAlertMessage('안내사항을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <FormTemplateHost surface="platformUser">
        <div className={styles.paragraphStack}>
          <ApplyInstitutionGuidance
            layout="paragraphCards"
            value={guidance}
            onChange={setGuidance}
          />

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
        </div>
      </FormTemplateHost>

      <div className={styles.actions}>
          <PFButton
            type="button"
            size="xlarge"
            width={240}
            disabled={submitting}
            onClick={() => {
              void handleSubmit()
            }}
          >
            {submitting ? '저장 중…' : submitLabel}
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

/** write 페이지 초기값 — mock override 우선 */
export function resolveTeacherInstitutionGuidanceInitialState(
  applicationId: string,
  fallback: TeacherInstitutionGuidanceFormState,
): TeacherInstitutionGuidanceFormState {
  const override = getMockTeacherInstitutionGuidanceFormState(applicationId)
  if (override) return override
  return fallback
}
