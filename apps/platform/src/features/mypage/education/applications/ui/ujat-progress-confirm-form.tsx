import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import { FormTemplateHost, ParagraphCard } from '@/features/form-template'
import { PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE } from '@/features/program/lib/program-apply-messages'
import { coerceApplicationFormDocument } from '@/features/program/lib/application-form-draft'
import {
  readUjatPreferredEducationScheduleOptions,
  readUjatPreferredEducationScheduleOptionsFromSubmittedAnswer,
} from '@/features/program/lib/ujat-preferred-education-schedule-options'
import {
  ApplyUjatInstitutionBasicInfo,
  emptyUjatInstitutionBasicInfo,
  findIncompleteUjatInstitutionBasicInfoMessage,
  ujatInstitutionBasicInfoAnswerFromValues,
  ujatInstitutionBasicInfoValuesFromDraftAnswer,
  type ApplyUjatInstitutionBasicInfoValues,
} from '@/features/program/ui/apply-ujat-institution-basic-info/apply-ujat-institution-basic-info'
import {
  ApplyUjatInstitutionGradeInfo,
  appendUjatInstitutionGradeBlock,
  emptyUjatInstitutionGradeBlocks,
  findIncompleteUjatInstitutionGradeInfoMessage,
  ujatInstitutionGradeAnswerFromValues,
  ujatInstitutionGradeValuesFromDraftAnswer,
} from '@/features/program/ui/apply-ujat-institution-grade-info/apply-ujat-institution-grade-info'
import {
  ApplyUjatInstitutionClassTime,
  appendUjatInstitutionClassTimeBlock,
  emptyUjatInstitutionClassTimeBlocks,
  findIncompleteUjatInstitutionClassTimeMessage,
  ujatInstitutionClassTimeAnswerFromValues,
  ujatInstitutionClassTimeValuesFromDraftAnswer,
} from '@/features/program/ui/apply-ujat-institution-class-time/apply-ujat-institution-class-time'
import {
  ApplyUjatInstitutionPreferredSchedule,
  findIncompleteUjatInstitutionPreferredScheduleMessage,
  ujatInstitutionPreferredScheduleAnswerFromValues,
  ujatInstitutionPreferredScheduleValuesFromDraftAnswer,
} from '@/features/program/ui/apply-ujat-institution-preferred-schedule/apply-ujat-institution-preferred-schedule'
import { ApplyPreferredScheduleAddButton } from '@/features/program/ui/apply-preferred-schedule/apply-preferred-schedule'
import { institutionGuidanceParagraphHeading } from '@/features/program/ui/apply-institution-guidance/institution-guidance-paragraph-heading'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { ApplyUjatInstitutionSubmitConfirmation } from '@/features/program/ui/apply-ujat-institution-submit-confirmation/apply-ujat-institution-submit-confirmation'
import { PFAlertModal, PFButton } from '@/shared/ui'
import type { ProgramApplicationType } from '../api/types'
import { usePortalMeFormBindingRender } from '../api/hooks'
import { patchOrganizationGuidanceAnswers } from '../api/institution-guidance-client'
import { educationInstitutionGuidanceWritePath } from '../lib/guidance-path'
import { resolveInstitutionGuidanceErrorMessage } from '../lib/institution-guidance-errors'
import styles from './institution-guidance-write-form.module.css'

const CONFIRM_HEADING = '상기 내용을 모두 확인하였으며 현재 답변으로 제출합니다.'
const CONFIRM_DESCRIPTION =
  '교육 일정과 학년 정보는 담당자와 협의된 내용으로 작성되어야 하며, 협의사항과 다를 경우 담당자가 수정 요청을 드릴 수 있습니다.'
const CONFIRM_RADIO_LABEL =
  '네. 상기 내용 모두 확인하였으며, 해당 내용으로 교육을 진행합니다.'
const PREFERRED_DESCRIPTION =
  '금요일 1교시~4교시에 진행되며, 4교시 모두 교육 진행이 가능해야 합니다. * 참여 가능한 모든 일정을 선택해 주시면, 선택해 주신 일정 중에서 조정하여 교육이 진행될 예정입니다.'

type UjatProgressConfirmFormProps = {
  applicationId: string
  applicationType: ProgramApplicationType
  programId: string
  formBindingId?: number
  answers: Record<string, unknown> | undefined
  isRevision: boolean
}

function pickAnswer(answers: Record<string, unknown> | undefined, keys: readonly string[]): unknown {
  if (!answers) return undefined
  for (const key of keys) {
    if (key in answers) return answers[key]
  }
  return undefined
}

export function UjatProgressConfirmForm({
  applicationId,
  applicationType,
  programId,
  formBindingId,
  answers,
  isRevision,
}: UjatProgressConfirmFormProps) {
  const navigate = useNavigate()
  const formRender = usePortalMeFormBindingRender(programId, formBindingId)
  const preferredAnswer = pickAnswer(answers, [
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule,
  ])
  const preferredOptions = useMemo(() => {
    const document = coerceApplicationFormDocument(formRender.document)
    const fromRuntime = readUjatPreferredEducationScheduleOptions({
      runtimeContext: document?.runtimeContext ?? formRender.document?.runtimeContext,
    })
    if (fromRuntime.length > 0) return fromRuntime
    return readUjatPreferredEducationScheduleOptionsFromSubmittedAnswer(preferredAnswer)
  }, [formRender.document, preferredAnswer])

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

  const handleContinue = async () => {
    const incomplete =
      findIncompleteUjatInstitutionBasicInfoMessage(basicInfo) ??
      findIncompleteUjatInstitutionGradeInfoMessage(gradeBlocks) ??
      findIncompleteUjatInstitutionClassTimeMessage(classTimeBlocks, gradeBlocks) ??
      findIncompleteUjatInstitutionPreferredScheduleMessage(preferredIds, preferredOptions)
    if (incomplete || !confirmed) {
      setAlertMessage(PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE)
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
      navigate(educationInstitutionGuidanceWritePath(applicationId, applicationType))
    } catch (error) {
      setAlertMessage(resolveInstitutionGuidanceErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <FormTemplateHost surface="platformUser">
        <div className={styles.paragraphStack}>
          <ParagraphCard
            dataParagraphId={UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo}
            editableHeading={institutionGuidanceParagraphHeading('1. 기본 정보', '설명이 노출됩니다.')}
          >
            <ApplyUjatInstitutionBasicInfo value={basicInfo} onChange={setBasicInfo} />
          </ParagraphCard>

          <ParagraphCard
            dataParagraphId={UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo}
            editableHeading={institutionGuidanceParagraphHeading(
              '2. 학년 별 신청 정보',
              '신청 학년 별 학급 수 및 학생 수를 작성해주세요.',
              {
                titleTrailing: (
                  <ApplyPreferredScheduleAddButton
                    onClick={() => setGradeBlocks(appendUjatInstitutionGradeBlock)}
                  >
                    신청 학년 추가
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
              '3. 학년 별 수업 시간',
              '신청 학년 별 수업 진행 시간을 작성해주세요.',
              {
                titleTrailing: (
                  <ApplyPreferredScheduleAddButton
                    onClick={() => setClassTimeBlocks(appendUjatInstitutionClassTimeBlock)}
                  >
                    수업 진행 시간 추가
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
              '4. 진행 희망 교육 일정',
              PREFERRED_DESCRIPTION,
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
              CONFIRM_HEADING,
              CONFIRM_DESCRIPTION,
            )}
          >
            <ApplyUjatInstitutionSubmitConfirmation
              control="radio"
              label={CONFIRM_RADIO_LABEL}
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
          {saving ? '저장 중…' : isRevision ? '안내사항 수정하기' : '안내사항 작성하기'}
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
