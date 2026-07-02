import { ClockCircleOutlined, PlusOutlined } from '@ant-design/icons'
import type { ParagraphCardEditableHeading } from '@/features/template/ui/template-management/template-fullpage-modal'
import { getFormParagraphTitleNumberPrefix } from '@/features/template/lib/form-title-numbering'
import {
  isAgreementLockedSystemParagraph,
  LECTURE_REPORT_SEED_PARAGRAPH_IDS,
  type FormEditorKind,
  type FormTitleNumberingStyle,
  type HorizontalTableParagraph,
  type TitleWithPeriodParagraph,
  type VerticalTableParagraph,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import {
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS,
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/ujat-program-application-form-institution-draft'
import {
  PROGRAM_REGISTRATION_GENERAL_SEED_PARAGRAPH_IDS,
  PROGRAM_REGISTRATION_IDS,
} from '@/features/template/model/program-registration-draft'
import { PROGRAM_APPLICATION_FORM_ECONOMY_SEED_PARAGRAPH_IDS } from '@/features/template/model/program-application-form-economy-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_SEED_PARAGRAPH_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { APPLICANT_RECRUIT_FORM_INDIVIDUAL_SEED_PARAGRAPH_IDS } from '@/features/template/model/applicant-recruit-form-individual-draft'
import { APPLICANT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS } from '@/features/template/model/applicant-recruit-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS } from '@/features/template/model/program-application-form-volunteer-draft'
import { RECRUIT_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS } from '@/features/template/model/recruit-form-instructor-draft'
import { RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS } from '@/features/template/model/recruit-form-volunteer-draft'
import { UJAT_PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS } from '@/features/template/model/ujat-program-registration-draft'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS } from '@/features/template/model/gemini-visiting-training-application-form-institution-draft'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS } from '@/features/template/model/gemini-visiting-training-application-form-instructor-draft'
import { UJAT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS } from '@/features/template/model/ujat-recruit-form-institution-draft'
import { GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT } from '@/features/program/general/lib/curriculum-progress-session-options'
import { PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import { RECRUIT_FORM_VOLUNTEER_IDS } from '@/features/template/model/recruit-form-volunteer-draft'
import {
  UJAT_RECRUIT_FORM_VOLUNTEER_IDS,
  UJAT_RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/ujat-recruit-form-volunteer-draft'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsToggle } from '@/shared/ui/cms-toggle'
import type { FormEditorLeftPanelProps } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel.types'

/** 발급용 등 — 단락 카드 제목의 필수(*) 표시 제거 */
export function withoutTitleRequired<T extends { titleRequired?: boolean }>(
  heading: T | undefined,
  hideParagraphRequiredChrome?: boolean
): T | undefined {
  if (!heading || !hideParagraphRequiredChrome) return heading
  return { ...heading, titleRequired: false }
}

const HIDDEN_PREVIEW_DESCRIPTION_TEXTS = new Set(['설명 입력', '설명을 입력해 주세요'])
const CARD_DESCRIPTION_PLACEHOLDER_TEXT = '설명 입력'

export function withoutPlaceholderDescriptionInPreview<
  T extends { descriptionValue?: string; showDescription?: boolean },
>(heading: T | undefined, hideInPreview?: boolean): T | undefined {
  if (!heading || !hideInPreview) return heading
  if (heading.showDescription === false) return heading
  const trimmedDescription = heading.descriptionValue?.trim() ?? ''
  if (trimmedDescription.length === 0 || HIDDEN_PREVIEW_DESCRIPTION_TEXTS.has(trimmedDescription)) {
    return { ...heading, showDescription: false }
  }
  return heading
}

function usesPlaceholderDescriptionValue(paragraphId: string): boolean {
  return (
    PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    PROGRAM_PARTICIPANT_APPLICATION_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    PROGRAM_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    PROGRAM_APPLICATION_FORM_ECONOMY_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    PROGRAM_REGISTRATION_GENERAL_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    UJAT_PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    APPLICANT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    APPLICANT_RECRUIT_FORM_INDIVIDUAL_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    RECRUIT_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    UJAT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    UJAT_RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS.has(paragraphId) ||
    LECTURE_REPORT_SEED_PARAGRAPH_IDS.has(paragraphId)
  )
}

function normalizeCardDescriptionValue(paragraphId: string, value: string): string {
  if (value.trim() !== CARD_DESCRIPTION_PLACEHOLDER_TEXT) return value
  return usesPlaceholderDescriptionValue(paragraphId) ? '' : value
}

/** 프로그램 등록 — 교육 진행 단락: 카드 제목 줄 우측 액션 (본문 DetailInfoForm 밖) */
export function withProgramRegistrationCurriculumTitleTrailing(
  heading: ParagraphCardEditableHeading,
  paragraph: WritingFormParagraph,
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
): ParagraphCardEditableHeading {
  const pr = paragraphBodyOptions?.programRegistration
  if (paragraph.id !== PROGRAM_REGISTRATION_IDS.educationCurriculum || pr == null) {
    return heading
  }
  if (pr.programRegistrationFormVariant === 'economy') {
    return heading
  }
  if (pr.programRegistrationFormVariant === 'trainedTeachers') {
    const curriculumChartSessionAtMax =
      pr.curriculumChartSessionCount >= GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT
    return {
      ...heading,
      titleTrailing: (
        <div
          className="program-registration-paragraph__card-title-actions"
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
          role="presentation"
        >
          <CmsToggle
            label="교사 연수"
            checked={pr.trainedTeachersTeacherTrainingEnabled}
            onChange={pr.onTrainedTeachersTeacherTrainingEnabledChange}
          />
          <CmsButton
            type="button"
            variant="secondary"
            size="medium"
            width={160}
            disabled={curriculumChartSessionAtMax}
            icon={<PlusOutlined aria-hidden />}
            onClick={e => {
              e.stopPropagation()
              if (curriculumChartSessionAtMax) return
              pr.onAddCurriculumChartSession()
            }}
          >
            강의 진행 차시 추가
          </CmsButton>
        </div>
      ),
    }
  }
  if (pr.programType === 'schedule') {
    const isScheduleMultiAllPer =
      pr.sessionRoundType === 'multi' &&
      pr.educationFormScheduleDetail === 'perSchedule' &&
      pr.participationScheduleDetail === 'perSchedule' &&
      pr.ipsScheduleDetail === 'perSchedule'

    if (isScheduleMultiAllPer) {
      return {
        ...heading,
        titleTrailing: (
          <div
            className="program-registration-paragraph__card-title-actions"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
            role="presentation"
          >
            <CmsToggle
              label="사전 교육"
              checked={pr.scheduleCurriculumPreEducation}
              onChange={pr.onScheduleCurriculumPreEducationChange}
            />
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={160}
              icon={<PlusOutlined aria-hidden />}
              onClick={e => {
                e.stopPropagation()
                pr.onAddScheduleCurriculumDetail()
              }}
            >
              강의 행사 일정 추가
            </CmsButton>
          </div>
        ),
      }
    }

    if (pr.sessionRoundType === 'multi') {
      return {
        ...heading,
        titleTrailing: (
          <div className="program-registration-paragraph__card-title-actions">
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={160}
              icon={<PlusOutlined aria-hidden />}
              onClick={e => {
                e.stopPropagation()
                pr.onAddScheduleCurriculumDetail()
              }}
            >
              강의 세부 일정 추가
            </CmsButton>
          </div>
        ),
      }
    }

    return {
      ...heading,
      titleTrailing: (
        <div className="program-registration-paragraph__card-title-actions">
          <CmsButton
            type="button"
            variant="secondary"
            size="medium"
            width={160}
            disabled={
              pr.scheduleCurriculumGroupCount >=
              PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT
            }
            icon={<ClockCircleOutlined aria-hidden />}
            onClick={e => {
              e.stopPropagation()
              if (
                pr.scheduleCurriculumGroupCount >=
                PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT
              ) {
                return
              }
              pr.onAddScheduleCurriculumGroup()
            }}
          >
            진행 그룹 구분 추가
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="medium"
            width={160}
            icon={<PlusOutlined aria-hidden />}
            onClick={e => {
              e.stopPropagation()
              pr.onAddScheduleCurriculumDetail()
            }}
          >
            강의 세부 일정 추가
          </CmsButton>
        </div>
      ),
    }
  }
  const isMulti = pr.sessionRoundType === 'multi'
  const curriculumAddDisabled = pr.restrictCurriculumSessionStructure === true
  const curriculumChartSessionAtMax =
    !isMulti && pr.curriculumChartSessionCount >= GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT
  return {
    ...heading,
    titleTrailing: (
      <CmsButton
        type="button"
        variant="secondary"
        size="medium"
        width={isMulti ? 160 : 180}
        disabled={curriculumAddDisabled || curriculumChartSessionAtMax}
        icon={<PlusOutlined aria-hidden />}
        onClick={e => {
          e.stopPropagation()
          if (curriculumAddDisabled || curriculumChartSessionAtMax) return
          if (isMulti) pr.onAddCurriculumSession()
          else pr.onAddCurriculumChartSession()
        }}
      >
        {isMulti ? '강의 진행 회차 추가' : '강의 진행 차시 추가'}
      </CmsButton>
    ),
  }
}

/** UJAT 프로그램 학교 신청 폼 — 학년 별 신청 정보 단락: 카드 제목 줄 우측「+ 신청 학년 추가」 */
export function withUjatProgramApplicationFormInstitutionGradeInfoTitleTrailing(
  heading: ParagraphCardEditableHeading,
  paragraph: WritingFormParagraph,
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
): ParagraphCardEditableHeading {
  const o = paragraphBodyOptions?.ujatProgramApplicationGradeInfo
  if (
    paragraphBodyOptions?.ujatProgramApplicationFormInstitution !== true ||
    paragraph.id !== UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo ||
    o == null
  ) {
    return heading
  }
  const applicationGradeAddEnabled = paragraphBodyOptions?.paragraphInteractionMode === 'user'
  return {
    ...heading,
    titleTrailing: (
      <CmsButton
        type="button"
        variant="secondary"
        size="medium"
        width={160}
        icon={<PlusOutlined aria-hidden />}
        disabled={!applicationGradeAddEnabled}
        onClick={e => {
          e.stopPropagation()
          if (!applicationGradeAddEnabled) return
          o.onAddApplicationGrade()
        }}
      >
        신청 학년 추가
      </CmsButton>
    ),
  }
}

/** UJAT 프로그램 학교 신청 폼 — 학년 별 수업 시간 단락: 카드 제목 줄 우측「수업 진행 시간 추가」 */
export function withUjatProgramApplicationFormInstitutionGradeClassTimeTitleTrailing(
  heading: ParagraphCardEditableHeading,
  paragraph: WritingFormParagraph,
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
): ParagraphCardEditableHeading {
  const o = paragraphBodyOptions?.ujatProgramApplicationGradeClassTime
  if (
    paragraphBodyOptions?.ujatProgramApplicationFormInstitution !== true ||
    paragraph.id !== UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime ||
    o == null
  ) {
    return heading
  }
  const classTimeAddEnabled = paragraphBodyOptions?.paragraphInteractionMode === 'user'
  return {
    ...heading,
    titleTrailing: (
      <CmsButton
        type="button"
        variant="secondary"
        size="medium"
        width={160}
        icon={<PlusOutlined aria-hidden />}
        disabled={!classTimeAddEnabled}
        onClick={e => {
          e.stopPropagation()
          if (!classTimeAddEnabled) return
          o.onAddClassTimeBlock()
        }}
      >
        수업 진행 시간 추가
      </CmsButton>
    ),
  }
}

/** 프로그램 봉사자 신청 폼 — 면접 진행 가능 일정 단락: 카드 제목 줄 우측「예외 일정 추가」 */
export function withProgramApplicationFormVolunteerTitleTrailing(
  heading: ParagraphCardEditableHeading,
  paragraph: WritingFormParagraph,
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
): ParagraphCardEditableHeading {
  const opts = paragraphBodyOptions?.programApplicationFormVolunteer
  const isRecruitVolunteerInterviewSchedule =
    paragraph.id === RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule ||
    paragraph.id === UJAT_RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule

  if (!isRecruitVolunteerInterviewSchedule || opts?.enabled !== true) {
    return heading
  }

  return {
    ...heading,
    titleTrailing: (
      <div
        className="volunteer-interview-available-schedule__card-title-actions"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
        role="presentation"
      >
        <CmsButton
          type="button"
          variant="secondary"
          size="medium"
          width={160}
          disabled={opts?.exceptionScheduleAddDisabled}
          icon={<PlusOutlined aria-hidden />}
          onClick={e => {
            e.stopPropagation()
            opts?.onAddExceptionSchedule?.()
          }}
        >
          예외 일정 추가
        </CmsButton>
      </div>
    ),
  }
}

/** 단락 헤더 설명 class 병합 — extra가 있으면 base에 없는 토큰만 덧붙임 */
export function mergeHeadingDescriptionClassName(
  base: string | undefined,
  extra: string | undefined
): string | undefined {
  if (extra == null || extra === '') return base
  const baseParts = (base ?? '').split(/\s+/).filter(Boolean)
  const merged = [...baseParts]
  for (const p of extra.split(/\s+/).filter(Boolean)) {
    if (!merged.includes(p)) merged.push(p)
  }
  return merged.length ? merged.join(' ') : undefined
}

export function isTitleWithPeriodParagraph(p: WritingFormParagraph): boolean {
  return p.kind === 'description' && p.variant === 'survey_title_with_period'
}

export function formCardTitleUsesPlaceholderTone(p: WritingFormParagraph): boolean {
  if (p.kind === 'description' && p.variant === 'survey_title_with_period') {
    return !p.paragraphTitle.trim() && !p.surveyTitle.trim()
  }
  if (p.kind === 'description' && p.variant === 'closing') {
    return !p.body.trim()
  }
  if (p.kind === 'description' && p.variant === 'static_description_lines') {
    return !p.paragraphTitle.trim()
  }
  if (isAgreementLockedSystemParagraph(p)) {
    return false
  }
  if (p.kind === 'description' && p.variant === 'system') {
    return !p.paragraphTitle.trim()
  }
  return !p.paragraphTitle.trim()
}

export function titleWithPeriodPlaceholder(editorKind: FormEditorKind): string {
  return editorKind === 'agreement' ? '동의서 제목 입력' : '타이틀을 입력해 주세요'
}

export function paragraphEditableHeading(
  paragraph: WritingFormParagraph,
  paragraphs: WritingFormParagraph[],
  titleNumbering: FormTitleNumberingStyle,
  isSelected: boolean,
  updateParagraph: FormEditorLeftPanelProps['updateParagraph'],
  editorKind: FormEditorKind,
  structureLockedParagraphIds?: ReadonlySet<string>,
  headingDescriptionExtraClassName?: string
) {
  const descCls = (base?: string) =>
    mergeHeadingDescriptionClassName(base, headingDescriptionExtraClassName)
  const prefix = getFormParagraphTitleNumberPrefix(paragraphs, paragraph, titleNumbering)
  const locked = structureLockedParagraphIds?.has(paragraph.id) ?? false

  if (locked) {
    if (paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period') {
      const p = paragraph as TitleWithPeriodParagraph
      const lectureReportLockedHeaderEditable =
        isSelected && LECTURE_REPORT_SEED_PARAGRAPH_IDS.has(p.id)
      return {
        isEditMode: lectureReportLockedHeaderEditable,
        titleIsEditMode: lectureReportLockedHeaderEditable,
        descriptionIsEditMode: lectureReportLockedHeaderEditable,
        titleValue: p.surveyTitle,
        onTitleChange: lectureReportLockedHeaderEditable
          ? (next: string) =>
              updateParagraph(p.id, cur =>
                cur.kind === 'description' && cur.variant === 'survey_title_with_period'
                  ? { ...cur, surveyTitle: next }
                  : cur
              )
          : () => {},
        titlePlaceholder: titleWithPeriodPlaceholder(editorKind),
        titleRequired: p.requiredMark,
        titleClassName: [
          'paragraph-input-explanation-title',
          formCardTitleUsesPlaceholderTone(paragraph) ? 'paragraph-card__title--placeholder' : '',
        ]
          .filter(Boolean)
          .join(' '),
        titleLeading: prefix,
        descriptionValue: p.surveyDescription,
        onDescriptionChange: lectureReportLockedHeaderEditable
          ? (next: string) =>
              updateParagraph(p.id, cur =>
                cur.kind === 'description' && cur.variant === 'survey_title_with_period'
                  ? { ...cur, surveyDescription: next }
                  : cur
              )
          : () => {},
        descriptionPlaceholder: '설명 입력',
        descriptionClassName: descCls('paragraph-input-explanation-title'),
      }
    }
    if (paragraph.kind === 'description' && paragraph.variant === 'static_description_lines') {
      const p = paragraph
      return {
        isEditMode: false,
        titleIsEditMode: false,
        descriptionIsEditMode: false,
        titleValue: p.paragraphTitle,
        onTitleChange: () => {},
        titlePlaceholder: '타이틀을 입력해 주세요',
        titleRequired: p.requiredMark,
        titleClassName: formCardTitleUsesPlaceholderTone(paragraph)
          ? 'paragraph-card__title--placeholder'
          : undefined,
        titleLeading: prefix,
        descriptionValue: normalizeCardDescriptionValue(p.id, p.paragraphDescription),
        onDescriptionChange: () => {},
        descriptionPlaceholder: '설명 입력',
        descriptionClassName: descCls(),
      }
    }
    if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
      const p = paragraph
      return {
        isEditMode: false,
        titleIsEditMode: false,
        titleValue: p.body,
        onTitleChange: () => {},
        titlePlaceholder: '마무리 문구를 입력해 주세요',
        titleRequired: p.requiredMark,
        titleClassName: [
          'paragraph-input--closing-body',
          formCardTitleUsesPlaceholderTone(paragraph) ? 'paragraph-card__title--placeholder' : '',
        ]
          .filter(Boolean)
          .join(' '),
        titleLeading: prefix,
        showDescription: false,
        descriptionValue: normalizeCardDescriptionValue(p.id, p.paragraphDescription),
        onDescriptionChange: () => {},
        descriptionPlaceholder: '설명 입력',
      }
    }
    if (paragraph.kind === 'single_item') {
      const p = paragraph
      const titleRequired =
        p.variant === 'horizontal_table'
          ? (p as HorizontalTableParagraph).answerRequired
          : p.variant === 'vertical_table'
            ? (p as VerticalTableParagraph).answerRequired
            : (p.answerRequired ?? p.requiredMark)
      const horizontalLockedHeaderEditable =
        locked &&
        isSelected &&
        p.variant === 'horizontal_table' &&
        editorKind === 'horizontal_table'
      const lectureReportLockedHeaderEditable =
        isSelected && LECTURE_REPORT_SEED_PARAGRAPH_IDS.has(p.id)
      const lockedDescriptionEditable =
        (horizontalLockedHeaderEditable &&
          (PROGRAM_PARTICIPANT_APPLICATION_SEED_PARAGRAPH_IDS.has(p.id) ||
            PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS.has(p.id) ||
            PROGRAM_APPLICATION_FORM_ECONOMY_SEED_PARAGRAPH_IDS.has(p.id) ||
            PROGRAM_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS.has(p.id) ||
            PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS.has(p.id) ||
            UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS.has(p.id) ||
            UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS.has(p.id) ||
            GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS.has(p.id) ||
            GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS.has(p.id) ||
            APPLICANT_RECRUIT_FORM_INDIVIDUAL_SEED_PARAGRAPH_IDS.has(p.id) ||
            APPLICANT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS.has(p.id) ||
            RECRUIT_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS.has(p.id) ||
            RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS.has(p.id) ||
            UJAT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS.has(p.id) ||
            UJAT_RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS.has(p.id) ||
            PROGRAM_REGISTRATION_GENERAL_SEED_PARAGRAPH_IDS.has(p.id) ||
            UJAT_PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS.has(p.id))) ||
        lectureReportLockedHeaderEditable
      const titleIsEditMode = horizontalLockedHeaderEditable || lectureReportLockedHeaderEditable
      /* 잠금 시드: 기본은 설명 편집 불가, 일부 등록/신청·강의보고서 발급 폼 시드만 예외로 허용 */
      const descriptionIsEditMode = lockedDescriptionEditable
      return {
        isEditMode: false,
        titleIsEditMode,
        descriptionIsEditMode,
        titleValue: p.paragraphTitle,
        onTitleChange: titleIsEditMode
          ? (next: string) =>
              updateParagraph(p.id, cur =>
                cur.kind === 'single_item' && cur.id === p.id
                  ? { ...cur, paragraphTitle: next }
                  : cur
              )
          : () => {},
        titlePlaceholder: '타이틀을 입력해 주세요',
        titleRequired,
        titleClassName: formCardTitleUsesPlaceholderTone(paragraph)
          ? 'paragraph-card__title--placeholder'
          : undefined,
        titleLeading: prefix,
        descriptionValue: normalizeCardDescriptionValue(p.id, p.paragraphDescription),
        onDescriptionChange: descriptionIsEditMode
          ? (next: string) =>
              updateParagraph(p.id, cur =>
                cur.kind === 'single_item' && cur.id === p.id
                  ? { ...cur, paragraphDescription: next }
                  : cur
              )
          : () => {},
        descriptionPlaceholder: '설명 입력',
        descriptionClassName: descCls(),
      }
    }
  }

  if (paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period') {
    const p = paragraph as TitleWithPeriodParagraph
    return {
      isEditMode: isSelected,
      titleValue: p.surveyTitle,
      onTitleChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'survey_title_with_period'
            ? { ...cur, surveyTitle: next }
            : cur
        ),
      titlePlaceholder: titleWithPeriodPlaceholder(editorKind),
      titleRequired: p.requiredMark,
      titleClassName: [
        'paragraph-input-explanation-title',
        formCardTitleUsesPlaceholderTone(paragraph) ? 'paragraph-card__title--placeholder' : '',
      ]
        .filter(Boolean)
        .join(' '),
      titleLeading: prefix,
      descriptionValue: p.surveyDescription,
      onDescriptionChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'survey_title_with_period'
            ? { ...cur, surveyDescription: next }
            : cur
        ),
      descriptionPlaceholder: '설명 입력',
      descriptionClassName: descCls('paragraph-input-explanation-title'),
    }
  }

  if (paragraph.kind === 'description' && paragraph.variant === 'static_description_lines') {
    const p = paragraph
    return {
      isEditMode: isSelected,
      titleValue: p.paragraphTitle,
      onTitleChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'static_description_lines'
            ? { ...cur, paragraphTitle: next }
            : cur
        ),
      titlePlaceholder: '타이틀을 입력해 주세요',
      titleRequired: p.requiredMark,
      titleClassName: formCardTitleUsesPlaceholderTone(paragraph)
        ? 'paragraph-card__title--placeholder'
        : undefined,
      titleLeading: prefix,
      descriptionValue: normalizeCardDescriptionValue(p.id, p.paragraphDescription),
      onDescriptionChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'static_description_lines'
            ? { ...cur, paragraphDescription: next }
            : cur
        ),
      descriptionPlaceholder: '설명 입력',
      descriptionClassName: descCls(),
    }
  }

  if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
    const p = paragraph
    return {
      /* 카드 타이틀 줄 = 마무리 본문(body) — `ParagraphInput` title과 동일 UX, 우측 패널에는 유형만 */
      isEditMode: isSelected,
      titleValue: p.body,
      onTitleChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'closing' ? { ...cur, body: next } : cur
        ),
      titlePlaceholder: '마무리 문구를 입력해 주세요',
      titleRequired: p.requiredMark,
      titleClassName: [
        'paragraph-input--closing-body',
        formCardTitleUsesPlaceholderTone(paragraph) ? 'paragraph-card__title--placeholder' : '',
      ]
        .filter(Boolean)
        .join(' '),
      titleLeading: prefix,
      showDescription: false,
      descriptionValue: normalizeCardDescriptionValue(p.id, p.paragraphDescription),
      onDescriptionChange: () => {},
      descriptionPlaceholder: '설명 입력',
    }
  }

  if (paragraph.kind === 'description' && paragraph.variant === 'system') {
    const p = paragraph
    if (isAgreementLockedSystemParagraph(paragraph)) {
      return {
        isEditMode: false,
        titleValue: p.paragraphTitle,
        onTitleChange: () => {},
        titlePlaceholder: '타이틀을 입력해 주세요',
        titleRequired: p.requiredMark,
        titleClassName: undefined,
        titleLeading: prefix,
        showDescription: false,
        descriptionValue: '',
        onDescriptionChange: () => {},
        descriptionPlaceholder: '설명 입력',
      }
    }
    return {
      isEditMode: isSelected,
      titleValue: p.paragraphTitle,
      onTitleChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'system'
            ? { ...cur, paragraphTitle: next }
            : cur
        ),
      titlePlaceholder: '타이틀을 입력해 주세요',
      titleRequired: p.requiredMark,
      titleClassName: formCardTitleUsesPlaceholderTone(paragraph)
        ? 'paragraph-card__title--placeholder'
        : undefined,
      titleLeading: prefix,
      descriptionValue: normalizeCardDescriptionValue(p.id, p.paragraphDescription),
      onDescriptionChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'description' && cur.variant === 'system'
            ? { ...cur, paragraphDescription: next }
            : cur
        ),
      descriptionPlaceholder: '설명 입력',
      descriptionClassName: descCls(),
    }
  }

  if (paragraph.kind === 'single_item') {
    const p = paragraph
    const titleRequired =
      p.variant === 'horizontal_table'
        ? (p as HorizontalTableParagraph).answerRequired
        : p.variant === 'vertical_table'
          ? (p as VerticalTableParagraph).answerRequired
          : (p.answerRequired ?? p.requiredMark)
    return {
      isEditMode: isSelected,
      titleValue: p.paragraphTitle,
      onTitleChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'single_item' && cur.id === p.id ? { ...cur, paragraphTitle: next } : cur
        ),
      titlePlaceholder: '타이틀을 입력해 주세요',
      titleRequired,
      titleClassName: formCardTitleUsesPlaceholderTone(paragraph)
        ? 'paragraph-card__title--placeholder'
        : undefined,
      titleLeading: prefix,
      descriptionValue: normalizeCardDescriptionValue(p.id, p.paragraphDescription),
      onDescriptionChange: (next: string) =>
        updateParagraph(p.id, cur =>
          cur.kind === 'single_item' && cur.id === p.id
            ? { ...cur, paragraphDescription: next }
            : cur
        ),
      descriptionPlaceholder: '설명 입력',
      descriptionClassName: descCls(),
    }
  }

  return undefined
}
