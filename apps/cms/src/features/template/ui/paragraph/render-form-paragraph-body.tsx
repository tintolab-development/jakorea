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
import { ExplanationText } from '@/features/template/ui/paragraph/explanation/text'
import { ExplanationTitle } from '@/features/template/ui/paragraph/explanation/title'
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
import {
  mergeSubjectiveFromShortEssayEdit,
  ShortEssay,
  subjectiveParagraphToShortEssayView,
} from '@/features/template/ui/paragraph/single-item/short-essay'
import { StarRate } from '@/features/template/ui/paragraph/single-item/star-rate'
import { UserInfo } from '@/features/template/ui/paragraph/single-item/user-info'
import { LectureReportProgramProgress } from '@/features/template/ui/paragraph/single-item/lecture-report-program-progress'
import {
  UjatJournalEducationInfo,
  type UjatJournalEducationInfoAutofill,
} from '@/features/template/ui/paragraph/single-item/ujat-journal-education-info'
import { UserProfileParagraphBody } from '@/features/template/ui/paragraph/single-item/user-profile-paragraph-body'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/paragraph-body-interaction-mode'
import type { PaymentStatementCalculationLinesViewModel } from '@/features/template/model/lecture-fee-calculation-lines-sample'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/payment-statement-basic-info-detail-form'
import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/lecture-fee-calculation-detail-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'
import type { ProgramRegistrationParagraphBodyOptions } from '@/features/template/ui/form-set/program-registration-form/paragraph-body'

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
   * - user: 카드 전환 시 미리보기 초기화 등 편집 전용 부수 효과는 끔(단락 컴포넌트에서 `paragraphInteractionMode`로 분기).
   */
  paragraphInteractionMode?: ParagraphBodyInteractionMode
  /** id 포함 시 본문·표 편집 비활성(템플릿 고정 단락) */
  structureLockedParagraphIds?: ReadonlySet<string>
  /** 지급조서(발급용) 고정 단락 미리 채움 — 목 또는 발급 대상 회원 매핑 */
  paymentStatementBasicInfoValues?: Partial<PaymentStatementBasicInfoAutofillValues>
  /** 강의비 산출 정보 단락 미리 채움 */
  lectureFeeCalculationValues?: Partial<LectureFeeCalculationAutofillValues>
  /** 강의비 산출 내역 단락 — 발급용 테이블 목·실데이터 */
  paymentStatementCalculationLines?: PaymentStatementCalculationLinesViewModel
  /** 지급조서 A4 문서 렌더링 시 disabled 입력 UI를 정적 텍스트로 전환 */
  paymentStatementDisplayMode?: PaymentStatementIssuanceParagraphDisplayMode
  /** 일반 프로그램 등록폼 전용 단락 본문 상태 */
  programRegistration?: ProgramRegistrationParagraphBodyOptions
  /** 프로그램 참여자 신청 폼 (학교) 시드 단락 — `DetailInfoForm` 본문 */
  programApplicationFormInstitution?: boolean
  /** UJAT 교육일지 교육 정보 단락 — 담당 학교명 등 자동 표시 */
  ujatJournalEducationInfoAutofill?: UjatJournalEducationInfoAutofill | null
  /**
   * 구조 잠금 + 작성(authoring)일 때도 객관식·가로형 하단 동의 라디오 등 선택 UI만 조작 가능(미리 체크).
   * 프로그램 참여자 신청 폼 등 고정 단락 템플릿용.
   */
  structureLockedAuthoringChoicePreview?: boolean
}

export function renderFormParagraphBody(
  p: WritingFormParagraph,
  updateParagraph: FormUpdateParagraph,
  isParagraphSelected: boolean,
  editorKind: FormEditorKind = 'survey',
  options?: RenderFormParagraphBodyOptions
) {
  const paragraphInteractionMode = options?.paragraphInteractionMode ?? 'authoring'
  const isCardSelected = isParagraphSelected
  const structureLocked = options?.structureLockedParagraphIds?.has(p.id) ?? false
  /**
   * 구조 잠금: 작성(authoring)에서는 카드 선택만으로는 본문 편집 불가.
   * 미리보기(`user`)에서는 잠긴 시드도 입력 가능.
   */
  const isBodyInteractive = structureLocked
    ? paragraphInteractionMode === 'user'
    : paragraphInteractionMode === 'user' || isParagraphSelected
  const lockedAuthoringChoicePreview =
    structureLocked &&
    paragraphInteractionMode === 'authoring' &&
    options?.structureLockedAuthoringChoicePreview === true
  switch (p.variant) {
    case 'survey_title_with_period':
      if (!isCardSelected && paragraphInteractionMode !== 'user') return null
      if (!(p.showWritingPeriodOnForm ?? false)) return null
      const titlePeriodEditMode = structureLocked
        ? paragraphInteractionMode === 'user'
        : paragraphInteractionMode === 'user' || isParagraphSelected
      return (
        <ExplanationTitle
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={titlePeriodEditMode}
          periodLabel={editorKind === 'survey' ? '설문 기간' : undefined}
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
          onChange={next => updateParagraph(sp.id, () => mergeSubjectiveFromShortEssayEdit(sp, next))}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
          activeItemId={options?.singleItemListActiveItemId}
          onSelectItem={options?.onSelectSingleItemListItem}
        />
      )
    }
    case 'agreement_explanation_text': {
      /* 작성(authoring) + 구조 잠금 + 라벨 있는 설명글_텍스트형 (예: 행정정보 공동이용 동의서의 이용기관 명칭/이용사무) —
         응답자가 채우는 영역이므로 편집 화면에서는 Disabled 입력 박스로 통일.
         `bodyText`가 비어 있으면 빈 박스(이용기관 명칭), 채워져 있으면 같은 박스 안에 default 텍스트 노출(이용사무). */
      const explanationBodyDisplayMode =
        paragraphInteractionMode === 'authoring' &&
        structureLocked &&
        (p.paragraphTitle?.trim().length ?? 0) > 0
          ? 'disabled-placeholder'
          : 'input'
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
        (!structureLocked || paragraphInteractionMode === 'user') &&
        (paragraphInteractionMode === 'user' || isParagraphSelected || hp.tableFlavor === 'field')
      const tableCanvasInteractive = !structureLocked || paragraphInteractionMode === 'user'
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
          lectureFeeCalculationValues={options?.lectureFeeCalculationValues}
          paymentStatementCalculationLines={options?.paymentStatementCalculationLines}
          paymentStatementDisplayMode={options?.paymentStatementDisplayMode}
          programRegistration={options?.programRegistration}
          programApplicationFormInstitution={options?.programApplicationFormInstitution}
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
      const vp = normalizeVerticalTableParagraph(
        p as Extract<WritingFormParagraph, { variant: 'vertical_table' }>
      )
      return (
        <VerticalTableParagraphBody
          paragraph={vp}
          onChange={next => updateParagraph(p.id, () => normalizeVerticalTableParagraph(next))}
          isEditMode={isBodyInteractive}
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
              ? () => options!.onSelectSingleItemListItem!(FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID)
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
