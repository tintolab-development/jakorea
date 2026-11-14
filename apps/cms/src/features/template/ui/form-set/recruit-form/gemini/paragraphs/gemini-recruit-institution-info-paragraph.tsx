import { useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { GeminiRecruitmentInstitutionFields } from '@/features/program/gemini/ui/recruitment/gemini-recruitment-institution-fields'
import {
  RECRUIT_TEMPLATE_INQUIRY_INPUT_WIDTH,
  RECRUIT_TEMPLATE_INQUIRY_LABEL_GAP,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-form-field-rows'
import type { GeminiRecruitmentFormFieldValues } from '@/features/program/gemini/lib/recruitment/format-recruitment-fields'
import type { GeminiRecruitmentEducationForm } from '@/features/program/gemini/lib/recruitment/add-form-options'
import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import { GEMINI_RECRUITMENT_VALIDATION_KEYS } from '@/features/program/gemini/lib/recruitment/validation-keys'
import {
  GEMINI_RECRUIT_FIELD_KEYS,
  useGeminiRecruitField,
} from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-form-rhf'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './gemini-recruit-institution-info-paragraph.css'

function parsePeriodFromOverlay(
  startIso: string | null,
  endIso: string | null
): [Dayjs | null, Dayjs | null] | null {
  if (startIso == null && endIso == null) return null
  return [startIso ? dayjs(startIso) : null, endIso ? dayjs(endIso) : null]
}

function serializePeriodToOverlay(period: [Dayjs | null, Dayjs | null] | null): {
  start: string | null
  end: string | null
} {
  if (period == null) return { start: null, end: null }
  return {
    start: period[0]?.toISOString() ?? null,
    end: period[1]?.toISOString() ?? null,
  }
}

/** Gemini 찾아가는 연수 모집 폼 — 교육 대상 고정 문구 */
const GEMINI_TEMPLATE_FIXED_EDUCATION_TARGET_LABEL = '대학(원)생, 성인'

/** 시안(5798:96247) 문의처 — 입력 200·라벨 간격 6 */
const GEMINI_TEMPLATE_INQUIRY_INPUT_LAYOUT = {
  inputWidth: RECRUIT_TEMPLATE_INQUIRY_INPUT_WIDTH,
  labelGap: RECRUIT_TEMPLATE_INQUIRY_LABEL_GAP,
}

/** Gemini 찾아가는 연수 모집 폼 — 시안(5798:96247) placeholder */
const GEMINI_TEMPLATE_PLACEHOLDERS = {
  title: '대표 프로그램명(국문)을 입력해 주세요',
  applicationPeriod: '모집 기간을 선택해 주세요',
  trainingRequestPeriod: '프로그램 운영 기간을 선택해 주세요',
} as const

/** Gemini 찾아가는 연수 모집 폼 — 참여 기관 모집 정보 단락 */
export function GeminiRecruitInstitutionInfoParagraph() {
  const [title, setTitle] = useGeminiRecruitField(GEMINI_RECRUIT_FIELD_KEYS.title, '')
  const [announcementPublished, setAnnouncementPublished] = useGeminiRecruitField<
    ParticipantRecruitmentAnnouncementPublishedValue | ''
  >(GEMINI_RECRUIT_FIELD_KEYS.announcementPublished, '')
  const [educationTargetLevels, setEducationTargetLevels] = useGeminiRecruitField<string[]>(
    GEMINI_RECRUIT_FIELD_KEYS.educationTargetLevels,
    []
  )
  const [educationTargetDetail, setEducationTargetDetail] = useGeminiRecruitField(
    GEMINI_RECRUIT_FIELD_KEYS.educationTargetDetail,
    ''
  )
  const [applicationPeriodStart, setApplicationPeriodStart] = useGeminiRecruitField<string | null>(
    GEMINI_RECRUIT_FIELD_KEYS.applicationPeriodStart,
    null
  )
  const [applicationPeriodEnd, setApplicationPeriodEnd] = useGeminiRecruitField<string | null>(
    GEMINI_RECRUIT_FIELD_KEYS.applicationPeriodEnd,
    null
  )
  const [trainingRequestPeriodStart, setTrainingRequestPeriodStart] = useGeminiRecruitField<
    string | null
  >(GEMINI_RECRUIT_FIELD_KEYS.trainingRequestPeriodStart, null)
  const [trainingRequestPeriodEnd, setTrainingRequestPeriodEnd] = useGeminiRecruitField<
    string | null
  >(GEMINI_RECRUIT_FIELD_KEYS.trainingRequestPeriodEnd, null)
  const [minStudentCount, setMinStudentCount] = useGeminiRecruitField<number | null>(
    GEMINI_RECRUIT_FIELD_KEYS.minStudentCount,
    15
  )
  // 템플릿 관리 모집 폼은 라디오를 미선택으로 시작한다(그 외 화면은 기존 기본값 「온라인」).
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const [educationForm, setEducationForm] = useGeminiRecruitField<
    GeminiRecruitmentEducationForm | ''
  >(GEMINI_RECRUIT_FIELD_KEYS.educationForm, isTemplateManagementScreen ? '' : 'online')
  const [inquiryContactName, setInquiryContactName] = useGeminiRecruitField(
    GEMINI_RECRUIT_FIELD_KEYS.inquiryContactName,
    ''
  )
  const [inquiryTel, setInquiryTel] = useGeminiRecruitField(
    GEMINI_RECRUIT_FIELD_KEYS.inquiryTel,
    ''
  )
  const [inquiryEmail, setInquiryEmail] = useGeminiRecruitField(
    GEMINI_RECRUIT_FIELD_KEYS.inquiryEmail,
    ''
  )
  const [notesNotApplicable, setNotesNotApplicable] = useGeminiRecruitField(
    GEMINI_RECRUIT_FIELD_KEYS.notesNotApplicable,
    false
  )
  const [notes, setNotes] = useGeminiRecruitField(GEMINI_RECRUIT_FIELD_KEYS.notes, '')

  const values = useMemo<GeminiRecruitmentFormFieldValues>(
    () => ({
      title,
      announcementPublished,
      educationTargetLevels,
      educationTargetDetail,
      applicationPeriodStart,
      applicationPeriodEnd,
      trainingRequestPeriodStart,
      trainingRequestPeriodEnd,
      minStudentCount,
      // 미선택('')은 라디오 그룹이 아무것도 선택하지 않은 상태로 그린다
      educationForm: educationForm as GeminiRecruitmentEducationForm,
      inquiryContactName,
      inquiryTel,
      inquiryEmail,
      notesNotApplicable,
      notes,
      thumbnailFileName: null,
      programDescription: '',
      recruitmentGuide: '',
      applicationMethod: '',
      learningSupportContent: '',
      additionalContentMarkdown: '',
      attachmentFileNames: [],
    }),
    [
      title,
      announcementPublished,
      educationTargetLevels,
      educationTargetDetail,
      applicationPeriodStart,
      applicationPeriodEnd,
      trainingRequestPeriodStart,
      trainingRequestPeriodEnd,
      minStudentCount,
      educationForm,
      inquiryContactName,
      inquiryTel,
      inquiryEmail,
      notesNotApplicable,
      notes,
    ]
  )

  const applicationPeriod = useMemo(
    () => parsePeriodFromOverlay(applicationPeriodStart, applicationPeriodEnd),
    [applicationPeriodEnd, applicationPeriodStart]
  )
  const trainingRequestPeriod = useMemo(
    () => parsePeriodFromOverlay(trainingRequestPeriodStart, trainingRequestPeriodEnd),
    [trainingRequestPeriodEnd, trainingRequestPeriodStart]
  )

  const handleApplicationPeriodChange = (period: [Dayjs | null, Dayjs | null] | null) => {
    const { start, end } = serializePeriodToOverlay(period)
    setApplicationPeriodStart(start)
    setApplicationPeriodEnd(end)
  }

  const handleTrainingRequestPeriodChange = (period: [Dayjs | null, Dayjs | null] | null) => {
    const { start, end } = serializePeriodToOverlay(period)
    setTrainingRequestPeriodStart(start)
    setTrainingRequestPeriodEnd(end)
  }

  const handleMinStudentCountChange = (raw: string) => {
    const trimmed = raw.trim()
    if (trimmed === '') {
      setMinStudentCount(null)
      return
    }
    const parsed = Number.parseInt(trimmed, 10)
    if (Number.isFinite(parsed) && parsed >= 0) {
      setMinStudentCount(parsed)
    }
  }

  const handleChange = (patch: Partial<GeminiRecruitmentFormFieldValues>) => {
    if (patch.title !== undefined) setTitle(patch.title)
    if (patch.announcementPublished !== undefined)
      setAnnouncementPublished(patch.announcementPublished)
    if (patch.educationTargetLevels !== undefined)
      setEducationTargetLevels(patch.educationTargetLevels)
    if (patch.educationTargetDetail !== undefined)
      setEducationTargetDetail(patch.educationTargetDetail)
    if (patch.educationForm !== undefined) {
      setEducationForm(patch.educationForm as GeminiRecruitmentEducationForm)
    }
    if (patch.inquiryContactName !== undefined) setInquiryContactName(patch.inquiryContactName)
    if (patch.inquiryTel !== undefined) setInquiryTel(patch.inquiryTel)
    if (patch.inquiryEmail !== undefined) setInquiryEmail(patch.inquiryEmail)
    if (patch.notesNotApplicable !== undefined) setNotesNotApplicable(patch.notesNotApplicable)
    if (patch.notes !== undefined) setNotes(patch.notes)
  }

  return (
    <div className="program-registration-paragraph gemini-recruit-institution-info-paragraph">
      <DetailInfoForm title="참여 기관 모집 정보(설정)" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="공고 게시 여부"
            validationKey={GEMINI_RECRUITMENT_VALIDATION_KEYS.announcementPublished}
            fullRow
            view="-"
            edit={
              <ParticipantRecruitmentAnnouncementPublishedRadios
                value={announcementPublished}
                onChange={setAnnouncementPublished}
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm title="참여 기관 모집 정보" hideHeader mode="edit">
        <GeminiRecruitmentInstitutionFields
          mode="edit"
          values={values}
          showAnnouncementRow={false}
          applicationPeriod={applicationPeriod}
          onApplicationPeriodChange={handleApplicationPeriodChange}
          trainingRequestPeriod={trainingRequestPeriod}
          onTrainingRequestPeriodChange={handleTrainingRequestPeriodChange}
          onMinStudentCountChange={handleMinStudentCountChange}
          onChange={handleChange}
          // 템플릿 Gemini 모집 폼 — 교육 대상 고정 (QA 261113 #60)
          fixedEducationTargetLabel={GEMINI_TEMPLATE_FIXED_EDUCATION_TARGET_LABEL}
          placeholderOverrides={GEMINI_TEMPLATE_PLACEHOLDERS}
          inquiryInputLayout={GEMINI_TEMPLATE_INQUIRY_INPUT_LAYOUT}
        />
      </DetailInfoForm>
    </div>
  )
}
