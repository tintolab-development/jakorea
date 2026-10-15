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
import { usePatchOrganizationGuidanceAnswersMutation } from '../api/institution-guidance-hooks'
import type { TeacherInstitutionGuidanceFormState } from '../lib/institution-guidance-from-answers'
import { resolveInstitutionGuidanceErrorMessage } from '../lib/institution-guidance-errors'
import {
  resolveOrganizationGuidancePatchBlockedMessage,
  type OrganizationGuidancePatchPortalContext,
} from '../lib/institution-guidance-patch-readiness'
import { educationInstitutionGuidanceApplicationTabPath } from '../lib/guidance-path'
import { hasInstitutionGuidanceDraftContent } from '../lib/teacher-institution-guidance'
import { isTeacherInstitutionGuidanceSubmitIncomplete } from '../lib/validate-institution-guidance'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { FormTemplateHost, ParagraphCard } from '@/features/form-template'
import { institutionGuidanceParagraphHeading } from '@/features/program/ui/apply-institution-guidance/institution-guidance-paragraph-heading'
import { PFAlertModal, PFButton } from '@/shared/ui'
import styles from './institution-guidance-write-form.module.css'

type EducationInstitutionGuidanceWriteFormProps = {
  applicationId: string
  applicationType: ProgramApplicationType
  detailCase: ProgramDetailCase | undefined
  initialState: TeacherInstitutionGuidanceFormState
  /** remote PATCH 전 Portal 신청 상세 기준 사전 검사 */
  portalPatchContext?: OrganizationGuidancePatchPortalContext
}

export function EducationInstitutionGuidanceWriteForm({
  applicationId,
  applicationType,
  detailCase,
  initialState,
  portalPatchContext,
}: EducationInstitutionGuidanceWriteFormProps) {
  const navigate = useNavigate()
  const [guidance, setGuidance] = useState<ApplyInstitutionGuidanceAnswers>(initialState.guidance)
  const [sexOffense, setSexOffense] = useState<ApplyInstitutionSexOffenseValues>(
    initialState.sexOffense,
  )
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const patchGuidanceMutation = usePatchOrganizationGuidanceAnswersMutation(
    applicationType,
    applicationId,
  )

  const submitLabel = hasInstitutionGuidanceDraftContent(initialState.guidance)
    ? '수정하기'
    : '작성하기'

  const handleSubmit = async () => {
    const state: TeacherInstitutionGuidanceFormState = { guidance, sexOffense }
    if (isTeacherInstitutionGuidanceSubmitIncomplete(guidance, sexOffense)) {
      setAlertMessage(PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE)
      return
    }

    if (!isRemoteApiConfigured()) {
      setAlertMessage('API가 설정되지 않아 저장할 수 없습니다.')
      return
    }
    try {
      const blockedMessage = resolveOrganizationGuidancePatchBlockedMessage(portalPatchContext ?? {})
      if (blockedMessage) {
        setAlertMessage(blockedMessage)
        return
      }
      await patchGuidanceMutation.mutateAsync({ detailCase, state })
      navigate(
        educationInstitutionGuidanceApplicationTabPath(applicationId, applicationType),
        { replace: true },
      )
    } catch (error) {
      setAlertMessage(resolveInstitutionGuidanceErrorMessage(error))
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
            disabled={patchGuidanceMutation.isPending}
            onClick={() => {
              void handleSubmit()
            }}
          >
            {patchGuidanceMutation.isPending ? '저장 중…' : submitLabel}
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

export function resolveTeacherInstitutionGuidanceInitialState(
  _applicationId: string,
  fallback: TeacherInstitutionGuidanceFormState,
): TeacherInstitutionGuidanceFormState {
  return fallback
}
