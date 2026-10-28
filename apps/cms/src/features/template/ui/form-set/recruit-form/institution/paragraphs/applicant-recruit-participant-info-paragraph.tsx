import {
  buildInstitutionApplicationRecruitLimitVisibilityBridge,
  resolveInstitutionApplicationRecruitLimitsVisibilityBridge,
  shouldShowInstitutionApplicationMaxScheduleFields,
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
  useInstitutionApplicationProgramBridge,
  type InstitutionApplicationRecruitLimitVisibilityInput,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { useMemo } from 'react'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import {
  ApplicantRecruitAnnouncementPublishedField,
  ApplicantRecruitFinalAnnounceField,
  ApplicantRecruitInstitutionBridgeSync,
  ApplicantRecruitInquiryContactFields,
  ApplicantRecruitMaxClassCountField,
  ApplicantRecruitMaxInstructorsField,
  ApplicantRecruitMaxScheduleCountField,
  ApplicantRecruitMaxSessionsPerDayField,
  ApplicantRecruitNotesFields,
  ApplicantRecruitPreguidanceRequiredField,
  ApplicantRecruitProgramPeriodField,
  ApplicantRecruitRecruitPeriodField,
  ApplicantRecruitStudentListRequiredField,
  ApplicantRecruitTargetLevelDetailField,
  ApplicantRecruitTargetLevelsField,
} from '@/features/template/ui/form-set/recruit-form/institution/paragraphs/applicant-recruit-participant-info-overlay-fields'
import '@/features/template/ui/form-editor/form-editor.css'
import './applicant-recruit-participant-info-paragraph.css'

const RECRUIT_PROGRESS_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

export type ApplicantRecruitParticipantInfoParagraphProps = {
  showInstitutionApplicationLimits?: boolean
  /** 양식 템플릿 편집(프로그램 미연동) — 최대 일정·차시 필드 레이아웃용 상시 노출 */
  isTemplateAuthoringMode?: boolean
  /** 등록 위저드 — 유형 설정·교육 일정 모드 SSOT (브리지 기본 date와 분리) */
  recruitLimitVisibility?: InstitutionApplicationRecruitLimitVisibilityInput
  layoutVariant?: 'general' | 'economy' | 'trainedTeachers'
  defaults?: {
    studentListRequired?: 'need' | 'none'
    preguidanceRequired?: 'need' | 'none'
    maxAssignableInstructors?: number
    maxClassCount?: number
    maxScheduleCount?: number
    maxSessionsPerDay?: number
  }
}

function RecruitProgressHintField() {
  return (
    <DetailInfoForm.Field
      label="참여자 모집 현황"
      readOnlyDisplay
      view={<span className="form-editor-template-field-hint-text">{RECRUIT_PROGRESS_HINT}</span>}
    />
  )
}

/** 프로그램 참여자 모집 폼 (학교) — 참여자 모집 정보 */
export function ApplicantRecruitParticipantInfoParagraph({
  showInstitutionApplicationLimits = true,
  isTemplateAuthoringMode = false,
  recruitLimitVisibility,
  layoutVariant = 'general',
  defaults,
}: ApplicantRecruitParticipantInfoParagraphProps = {}) {
  const institutionApplicationBridge = useInstitutionApplicationProgramBridge()
  const recruitLimitsVisibilityBridge = useMemo(() => {
    if (recruitLimitVisibility) {
      return buildInstitutionApplicationRecruitLimitVisibilityBridge(recruitLimitVisibility)
    }
    return resolveInstitutionApplicationRecruitLimitsVisibilityBridge(institutionApplicationBridge)
  }, [institutionApplicationBridge, recruitLimitVisibility])
  const isTrainedTeachers = layoutVariant === 'trainedTeachers'
  /** 등록 위저드는 `recruitLimitVisibility`로 판단 — 양식 관리(미연동)만 authoring 상시 노출 */
  const templateAuthoringLimitsPreview = isTemplateAuthoringMode && recruitLimitVisibility == null
  const showMaxScheduleCountField =
    showInstitutionApplicationLimits &&
    (templateAuthoringLimitsPreview ||
      shouldShowInstitutionApplicationMaxScheduleFields(recruitLimitsVisibilityBridge))
  const showMaxSessionsPerDayField =
    showInstitutionApplicationLimits &&
    (templateAuthoringLimitsPreview ||
      shouldShowInstitutionApplicationMaxSessionsPerDayField(recruitLimitsVisibilityBridge))

  const limitDefaults = defaults

  if (layoutVariant === 'economy') {
    return (
      <div className="applicant-recruit-participant-info-paragraph__forms program-registration-paragraph">
        <ApplicantRecruitInstitutionBridgeSync isTrainedTeachers={false} />
        <DetailInfoForm title="참여 기관 모집 정보" hideHeader mode="edit">
          <DetailInfoForm.Row type="single">
            <ApplicantRecruitAnnouncementPublishedField fullRow size="large" />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <ApplicantRecruitMaxInstructorsField
              defaultValue={limitDefaults?.maxAssignableInstructors}
            />
            <ApplicantRecruitMaxClassCountField defaultValue={limitDefaults?.maxClassCount} />
          </DetailInfoForm.Row>
        </DetailInfoForm>

        <DetailInfoForm title="참여 기관 모집 정보" hideHeader mode="edit">
          <DetailInfoForm.Row type="double">
            <ApplicantRecruitProgramPeriodField />
            <RecruitProgressHintField />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <ApplicantRecruitTargetLevelsField />
            <ApplicantRecruitTargetLevelDetailField />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <ApplicantRecruitRecruitPeriodField />
            <ApplicantRecruitFinalAnnounceField />
          </DetailInfoForm.Row>
          <ApplicantRecruitInquiryContactFields />
          <ApplicantRecruitNotesFields fullRow />
        </DetailInfoForm>
      </div>
    )
  }

  return (
    <div className="applicant-recruit-participant-info-paragraph__forms program-registration-paragraph">
      <ApplicantRecruitInstitutionBridgeSync isTrainedTeachers={isTrainedTeachers} />
      <DetailInfoForm title="참여 기관 모집 정보" hideHeader mode="edit">
        {isTrainedTeachers ? (
          <DetailInfoForm.Row type="double">
            <ApplicantRecruitAnnouncementPublishedField />
            <ApplicantRecruitStudentListRequiredField
              defaultValue={limitDefaults?.studentListRequired}
            />
          </DetailInfoForm.Row>
        ) : (
          <>
            <DetailInfoForm.Row type="single">
              <ApplicantRecruitAnnouncementPublishedField fullRow />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <ApplicantRecruitStudentListRequiredField
                defaultValue={limitDefaults?.studentListRequired}
              />
              <ApplicantRecruitPreguidanceRequiredField
                defaultValue={limitDefaults?.preguidanceRequired}
              />
            </DetailInfoForm.Row>
          </>
        )}

        {showInstitutionApplicationLimits ? (
          <>
            <DetailInfoForm.Row type={isTrainedTeachers ? 'single' : 'double'}>
              {isTrainedTeachers ? null : (
                <ApplicantRecruitMaxInstructorsField
                  defaultValue={limitDefaults?.maxAssignableInstructors}
                />
              )}
              <ApplicantRecruitMaxClassCountField
                defaultValue={limitDefaults?.maxClassCount}
                fullRow={isTrainedTeachers}
              />
            </DetailInfoForm.Row>

            {showMaxScheduleCountField || showMaxSessionsPerDayField ? (
              <DetailInfoForm.Row
                type={showMaxScheduleCountField && showMaxSessionsPerDayField ? 'double' : 'single'}
              >
                {showMaxScheduleCountField ? (
                  <ApplicantRecruitMaxScheduleCountField
                    defaultValue={limitDefaults?.maxScheduleCount}
                    fullRow={!showMaxSessionsPerDayField}
                  />
                ) : null}
                {showMaxSessionsPerDayField ? (
                  <ApplicantRecruitMaxSessionsPerDayField
                    defaultValue={limitDefaults?.maxSessionsPerDay}
                    label="신청 가능 1일 최대 차시"
                    suffix="차시"
                    fullRow={!showMaxScheduleCountField}
                  />
                ) : null}
              </DetailInfoForm.Row>
            ) : null}
          </>
        ) : null}
      </DetailInfoForm>

      <DetailInfoForm title="참여 기관 모집 정보" hideHeader mode="edit">
        <DetailInfoForm.Row type="double">
          <ApplicantRecruitProgramPeriodField />
          <RecruitProgressHintField />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <ApplicantRecruitTargetLevelsField />
          <ApplicantRecruitTargetLevelDetailField />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <ApplicantRecruitRecruitPeriodField />
          <ApplicantRecruitFinalAnnounceField />
        </DetailInfoForm.Row>
        <ApplicantRecruitInquiryContactFields />
        <ApplicantRecruitNotesFields fullRow />
      </DetailInfoForm>
    </div>
  )
}
