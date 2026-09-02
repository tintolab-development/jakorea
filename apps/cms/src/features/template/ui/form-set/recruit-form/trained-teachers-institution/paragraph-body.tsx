import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { TRAINED_TEACHERS_RECRUIT_FORM_INSTITUTION_IDS } from '@/features/template/model/trained-teachers-recruit-form-institution-draft'
import { ApplicantRecruitParticipantInfoParagraph } from '@/features/template/ui/form-set/recruit-form/institution/paragraphs/applicant-recruit-participant-info-paragraph'
import { RecruitDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-paragraph'

const TRAINED_TEACHERS_RECRUIT_DEFAULTS = {
  studentListRequired: 'need' as const,
  maxAssignableInstructors: 2,
  maxClassCount: 4,
  maxScheduleCount: 3,
  maxSessionsPerDay: 8,
}

/** 템플릿 편집기 — 교육받은 교사_참여 기관 모집 폼 시드 단락 본문 */
export function renderTrainedTeachersRecruitFormInstitutionParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case TRAINED_TEACHERS_RECRUIT_FORM_INSTITUTION_IDS.participantRecruitInfo:
      return (
        <ApplicantRecruitParticipantInfoParagraph
          showInstitutionApplicationLimits
          layoutVariant="trainedTeachers"
          defaults={TRAINED_TEACHERS_RECRUIT_DEFAULTS}
        />
      )
    case TRAINED_TEACHERS_RECRUIT_FORM_INSTITUTION_IDS.detailInfo:
      return (
        <RecruitDetailInfoParagraph
          wysiwygResetKey="trained-teachers-recruit-institution-extra-body"
          overlayKeyPrefix="trainedTeachersRecruit.detailInfo"
          textFields={[
            { label: '프로그램 설명', placeholder: '프로그램 설명을 작성하세요' },
            { label: '모집 안내', placeholder: '모집 안내를 작성하세요' },
            { label: '지원 방법', placeholder: '지원 방법을 작성하세요' },
            { label: '학습 지원 내용', placeholder: '학습 지원 내용을 작성하세요' },
          ]}
        />
      )
    default:
      return null
  }
}
