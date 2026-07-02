import {
  FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID,
  normalizeHorizontalTableParagraph,
  normalizeVerticalTableParagraph,
  type AgreementSystemBodyDisplayMode,
  type FormEditorKind,
  type HorizontalTableRowSelection,
  type SubjectiveParagraph,
  type LectureReportProgramProgressParagraph,
  type UjatJournalEducationInfoParagraph,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { ExplanationSystem } from '@/features/template/ui/paragraph/explanation/system'
import { StaticDescriptionLines } from '@/features/template/ui/paragraph/explanation/static-description-lines'
import {
  ExplanationText,
  type ExplanationTextBodyDisplayMode,
} from '@/features/template/ui/paragraph/explanation/text'
import { ExplanationTitle } from '@/features/template/ui/paragraph/explanation/title'
import { ExplanationSurveyPeriodReadonly } from '@/features/template/ui/paragraph/explanation/survey-period-readonly'
import { DateField } from '@/features/template/ui/paragraph/single-item/date'
import { TimeField } from '@/features/template/ui/paragraph/single-item/time'
import { Dropdown } from '@/features/template/ui/paragraph/single-item/dropdown'
import { FileAttachment } from '@/features/template/ui/paragraph/single-item/file-attachment'
import { IdTypeWithInput } from '@/features/template/ui/paragraph/single-item/id-type-with-input'
import { MultipleChoice } from '@/features/template/ui/paragraph/single-item/multiple-choice'
import { ScaleType } from '@/features/template/ui/paragraph/single-item/scale-type'
import { HorizontalTableParagraphBody } from '@/features/template/ui/paragraph/table/horizontal-table-paragraph-body'
import { VerticalTableParagraphBody } from '@/features/template/ui/paragraph/table/vertical-table-paragraph-body'
import { ScoreSelectParagraphBody } from '@/features/template/ui/paragraph/single-item/score-select-paragraph-body'
import { SessionPlanShortEssay } from '@/features/template/ui/paragraph/single-item/session-plan-short-essay'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { ProgramApplicationFormInstitutionScheduleParagraph } from '@/features/template/ui/form-set/application-form/institution/paragraphs/institution-schedule-paragraph'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { ProgramApplicationFormIndividualScheduleParagraph } from '@/features/template/ui/form-set/application-form/individual/paragraphs/individual-schedule-paragraph'
import {
  mergeSubjectiveFromShortEssayEdit,
  ShortEssay,
  subjectiveParagraphToShortEssayView,
} from '@/features/template/ui/paragraph/single-item/short-essay'
import { StarRate } from '@/features/template/ui/paragraph/single-item/star-rate'
import {
  UserInfo,
  type UserInfoPreviewValues,
} from '@/features/template/ui/paragraph/single-item/user-info'
import { LectureReportProgramProgress } from '@/features/template/ui/paragraph/single-item/lecture-report-program-progress'
import {
  UjatJournalEducationInfo,
  type UjatJournalEducationInfoAutofill,
} from '@/features/template/ui/paragraph/single-item/ujat-journal-education-info'
import { UserProfileParagraphBody } from '@/features/template/ui/paragraph/single-item/user-profile-paragraph-body'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'
import {
  isFormPreviewReadonlyMode,
  isFormUserLikeVisibleMode,
} from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'
import type { PaymentStatementCalculationLinesViewModel } from '@/features/template/model/lecture-fee-calculation-lines-sample'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/detail-forms/lecture-fee-calculation-detail-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import { BasicInfoParagraph } from '@/features/template/ui/form-set/payment-statement-issuance/paragraphs/basic-info-paragraph'
import type { ProgramRegistrationParagraphBodyOptions } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type { ProgramApplicationFormInstructorBodyOptions } from '@/features/template/ui/form-set/application-form/instructor/paragraph-body'
import type { ProgramApplicationFormVolunteerBodyOptions } from '@/features/template/ui/form-set/application-form/volunteer/paragraph-body'
import type { UjatProgramApplicationVolunteerBodyOptions } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraph-body'
import type {
  UjatProgramApplicationGradeClassTimeParagraphOptions,
  UjatProgramApplicationGradeInfoParagraphOptions,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-program-application-institution-body-options'

export type { ProgramApplicationFormInstructorBodyOptions }
export type { ProgramApplicationFormVolunteerBodyOptions }
export type { UjatProgramApplicationVolunteerBodyOptions }
export type { UjatProgramApplicationGradeClassTimeParagraphOptions }
export type { UjatProgramApplicationGradeInfoParagraphOptions }

export type FormUpdateParagraph = (
  id: string,
  updater: (p: WritingFormParagraph) => WritingFormParagraph
) => void

export type { ParagraphBodyInteractionMode }

export type RenderFormParagraphBodyOptions = {
  horizontalTableRowSelection?: HorizontalTableRowSelection | null
  onHorizontalTableRowSelectionChange?: (next: HorizontalTableRowSelection | null) => void
  /** 세로형 테이블 본문 행 선택(캔버스) — 폼 에디터에서 단일 전역 */
  verticalTableRowSelection?: number | null
  onVerticalTableRowSelectionChange?: (row: number | null) => void
  singleItemListActiveItemId?: string | null
  onSelectSingleItemListItem?: (itemId: string | null) => void
  /** 동의 시스템 단락(날짜·서명) — 기본 authoring; 응답 앱에서 write 전달 */
  agreementSystemDisplayMode?: AgreementSystemBodyDisplayMode
  agreementSystemParticipantName?: string
  agreementSystemNow?: Date
  /**
   * 기본 authoring.
   * - user: 카드 선택은 유지(우측 패널 등)하되, 본문 입력은 카드 비선택에서도 가능(`isBodyInteractive`).
   * - preview: user와 동일하게 본문 노출, 입력은 전부 비활성(프로그램 상세 신청 정보 미리보기).
   */
  paragraphInteractionMode?: ParagraphBodyInteractionMode
  /** id 포함 시 본문·표 편집 비활성(템플릿 고정 단락) */
  structureLockedParagraphIds?: ReadonlySet<string>
  /** 지급조서(발급용) 고정 단락 미리 채움 — 목 또는 발급 대상 회원 매핑 */
  paymentStatementBasicInfoValues?: Partial<PaymentStatementBasicInfoAutofillValues>
  /** true: 지급조서 기본정보에서 「지급 목적」만 비활성, 나머지 필드는 편집 가능(사전 동의 템플릿 등) */
  paymentStatementBasicInfoOnlyPaymentPurposeLocked?: boolean
  /** 강의비 산출 정보 단락 미리 채움 */
  lectureFeeCalculationValues?: Partial<LectureFeeCalculationAutofillValues>
  /** 강의비 산출 내역 단락 — 발급용 테이블 목·실데이터 */
  paymentStatementCalculationLines?: PaymentStatementCalculationLinesViewModel
  /** 지급조서 A4 문서 렌더링 시 disabled 입력 UI를 정적 텍스트로 전환 */
  paymentStatementDisplayMode?: PaymentStatementIssuanceParagraphDisplayMode
  /** 일반 프로그램 등록폼 전용 단락 본문 상태 */
  programRegistration?: ProgramRegistrationParagraphBodyOptions
  /** UJAT 프로그램 등록 폼 시드 단락 — `DetailInfoForm` 본문 */
  ujatProgramRegistration?: boolean
  /** 프로그램 참여자 신청 폼 (학교) 시드 단락 — `DetailInfoForm` 본문 */
  programApplicationFormInstitution?: boolean
  /** 1사1교 프로그램 참여자 신청 폼 시드 단락 — `DetailInfoForm` 본문 */
  programApplicationFormEconomyInstitution?: boolean
  /** 교육받은 교사 프로그램 참여자 신청 폼 시드 단락 — `DetailInfoForm` 본문 */
  programApplicationFormTrainedTeachersInstitution?: boolean
  /** Gemini 찾아가는 연수 학교 신청 폼 시드 단락 — 전용 본문 */
  programApplicationFormGeminiInstitution?: boolean
  /** Gemini 찾아가는 연수 강사 신청 폼 시드 단락 — 전용 본문 */
  programApplicationFormGeminiInstructor?: boolean
  /** UJAT 프로그램 학교 신청 폼 시드 단락 — `DetailInfoForm` 본문 */
  ujatProgramApplicationFormInstitution?: boolean
  /** UJAT 프로그램 봉사자 신청 폼 시드 단락 — `DetailInfoForm` 본문 */
  ujatProgramApplicationFormVolunteer?: UjatProgramApplicationVolunteerBodyOptions
  /** UJAT 프로그램 학교 신청 폼 — 학년 별 신청 정보(블록 수·카드 헤더「+ 신청 학년 추가」) */
  ujatProgramApplicationGradeInfo?: UjatProgramApplicationGradeInfoParagraphOptions
  /** UJAT 프로그램 학교 신청 폼 — 학년 별 수업 시간(블록·카드 헤더「수업 진행 시간 추가」) */
  ujatProgramApplicationGradeClassTime?: UjatProgramApplicationGradeClassTimeParagraphOptions
  /** 프로그램 참여자 모집 폼 (학교) 시드 단락 — `DetailInfoForm` 본문 */
  applicantRecruitFormInstitution?: boolean
  /** 참여자 모집 폼 — 학교/기관 대상일 때만 최대 강사·학급·일정·차시 입력 */
  showInstitutionApplicationLimits?: boolean
  applicantRecruitInstitutionLayoutVariant?: import('@/features/template/ui/form-set/recruit-form/institution/paragraph-body').ApplicantRecruitFormInstitutionParagraphBodyOptions['layoutVariant']
  applicantRecruitInstitutionDefaults?: import('@/features/template/ui/form-set/recruit-form/institution/paragraph-body').ApplicantRecruitFormInstitutionParagraphBodyOptions['defaults']
  /** UJAT 프로그램 학교 모집 폼 시드 단락 — `DetailInfoForm` 본문 */
  ujatRecruitFormInstitution?: boolean
  /** 프로그램 참여자 모집 폼 (개인) 시드 단락 — `DetailInfoForm` 본문 */
  applicantRecruitFormIndividual?: boolean
  /** 프로그램 강사 모집 폼 시드 단락 — `DetailInfoForm` 본문 */
  recruitFormInstructor?: boolean
  /** 프로그램 봉사자 모집 폼 시드 단락 — `DetailInfoForm` 본문 */
  recruitFormVolunteer?: boolean
  /** UJAT 프로그램 봉사자 모집 폼 시드 단락 — `DetailInfoForm` 본문 */
  ujatRecruitFormVolunteer?: boolean
  ujatRecruitParagraphProps?: import('@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props').UjatRecruitParagraphProps
  /** 프로그램 참여자 신청 폼 (개인) 템플릿 편집용 UI */
  programApplicationFormIndividual?: boolean
  /** 프로그램 강사 신청 폼 시드 단락 — 전용 본문·제목 행 액션 */
  programApplicationFormInstructor?: ProgramApplicationFormInstructorBodyOptions
  /** 프로그램 봉사자 신청 폼 시드 단락 — 전용 본문 */
  programApplicationFormVolunteer?: ProgramApplicationFormVolunteerBodyOptions
  /** UJAT 교육일지 교육 정보 단락 — 담당 학교명 등 자동 표시 */
  ujatJournalEducationInfoAutofill?: UjatJournalEducationInfoAutofill | null
  /** user_info 단락 미리보기 셀 값 — UJAT 문서 뷰어의 선택 봉사자 정보 등 */
  userInfoPreviewValues?: UserInfoPreviewValues
  /** A4 문서 본문 스코프 클래스 — 템플릿별 preview CSS 오버라이드 */
  documentPreviewClassName?: string
  /**
   * 구조 잠금 + 작성(authoring)일 때도 객관식·가로형 하단 동의 라디오 등 선택 UI만 조작 가능(미리 체크).
   * 프로그램 참여자 신청 폼 등 고정 단락 템플릿용.
   */
  structureLockedAuthoringChoicePreview?: boolean
  /** 현재 조건에 따라 숨겨야 하는 단락 id 목록(에디터/미리보기 공통) */
  hiddenParagraphIds?: ReadonlySet<string>
  /**
   * 프로그램 상세 신청 양식 수정·미리보기 — 기관 「진행 희망 교육 일정」에
   * 템플릿 설정 힌트 대신 프로그램 연동 UI 노출
   */
  programLinkedInstitutionApplicationForm?: boolean
  /** 프로그램 상세 신청 양식 수정·미리보기 — 개인 「진행 희망 교육 일정」 연동 */
  programLinkedIndividualApplicationForm?: boolean
  /** 강의 평가 등 — 설문 기간을 기간 피커 대신 지정 텍스트로 표시 */
  surveyPeriodReadonly?: boolean
}

export function renderFormParagraphBody(
  p: WritingFormParagraph,
  updateParagraph: FormUpdateParagraph,
  isParagraphSelected: boolean,
  _editorKind: FormEditorKind = 'survey',
  options?: RenderFormParagraphBodyOptions
) {
  const paragraphInteractionMode = options?.paragraphInteractionMode ?? 'authoring'
  const isUserLikeVisible = isFormUserLikeVisibleMode(paragraphInteractionMode)
  const isPreviewReadonly = isFormPreviewReadonlyMode(paragraphInteractionMode)
  const isCardSelected = isParagraphSelected
  const structureLocked = options?.structureLockedParagraphIds?.has(p.id) ?? false
  /**
   * 구조 잠금: 작성(authoring)에서는 카드 선택만으로는 본문 편집 불가.
   * 미리보기(`user`)에서는 잠긴 시드도 입력 가능. `preview`는 항상 비활성.
   */
  const isBodyInteractive = isPreviewReadonly
    ? false
    : structureLocked
      ? paragraphInteractionMode === 'user'
      : paragraphInteractionMode === 'user' || isParagraphSelected
  const lockedAuthoringChoicePreview =
    structureLocked &&
    paragraphInteractionMode === 'authoring' &&
    options?.structureLockedAuthoringChoicePreview === true
  switch (p.variant) {
    case 'survey_title_with_period':
      if (!isCardSelected && !isUserLikeVisible) return null
      if (!(p.showWritingPeriodOnForm ?? false)) return null
      if (options?.surveyPeriodReadonly) {
        return (
          <ExplanationSurveyPeriodReadonly
            startAt={p.startAt}
            endAt={p.endAt}
            periodLabel="작성 기간"
          />
        )
      }
      const titlePeriodEditMode = isUserLikeVisible || isParagraphSelected
      return (
        <ExplanationTitle
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={titlePeriodEditMode}
        />
      )
    case 'user_profile':
      return (
        <UserProfileParagraphBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
        />
      )
    case 'score_select':
      return (
        <ScoreSelectParagraphBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
        />
      )
    case 'subjective': {
      const sp = p as SubjectiveParagraph
      const view = subjectiveParagraphToShortEssayView(sp)
      return (
        <ShortEssay
          paragraph={view}
          onChange={next =>
            updateParagraph(sp.id, () => mergeSubjectiveFromShortEssayEdit(sp, next))
          }
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
          activeItemId={options?.singleItemListActiveItemId}
          onSelectItem={options?.onSelectSingleItemListItem}
        />
      )
    }
    case 'agreement_explanation_text': {
      const isPaymentPreConsentIntro =
        p.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.intro &&
        paragraphInteractionMode === 'authoring' &&
        structureLocked
      const isPaymentPreConsentWhiteSheetBar =
        (p.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine ||
          p.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm) &&
        paragraphInteractionMode === 'authoring' &&
        structureLocked
      const shouldRenderDisabledPlaceholder =
        paragraphInteractionMode === 'authoring' &&
        structureLocked &&
        (p.paragraphTitle?.trim().length ?? 0) > 0
      /* 작성(authoring) + 구조 잠금 + 라벨 있는 설명글_텍스트형 (예: 행정정보 공동이용 동의서의 이용기관 명칭/이용사무) —
         응답자가 채우는 영역이므로 편집 화면에서는 Disabled 입력 박스로 통일.
         `bodyText`가 비어 있으면 빈 박스(이용기관 명칭), 채워져 있으면 같은 박스 안에 default 텍스트 노출(이용사무). */
      let explanationBodyDisplayMode: ExplanationTextBodyDisplayMode = 'input'
      if (isPaymentPreConsentIntro || isPaymentPreConsentWhiteSheetBar) {
        explanationBodyDisplayMode = 'static-body'
      } else if (shouldRenderDisabledPlaceholder) {
        explanationBodyDisplayMode = 'disabled-placeholder'
      }
      return (
        <ExplanationText
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
          bodyDisplayMode={explanationBodyDisplayMode}
        />
      )
    }
    case 'horizontal_table': {
      const hp = normalizeHorizontalTableParagraph(
        p as Extract<WritingFormParagraph, { variant: 'horizontal_table' }>
      )
      /* 필드형: 단락 카드 비선택이어도 셀 인풋·피커 유지. 구조 잠금 시 작성 모드에서는 편집 불가, 미리보기(user)는 예외 */
      const isEditMode =
        !isPreviewReadonly &&
        (!structureLocked || paragraphInteractionMode === 'user') &&
        (paragraphInteractionMode === 'user' || isParagraphSelected || hp.tableFlavor === 'field')
      /** 표 격자·헤더 행 선택(민트 스트로크) — 작성(authoring) + 구조 미잠금에서만 */
      const tableCanvasInteractive =
        !structureLocked && paragraphInteractionMode === 'authoring'
      return (
        <HorizontalTableParagraphBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isEditMode}
          tableCanvasInteractive={tableCanvasInteractive}
          bottomConsentPreviewInAuthoring={lockedAuthoringChoicePreview}
          tableRowSelection={options?.horizontalTableRowSelection}
          onTableRowSelectionChange={options?.onHorizontalTableRowSelectionChange}
          paymentStatementBasicInfoValues={options?.paymentStatementBasicInfoValues}
          paymentStatementBasicInfoOnlyPaymentPurposeLocked={
            options?.paymentStatementBasicInfoOnlyPaymentPurposeLocked
          }
          lectureFeeCalculationValues={options?.lectureFeeCalculationValues}
          paymentStatementCalculationLines={options?.paymentStatementCalculationLines}
          paymentStatementDisplayMode={options?.paymentStatementDisplayMode}
          programRegistration={options?.programRegistration}
          ujatProgramRegistration={options?.ujatProgramRegistration}
          programApplicationFormInstitution={options?.programApplicationFormInstitution}
          programApplicationFormEconomyInstitution={
            options?.programApplicationFormEconomyInstitution
          }
          programApplicationFormTrainedTeachersInstitution={
            options?.programApplicationFormTrainedTeachersInstitution
          }
          programApplicationFormGeminiInstitution={options?.programApplicationFormGeminiInstitution}
          programApplicationFormGeminiInstructor={options?.programApplicationFormGeminiInstructor}
          ujatProgramApplicationFormInstitution={options?.ujatProgramApplicationFormInstitution}
          ujatProgramApplicationFormVolunteer={options?.ujatProgramApplicationFormVolunteer}
          ujatProgramApplicationGradeInfo={options?.ujatProgramApplicationGradeInfo}
          ujatProgramApplicationGradeClassTime={options?.ujatProgramApplicationGradeClassTime}
          applicantRecruitFormInstitution={options?.applicantRecruitFormInstitution}
          showInstitutionApplicationLimits={options?.showInstitutionApplicationLimits}
          applicantRecruitInstitutionLayoutVariant={
            options?.applicantRecruitInstitutionLayoutVariant
          }
          applicantRecruitInstitutionDefaults={options?.applicantRecruitInstitutionDefaults}
          ujatRecruitFormInstitution={options?.ujatRecruitFormInstitution}
          applicantRecruitFormIndividual={options?.applicantRecruitFormIndividual}
          recruitFormInstructor={options?.recruitFormInstructor}
          recruitFormVolunteer={options?.recruitFormVolunteer}
          ujatRecruitFormVolunteer={options?.ujatRecruitFormVolunteer}
          ujatRecruitParagraphProps={options?.ujatRecruitParagraphProps}
          programApplicationFormInstructor={
            options?.programApplicationFormInstructor == null
              ? undefined
              : {
                  ...options.programApplicationFormInstructor,
                  isTemplateAuthoringMode:
                    paragraphInteractionMode === 'authoring' &&
                    options.programApplicationFormInstructor.programLinkedPreview !== true,
                  readOnlyPreview: isPreviewReadonly,
                }
          }
          programApplicationFormVolunteer={
            options?.programApplicationFormVolunteer == null
              ? undefined
              : {
                  ...options.programApplicationFormVolunteer,
                  isTemplateAuthoringMode:
                    paragraphInteractionMode === 'authoring' &&
                    options.programApplicationFormVolunteer.programLinkedPreview !== true,
                  readOnlyPreview: isPreviewReadonly,
                }
          }
          programApplicationFormIndividual={options?.programApplicationFormIndividual}
          paragraphInteractionMode={paragraphInteractionMode}
        />
      )
    }
    case 'ujat_journal_education_info': {
      const jp = p as UjatJournalEducationInfoParagraph
      return (
        <UjatJournalEducationInfo
          paragraph={jp}
          onChange={next => updateParagraph(jp.id, () => next)}
          isEditMode={isBodyInteractive}
          autofill={options?.ujatJournalEducationInfoAutofill}
        />
      )
    }
    case 'lecture_report_program_progress': {
      const lr = p as LectureReportProgramProgressParagraph
      return (
        <LectureReportProgramProgress
          paragraph={lr}
          onChange={next => updateParagraph(lr.id, () => next)}
          isEditMode={isBodyInteractive}
        />
      )
    }
    case 'vertical_table': {
      if (p.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.paymentRecord) {
        return (
          <BasicInfoParagraph
            values={options?.paymentStatementBasicInfoValues}
            displayMode={options?.paymentStatementDisplayMode ?? 'editor'}
            onlyPaymentPurposeLocked={options?.paymentStatementBasicInfoOnlyPaymentPurposeLocked}
          />
        )
      }
      const vp = normalizeVerticalTableParagraph(
        p as Extract<WritingFormParagraph, { variant: 'vertical_table' }>
      )
      const dateTimeCellsInteractive = isBodyInteractive || lockedAuthoringChoicePreview
      const tableCanvasInteractive =
        !structureLocked && paragraphInteractionMode === 'authoring'
      return (
        <VerticalTableParagraphBody
          paragraph={vp}
          onChange={next => updateParagraph(p.id, () => normalizeVerticalTableParagraph(next))}
          isEditMode={isBodyInteractive}
          dateTimeCellsInteractive={dateTimeCellsInteractive}
          tableCanvasInteractive={tableCanvasInteractive}
          tableRowSelection={options?.verticalTableRowSelection}
          onTableRowSelectionChange={options?.onVerticalTableRowSelectionChange}
        />
      )
    }
    case 'system': {
      if (
        p.kind === 'description' &&
        p.variant === 'system' &&
        (p.systemPreset === 'agreement_date' || p.systemPreset === 'agreement_signature')
      ) {
        return (
          <ExplanationSystem
            paragraph={p}
            onChange={next => updateParagraph(p.id, () => next)}
            isEditMode={isBodyInteractive}
            displayMode={options?.agreementSystemDisplayMode ?? 'authoring'}
            participantName={options?.agreementSystemParticipantName}
            now={options?.agreementSystemNow}
          />
        )
      }
      return null
    }
    case 'closing':
      return null
    case 'static_description_lines':
      if (p.kind !== 'description' || p.variant !== 'static_description_lines') return null
      return <StaticDescriptionLines paragraph={p} />
    case 'short_essay':
      return (
        <ShortEssay
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
          activeItemId={options?.singleItemListActiveItemId}
          onSelectItem={options?.onSelectSingleItemListItem}
        />
      )
    case 'session_plan_short_essay':
      return (
        <SessionPlanShortEssay
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
          activeItemId={options?.singleItemListActiveItemId}
          onSelectItem={options?.onSelectSingleItemListItem}
        />
      )
    case 'multiple_choice': {
      if (
        options?.programApplicationFormInstitution === true &&
        p.id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice
      ) {
        return (
          <ProgramApplicationFormInstitutionScheduleParagraph
            readOnlyPreview={isPreviewReadonly}
            isTemplateAuthoringMode={
              paragraphInteractionMode === 'authoring' &&
              options?.programLinkedInstitutionApplicationForm !== true
            }
          />
        )
      }
      if (
        options?.programApplicationFormIndividual === true &&
        p.id === PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice
      ) {
        return (
          <ProgramApplicationFormIndividualScheduleParagraph
            readOnlyPreview={isPreviewReadonly}
            isTemplateAuthoringMode={
              paragraphInteractionMode === 'authoring' &&
              options?.programLinkedIndividualApplicationForm !== true
            }
          />
        )
      }
      const usesMcItemsFocus = options?.onSelectSingleItemListItem != null
      const itemsEditActive = usesMcItemsFocus
        ? isCardSelected &&
          options?.singleItemListActiveItemId === FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID
        : isCardSelected
      return (
        <MultipleChoice
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive || lockedAuthoringChoicePreview}
          paragraphInteractionMode={paragraphInteractionMode}
          itemsEditActive={itemsEditActive}
          onActivateItemsEditor={
            usesMcItemsFocus
              ? () =>
                  options!.onSelectSingleItemListItem!(FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID)
              : undefined
          }
        />
      )
    }
    case 'dropdown':
      return (
        <Dropdown
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
        />
      )
    case 'date':
      return (
        <DateField
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
        />
      )
    case 'time':
      return (
        <TimeField
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
        />
      )
    case 'star_rate':
      return (
        <StarRate
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
        />
      )
    case 'scale_type':
      return (
        <ScaleType
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
        />
      )
    case 'user_info':
      return (
        <UserInfo
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
          layout={isUserLikeVisible ? 'previewTable' : 'chips'}
          previewValues={options?.userInfoPreviewValues}
        />
      )
    case 'file_attachment':
      return (
        <FileAttachment
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
        />
      )
    case 'id_type_with_input':
      if (p.kind !== 'single_item' || p.variant !== 'id_type_with_input') return null
      return (
        <IdTypeWithInput
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
        />
      )
  }
}
