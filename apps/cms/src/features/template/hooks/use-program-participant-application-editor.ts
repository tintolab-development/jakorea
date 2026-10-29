import type { ProgramParticipantApplicationEditorVariant } from '@jakorea/form-schema/template-registry'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

type UjatProgramApplicationVolunteerBodyOptions = NonNullable<
  RenderFormParagraphBodyOptions['ujatProgramApplicationFormVolunteer']
>

const INACTIVE_LEFT_PANEL_PARAGRAPH_BODY_OPTIONS: RenderFormParagraphBodyOptions = {
  structureLockedParagraphIds: new Set<string>(),
  structureLockedAuthoringChoicePreview: true,
}
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  createAgreementExplanationTextParagraphForInsert,
  duplicateMiddleParagraph,
  insertMiddleParagraphAfter,
  pickActiveParagraphIdAfterMiddleDelete,
  removeMiddleParagraph,
} from '@/features/template/lib/writing-form-middle-paragraph-mutations'
import {
  createApplicantRecruitFormIndividualDraft,
  APPLICANT_RECRUIT_FORM_INDIVIDUAL_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/applicant-recruit-form-individual-draft'
import {
  createApplicantRecruitFormInstitutionDraft,
  APPLICANT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/applicant-recruit-form-institution-draft'
import {
  createUjatRecruitFormInstitutionDraft,
  UJAT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/ujat-recruit-form-institution-draft'
import {
  createRecruitFormInstructorDraft,
  RECRUIT_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/recruit-form-instructor-draft'
import {
  createRecruitFormVolunteerDraft,
  RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/recruit-form-volunteer-draft'
import {
  createUjatRecruitFormVolunteerDraft,
  UJAT_RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/ujat-recruit-form-volunteer-draft'
import {
  createUjatProgramApplicationFormInstitutionDraft,
  migrateUjatProgramApplicationInstitutionParagraphs,
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/ujat-program-application-form-institution-draft'
import {
  createUjatProgramApplicationFormVolunteerDraft,
  migrateUjatProgramApplicationVolunteerChoiceParagraphs,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import {
  createGeminiVisitingTrainingApplicationFormInstructorDraft,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/gemini-visiting-training-application-form-instructor-draft'
import {
  createGeminiVisitingTrainingApplicationFormInstitutionDraft,
  migrateGeminiVisitingTrainingApplicationInstitutionParagraphs,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/gemini-visiting-training-application-form-institution-draft'
import {
  createGeminiVisitingTrainingRecruitFormDraft,
  GEMINI_VISITING_TRAINING_RECRUIT_FORM_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/gemini-visiting-training-recruit-form-draft'
import {
  createTrainedTeachersRecruitFormInstitutionDraft,
  TRAINED_TEACHERS_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/trained-teachers-recruit-form-institution-draft'
import {
  createEconomyRecruitFormInstitutionDraft,
  ECONOMY_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/economy-recruit-form-institution-draft'
import {
  createProgramApplicationFormInstitutionDraft,
  migrateProgramApplicationFormInstitutionParagraphs,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS,
  PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-application-form-institution-draft'
import {
  createProgramApplicationFormEconomyDraft,
  migrateProgramApplicationFormEconomyParagraphs,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS,
  PROGRAM_APPLICATION_FORM_ECONOMY_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-application-form-economy-draft'
import {
  createProgramApplicationFormTrainedTeachersDraft,
  migrateProgramApplicationFormTrainedTeachersParagraphs,
  PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-application-form-trained-teachers-draft'
import {
  createProgramApplicationFormInstructorDraft,
  migrateProgramApplicationFormInstructorParagraphs,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-application-form-instructor-draft'
import {
  createProgramApplicationFormVolunteerDraft,
  migrateProgramApplicationFormVolunteerParagraphs,
  PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-application-form-volunteer-draft'
import {
  createProgramParticipantApplicationDraft,
  migrateProgramParticipantApplicationParagraphs,
  PROGRAM_PARTICIPANT_APPLICATION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-application-form-individual-draft'
import {
  normalizeWritingFormDraft,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'
import {
  applyOperationalOverlayForCatalogId,
  collectOperationalOverlayForCatalogId,
  resetOperationalOverlayForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import { peekTrainedTeachersRegistrationRhf } from '@/features/program/trained-teachers/lib/registration-rhf-api'
import { peekCompanySchoolRegistrationRhf } from '@/features/program/1c-1s/lib/registration-rhf-api'
import { setOperationalOverlayScope } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  applyParticipantApplicationEditorState,
  buildParticipantApplicationEditorState,
  ujatApplicationInstitutionBlockIdsFromOverlay,
} from '@/features/template/lib/participant-application-editor-state'
import { useFormTemplateSaveFeedback } from '@/features/template/lib/form-template-save-feedback'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import {
  canReorderParticipantApplicationParagraphs,
  isCatalogOriginalWritingTemplate,
  isWritingFormTemplateStructureLocked,
} from '@/features/template/lib/form-template-delete-policy'
import { useWritingFormMiddleParagraphActions } from '@/features/template/hooks/use-writing-form-middle-paragraph-actions'
import { EMPTY_WRITING_FORM_DRAFT } from '@/features/template/lib/empty-writing-form-draft'
import { forceParagraphTitleRequired } from '@/features/template/lib/paragraph-required-mark'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
} from '@/features/template/lib/writing-form-template-local-save'
import {
  loadUjatRecruitInstitutionTemplateSave,
  loadUjatRecruitVolunteerTemplateSave,
  persistUjatRecruitInstitutionTemplateSave,
  persistUjatRecruitVolunteerTemplateSave,
} from '@/features/program/ujat/lib/ujat-recruit-template-local-save'
import { peekUjatProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { getProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE } from '@/features/template/lib/program-registration-editor-state'
import { coalesceUjatRecruitOverlay } from '@/features/program/ujat/lib/ujat-recruit-overlay-coalesce'
import { pickUjatRecruitInstitutionOverlay } from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import { pickUjatRecruitVolunteerOverlay } from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import {
  getUjatRecruitInstitutionOverlayRecord,
  replaceUjatRecruitInstitutionOverlay,
  resetUjatRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  getUjatRecruitVolunteerOverlayRecord,
  replaceUjatRecruitVolunteerOverlay,
  resetUjatRecruitVolunteerOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import {
  resetGeminiRecruitForm,
  restoreGeminiRecruitForm,
} from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-form-rhf'
import {
  getApplicantRecruitInstitutionOverlayRecord,
  patchApplicantRecruitInstitutionOverlay,
  replaceApplicantRecruitInstitutionOverlay,
  resetApplicantRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
// TODO(P2→P5-d): 활성 스코프 getGeneralRecruitOverlayRecord() 호출 5곳(hydrate 병합)은 ESLint warn으로 남겨 둔다.
// 저장 경로를 모집 RHF/peek…ForScope로 바꾸면서 제거한다(overlay 제거 계획 P5-d, 규칙은 P8에서 error).
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  readLiveGeneralRecruitOverlayRecord,
  subscribeGeneralRecruitOverlayKey,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { subscribeGeneralRegistrationWizardRhf } from '@/features/program/general/lib/overlay-phase1/registration-wizard-rhf-api'
import {
  beginRecruitDetailContentReset,
  commitRecruitDetailContentReset,
  consumeWizardContentResetPending,
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay,
  peekWizardContentResetPending,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import { awaitRecruitDetailMediaUploads } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import {
  overlayEntriesAbsentFromLive,
  recruitDetailInfoOverlayPrefixForEditorVariant,
  replaceRecruitDetailInfoIntoGeneralStore,
  replaceUjatVolunteerRecruitGeneralStoreSidecar,
  restoreRecruitDetailInfoIntoGeneralStore,
  restoreUjatVolunteerRecruitGeneralStoreSidecar,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-overlay'
import { getRecruitVolunteerHiddenParagraphIds } from '@/features/template/ui/form-set/recruit-form/shared/recruit-volunteer-form-visibility'
import {
  getGeneralApplicationOverlayRecord,
  patchGeneralApplicationOverlay,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS,
  getUjatApplicationInstitutionOverlayRecord,
  resetUjatApplicationInstitutionOverlay,
  updateUjatApplicationInstitutionOverlayKey,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import type {
  UjatApplicationClassTimePeriods,
  UjatApplicationGradeDetail,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import {
  resetUjatApplicationVolunteerOverlay,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import {
  shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph,
  useInstitutionApplicationFormVisibilityVersion,
} from '@/features/program/general/lib/institution-application-form-visibility'
import {
  getInstitutionApplicationFormHiddenParagraphIds,
  isInstitutionApplicationBridgeTemplateAuthoring,
  syncInstitutionApplicationPreferredEducationFormFromOverlay,
  useInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { resolveGeneralApplicationFormHiddenParagraphIds } from '@/features/program/general/lib/application-form-preview-options'
import {
  buildInstructorAvailableScheduleSlotsFromProgram,
  buildVolunteerActivityAvailableScheduleSlots,
} from '@/features/program/general/lib/instructor-application-available-schedule'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { resolveGeneralProgramVolunteerInterviewSchedulePreviewSeed } from '@/features/program/general/lib/volunteer-interview-schedule-display'
import { loadRegistrationWizardFormDraft } from '@/features/program/general/lib/registration-wizard-form-draft'
import { shouldSkipFreshWizardDraftLoad } from '@/features/program/shared/lib/skip-fresh-wizard-draft-load'
import { applyDevAutofillThirdPartyRecipient } from '@/features/program/general/lib/fill-application-form-third-party-recipient'
import { hasIncompleteApplicationFormThirdPartyRecipient } from '@/features/template/model/application-form-third-party-recipient'
import {
  rememberRegistrationWizardSessionDraft,
  clearRegistrationWizardSessionDrafts,
  peekRegistrationWizardSessionDrafts,
  subscribeRegistrationWizardApplicationDraft,
} from '@/features/program/general/lib/registration-wizard-session-drafts'
import { isRegistrationWizardVisitEnding } from '@/features/program/general/lib/registration-wizard-visit'
import { getUjatVolunteerRound } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-program-round'
import { resolveUjatVolunteerHiddenParagraphIds } from '@/features/template/lib/ujat-volunteer-application-form-visibility'
import {
  buildUjatRecruitTemplateSettingsJson,
  hydrateUjatRecruitTemplateTypedStateFromSettings,
  patchUjatRecruitTemplateTypedState,
  type UjatRecruitTemplateTypedState,
} from '@/features/program/ujat/lib/ujat-recruit-template-typed-state'
import {
  interviewConfigFromLegacyOverlay,
  overlayRecordToInterviewConfig,
} from '@/features/program/ujat/lib/recruitment-typed-contract'
import { ujatVolunteerRecruitInterviewNamespace } from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import { UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-institution-recruit-template-preview-program'
import { UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-volunteer-recruit-template-preview-program'
import { programToUjatRecruitTemplateFormValues } from '@/features/program/ujat/lib/use-ujat-recruit-template-form-overlay-sync'
import { getRecruitTypedInterviewRecord } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import type { Program } from '@/types/domain'

const VOLUNTEER_INTERVIEW_REQUIRED_OVERLAY_KEY = 'recruit.volunteer.interviewRequired'

function buildUjatRecruitTemplateLegacyTypedState(args: {
  variant: 'ujat-recruit-institution' | 'ujat-recruit-volunteer'
  overlay: Record<string, unknown>
}): UjatRecruitTemplateTypedState {
  if (args.variant === 'ujat-recruit-institution') {
    return {
      institution: programToUjatRecruitTemplateFormValues(
        UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
        'institution',
        undefined,
        { sourceOverlay: args.overlay }
      ),
    }
  }
  const h1Interview = interviewConfigFromLegacyOverlay(
    args.overlay,
    ujatVolunteerRecruitInterviewNamespace('h1')
  )
  const h2Interview = interviewConfigFromLegacyOverlay(
    args.overlay,
    ujatVolunteerRecruitInterviewNamespace('h2')
  )
  return {
    volunteerH1: programToUjatRecruitTemplateFormValues(
      UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      'volunteer',
      'h1',
      { sourceOverlay: args.overlay }
    ),
    volunteerH2: programToUjatRecruitTemplateFormValues(
      UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      'volunteer',
      'h2',
      { sourceOverlay: args.overlay }
    ),
    ...(h1Interview ? { interviewH1: h1Interview } : {}),
    ...(h2Interview ? { interviewH2: h2Interview } : {}),
  }
}

function collectUjatRecruitTemplateTypedSettings(args: {
  templateCode: string
  variant: 'ujat-recruit-institution' | 'ujat-recruit-volunteer'
  volunteerHalf?: 'h1' | 'h2'
}): Record<string, unknown> {
  if (args.variant === 'ujat-recruit-volunteer') {
    const liveInterview = getRecruitTypedInterviewRecord()
    if (liveInterview != null) {
      const half = args.volunteerHalf ?? 'h2'
      patchUjatRecruitTemplateTypedState(args.templateCode, {
        [half === 'h2' ? 'interviewH2' : 'interviewH1']: overlayRecordToInterviewConfig(
          liveInterview,
          ujatVolunteerRecruitInterviewNamespace(half)
        ),
      })
    }
  }
  return buildUjatRecruitTemplateSettingsJson(args.templateCode)
}

function subscribeNoop(_listener: () => void): () => void {
  return () => {}
}

function subscribeVolunteerInterviewRequiredOverlay(listener: () => void): () => void {
  const unsubOverlay = subscribeGeneralRecruitOverlayKey(
    VOLUNTEER_INTERVIEW_REQUIRED_OVERLAY_KEY,
    listener
  )
  const unsubRhf = subscribeGeneralRegistrationWizardRhf(listener)
  return () => {
    unsubOverlay()
    unsubRhf()
  }
}

function getVolunteerInterviewRequiredSnapshot(): unknown {
  return readLiveGeneralRecruitOverlayRecord()[VOLUNTEER_INTERVIEW_REQUIRED_OVERLAY_KEY]
}

function useParticipantApplicationMiddleActions(
  setDraft: Dispatch<SetStateAction<WritingFormDraft>>,
  setActiveParagraphId: Dispatch<SetStateAction<string | null>>,
  seedParagraphIds: ReadonlySet<string>
) {
  const appendBasicTitleParagraph = useCallback(
    (paragraphId?: string) => {
      const newId = crypto.randomUUID()
      const insert = createAgreementExplanationTextParagraphForInsert(newId)
      let inserted = false
      setDraft(prev => {
        const targetId = paragraphId ?? prev.paragraphs[prev.paragraphs.length - 1]?.id
        if (targetId == null) return prev
        const next = insertMiddleParagraphAfter(prev.paragraphs, targetId, insert)
        if (next == null) return prev
        inserted = true
        return { ...prev, paragraphs: next }
      })
      if (inserted) setActiveParagraphId(newId)
    },
    [setDraft, setActiveParagraphId]
  )

  const onAddAfter = useCallback(
    (paragraphId: string) => {
      appendBasicTitleParagraph(paragraphId)
    },
    [appendBasicTitleParagraph]
  )

  const onDuplicate = useCallback(
    (paragraphId: string) => {
      if (seedParagraphIds.has(paragraphId)) {
        return
      }
      const newId = crypto.randomUUID()
      let duplicated = false
      setDraft(prev => {
        const next = duplicateMiddleParagraph(prev.paragraphs, paragraphId, newId)
        if (next == null) {
          return prev
        }
        duplicated = true
        return { ...prev, paragraphs: next }
      })
      if (duplicated) setActiveParagraphId(newId)
    },
    [setDraft, setActiveParagraphId, seedParagraphIds]
  )

  const onDelete = useCallback(
    (paragraphId: string) => {
      if (seedParagraphIds.has(paragraphId)) {
        return
      }
      let nextActive: string | null = null
      setDraft(prev => {
        const next = removeMiddleParagraph(prev.paragraphs, paragraphId)
        if (next == null) {
          return prev
        }
        nextActive = pickActiveParagraphIdAfterMiddleDelete(prev.paragraphs, paragraphId)
        return { ...prev, paragraphs: next }
      })
      if (nextActive != null) setActiveParagraphId(nextActive)
    },
    [setDraft, setActiveParagraphId, seedParagraphIds]
  )

  return useMemo(
    () => ({
      onAddAfter,
      onDuplicate,
      onDelete,
      appendBasicTitleParagraph,
    }),
    [appendBasicTitleParagraph, onAddAfter, onDelete, onDuplicate]
  )
}

export type { ProgramParticipantApplicationEditorVariant } from '@jakorea/form-schema/template-registry'

export type UseProgramParticipantApplicationEditorOptions = {
  /** 템플릿 관리 저장 확인 후 (편집 모달 닫기·목록 복귀) */
  onTemplateDraftSaveConfirmed?: () => void
  /**
   * 템플릿 관리에서 복제·신규 code (`recruitment-volunteer-copy-01` 등).
   * 있으면 seed variant id 대신 이 code로 draft 로드/저장.
   */
  templateCode?: string
  /**
   * 프로그램 등록 위저드 — localOnly 저장 키를 catalog templateId와 분리할 때 사용.
   * 구조 잠금·시드 해석은 variant/templateCode를 유지하고, localStorage 키만 유형별로 격리한다.
   */
  localOnlyDraftStorageKey?: string
  systemTemplate?: boolean
  forceUserEditable?: boolean
  /** 프로그램 등록 임시저장 — localStorage만 (`localOnlyDraftPersistence`). 양식 관리는 remote SSOT. */
  localOnlyDraftPersistence?: boolean
  /** 등록 위저드 임시저장 — programType별 localStorage 격리 키 */
  registrationWizardProgramType?: string
  /** fresh 신규 등록 — 기존 위저드 localStorage 초안을 복원하지 않음 */
  skipDraftRestore?: boolean
  /** 프로그램 form-binding `templateVersionId` — 카탈로그 code 대신 이 버전을 로드/저장 */
  templateVersionId?: number
  /** 바인딩 전용 version이 없을 때 등록 위저드 localStorage 초안을 우선 */
  preferLocalDraft?: boolean
  /** 원격 신청 양식은 remote draft가 없을 때 seed/local draft로 대체하지 않음 */
  requireRemoteDraft?: boolean
  ujatRecruitParagraphProps?: import('@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props').UjatRecruitParagraphProps
  /** 프로그램 등록 마법사 — 참여자 유형이 학교/기관일 때만 모집 최대값 필드 노출 */
  participantOrganization?: boolean
  /**
   * 프로그램 상세 신청 양식 수정 등 — 기관 일정 단락에 템플릿 힌트 대신
   * 등록·모집 설정 연동 본문 노출
   */
  programLinkedInstitutionApplicationForm?: boolean
  /** 프로그램 상세 — 공통·모집 정보 연동 미리보기/양식 수정 */
  program?: Program | null
  /**
   * 등록 위저드 — 강사 일정 슬롯 계산에만 쓰는 공통 정보 스냅샷.
   * `program`과 달리 기관 신청 연동·숨김 단락·저장 경로에는 쓰지 않는다.
   */
  instructorScheduleSourceProgram?: Program | null
  programLinkedApplicationFormPreview?: boolean
  applicantRecruitInstitutionLayoutVariant?: import('@/features/template/ui/form-set/recruit-form/institution/paragraph-body').ApplicantRecruitFormInstitutionParagraphBodyOptions['layoutVariant']
  applicantRecruitInstitutionDefaults?: import('@/features/template/ui/form-set/recruit-form/institution/paragraph-body').ApplicantRecruitFormInstitutionParagraphBodyOptions['defaults']
  applicantRecruitInstitutionRecruitLimitVisibility?: import('@/features/template/ui/form-set/recruit-form/institution/paragraph-body').ApplicantRecruitFormInstitutionParagraphBodyOptions['recruitLimitVisibility']
  /**
   * true면 시드 단락 타이틀에 필수(*)를 강제 (`answerRequired`·`requiredMark`).
   * 1사1교 등록 위저드에서 공유 강사 모집 폼 등 상세 단락이 선택인 시드를 쓸 때.
   */
  forceSeedParagraphsRequired?: boolean
  /**
   * 프로그램 등록 위저드가 열린 동안 true.
   * 모집↔신청↔공통 단계 이동 시 세션 draft 캐시를 유지하고, 위저드 닫을 때만 비운다.
   * (미전달 시 기존처럼 active=false에서 캐시 clear)
   */
  registrationWizardOpen?: boolean
  /** 탭 템플릿 변경 시 세션 draft 캐시를 비우고 다시 hydrate */
  wizardDraftRevision?: number
}

function isApplicantRecruitInstitutionVariant(
  variant: ProgramParticipantApplicationEditorVariant
): boolean {
  return (
    variant === 'applicant-recruit-institution' ||
    variant === 'economy-recruit-institution' ||
    variant === 'trained-teachers-recruit-institution'
  )
}

/** 시드 단락 타이틀 필수(*) — 필드 라벨이 아니라 단락 제목 옆 `answerRequired` */
function withForcedSeedParagraphTitleRequired(
  draft: WritingFormDraft,
  seedParagraphIds: ReadonlySet<string>
): WritingFormDraft {
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (!seedParagraphIds.has(paragraph.id)) return paragraph
    const next = forceParagraphTitleRequired(paragraph)
    if (next !== paragraph) changed = true
    return next
  })
  return changed ? { ...draft, paragraphs } : draft
}

function isGeneralRecruitOverlayVariant(
  variant: ProgramParticipantApplicationEditorVariant
): boolean {
  return (
    variant === 'applicant-recruit-individual' ||
    variant === 'recruit-instructor' ||
    variant === 'recruit-volunteer'
  )
}

function isGeneralApplicationOverlayVariant(
  variant: ProgramParticipantApplicationEditorVariant
): boolean {
  return (
    variant === 'institution' ||
    variant === 'individual' ||
    variant === 'instructor' ||
    variant === 'volunteer' ||
    variant === 'economy-application-institution' ||
    variant === 'trained-teachers-application-institution'
  )
}

export function participantEditorHydrateKey(args: {
  templateId: string
  persistTemplateVersionId?: number
  usesRegistrationWizardDraft: boolean
  localOnlyDraftPersistence: boolean
  preferLocalDraft: boolean
  wizardDraftRevision: number
  volunteerHalf?: 'h1' | 'h2' | null
}): string {
  const half =
    args.volunteerHalf === 'h1' || args.volunteerHalf === 'h2' ? `::${args.volunteerHalf}` : ''
  return `${args.templateId}::${args.persistTemplateVersionId ?? 'none'}::${
    args.usesRegistrationWizardDraft ? 'wizard' : args.localOnlyDraftPersistence ? 'local' : 'remote'
  }::${args.preferLocalDraft ? 'prefer-local' : 'bound'}::rev-${args.wizardDraftRevision}${half}`
}

/** Notion 모집 양식 — 시드 단락에서 단락 추가·복제·삭제 전부 disabled 노출 */
export function isRecruitmentEditorVariant(
  variant: ProgramParticipantApplicationEditorVariant
): boolean {
  return (
    variant === 'applicant-recruit-institution' ||
    variant === 'economy-recruit-institution' ||
    variant === 'trained-teachers-recruit-institution' ||
    variant === 'ujat-recruit-institution' ||
    variant === 'applicant-recruit-individual' ||
    variant === 'recruit-instructor' ||
    variant === 'recruit-volunteer' ||
    variant === 'ujat-recruit-volunteer' ||
    variant === 'gemini-recruit'
  )
}

function restoreParticipantOverlayForVariant(
  variant: ProgramParticipantApplicationEditorVariant,
  overlay: Record<string, unknown> | undefined,
  options?: { resetIfMissing?: boolean; replace?: boolean; persistTemplateId?: string }
): void {
  const resetIfMissing = options?.resetIfMissing === true
  const replace = options?.replace === true
  const overlayId =
    options?.persistTemplateId?.trim() || getTemplateIdForParticipantApplicationVariant(variant)
  if (variant === 'gemini-recruit') {
    const detailPrefix = recruitDetailInfoOverlayPrefixForEditorVariant(variant)
    if (overlay) {
      restoreGeminiRecruitForm(overlay)
      if (replace) {
        replaceRecruitDetailInfoIntoGeneralStore(overlay, detailPrefix, overlayId)
      } else {
        restoreRecruitDetailInfoIntoGeneralStore(overlay, detailPrefix)
      }
    } else if (resetIfMissing) {
      resetGeminiRecruitForm()
      replaceRecruitDetailInfoIntoGeneralStore(undefined, detailPrefix, overlayId)
    }
    return
  }
  if (isApplicantRecruitInstitutionVariant(variant)) {
    const detailPrefix = recruitDetailInfoOverlayPrefixForEditorVariant(variant)
    if (overlay) {
      if (replace) {
        replaceApplicantRecruitInstitutionOverlay(overlay)
        replaceRecruitDetailInfoIntoGeneralStore(overlay, detailPrefix)
      } else {
        const applicantIncoming: Record<string, unknown> = {}
        const needle =
          detailPrefix == null ? null : detailPrefix.endsWith('.') ? detailPrefix : `${detailPrefix}.`
        for (const [key, value] of Object.entries(overlay)) {
          if (needle != null && (key === detailPrefix || key.startsWith(needle))) continue
          applicantIncoming[key] = value
        }
        const patch = overlayEntriesAbsentFromLive(
          applicantIncoming,
          getApplicantRecruitInstitutionOverlayRecord()
        )
        if (Object.keys(patch).length > 0) patchApplicantRecruitInstitutionOverlay(patch)
        restoreRecruitDetailInfoIntoGeneralStore(overlay, detailPrefix)
      }
    } else if (resetIfMissing) {
      resetApplicantRecruitInstitutionOverlay()
      replaceRecruitDetailInfoIntoGeneralStore(undefined, detailPrefix)
    }
    return
  }
  if (isGeneralRecruitOverlayVariant(variant) || isGeneralApplicationOverlayVariant(variant)) {
    if (overlay) {
      if (replace) {
        applyOperationalOverlayForCatalogId(overlayId, overlay)
      } else {
        const live = isGeneralRecruitOverlayVariant(variant)
          ? readLiveGeneralRecruitOverlayRecord()
          : getGeneralApplicationOverlayRecord()
        const patch = overlayEntriesAbsentFromLive(overlay, live)
        if (Object.keys(patch).length === 0) return
        if (isGeneralRecruitOverlayVariant(variant)) patchGeneralRecruitOverlay(patch)
        else patchGeneralApplicationOverlay(patch)
      }
    } else if (resetIfMissing) {
      resetOperationalOverlayForCatalogId(overlayId)
    }
    return
  }
  if (variant === 'ujat-application-institution') {
    if (overlay) {
      const next = replace
        ? overlay
        : { ...(collectOperationalOverlayForCatalogId(overlayId) ?? {}), ...overlay }
      applyOperationalOverlayForCatalogId(overlayId, next)
    } else if (resetIfMissing) {
      resetOperationalOverlayForCatalogId(overlayId)
    }
    return
  }
  if (variant === 'ujat-application-volunteer') {
    if (overlay) {
      const next = replace
        ? overlay
        : { ...(collectOperationalOverlayForCatalogId(overlayId) ?? {}), ...overlay }
      applyOperationalOverlayForCatalogId(overlayId, next)
    } else if (resetIfMissing) {
      resetOperationalOverlayForCatalogId(overlayId)
    }
  }
}

export type ParticipantEditorSessionCacheEntry = {
  draft: WritingFormDraft
  overlay: Record<string, unknown> | undefined
  editorState: Record<string, unknown> | undefined
}

/** 등록 위저드 — 공통정보 단계에서 operational persist 시 peek할 마지막 overlay */
const participantSessionOverlayByCatalogId = new Map<string, Record<string, unknown>>()

export function clearParticipantSessionOverlayFlushRegistry(): void {
  participantSessionOverlayByCatalogId.clear()
}

/** 테스트 전용 — stale session snapshot을 재현한다. */
export function seedParticipantSessionOverlayForTests(
  catalogId: string,
  overlay: Record<string, unknown>
): void {
  participantSessionOverlayByCatalogId.set(catalogId, overlay)
}

export function flushParticipantSessionOverlaysToOperationalStores(options?: {
  excludeCatalogId?: string
}): void {
  // TT 위저드 RHF가 켜져 있으면 session snapshot으로 모집·신청 기간을 덮지 않는다.
  // persist는 collectTrainedTeachers*FormState()가 라이브 RHF를 읽는다.
  if (peekTrainedTeachersRegistrationRhf() != null) return
  const companySchoolRhf = peekCompanySchoolRegistrationRhf()
  for (const [catalogId, overlay] of participantSessionOverlayByCatalogId) {
    if (options?.excludeCatalogId != null && catalogId === options.excludeCatalogId) continue
    if (
      companySchoolRhf != null &&
      (catalogId === 'recruitment-economy' || catalogId === 'application-economy')
    ) {
      continue
    }
    if (Object.keys(overlay).length === 0) continue
    applyOperationalOverlayForCatalogId(catalogId, overlay)
  }
}

export function writeParticipantEditorSessionSnapshot(args: {
  cacheKey: string
  cache: Map<string, ParticipantEditorSessionCacheEntry>
  hydratedIds: Set<string>
  draft: WritingFormDraft
  variant: ProgramParticipantApplicationEditorVariant
  persistTemplateId: string
  volunteerExceptionScheduleCount: number
  ujatVolunteerApplicationType: 'new' | 'ujat-graduate'
  ujatGradeApplicationBlockIds: string[]
  ujatApplicationGradeByBlockId: Record<string, string | undefined>
  ujatGradeClassTimeBlockIds: string[]
  markHydratedWhenOverlayPresent: boolean
  flushRecruitDetailBeforeCollect?: boolean
  skipRecruitmentOverlay?: boolean
}): void {
  if (args.draft.paragraphs.length === 0) return
  if (args.flushRecruitDetailBeforeCollect && !args.skipRecruitmentOverlay) {
    flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
  }
  const overlay = args.skipRecruitmentOverlay
    ? undefined
    : collectParticipantOverlayForVariant(args.variant, args.persistTemplateId)
  const editorState = buildParticipantApplicationEditorState({
    variant: args.variant,
    volunteerExceptionScheduleCount: args.volunteerExceptionScheduleCount,
    ujatVolunteerApplicationType: args.ujatVolunteerApplicationType,
    ujatGradeApplicationBlockIds: args.ujatGradeApplicationBlockIds,
    ujatApplicationGradeByBlockId: args.ujatApplicationGradeByBlockId,
    ujatGradeClassTimeBlockIds: args.ujatGradeClassTimeBlockIds,
  })
  args.cache.set(args.cacheKey, {
    draft: args.draft,
    overlay,
    editorState,
  })
  if (args.markHydratedWhenOverlayPresent) {
    if (overlay != null && Object.keys(overlay).length > 0) {
      args.hydratedIds.add(args.cacheKey)
      participantSessionOverlayByCatalogId.set(args.persistTemplateId, overlay)
    }
    rememberRegistrationWizardSessionDraft({
      templateCode: args.persistTemplateId,
      draft: args.draft,
      editorState,
      overlay,
    })
  }
}

export function collectParticipantOverlayForVariant(
  variant: ProgramParticipantApplicationEditorVariant,
  persistTemplateId?: string
): Record<string, unknown> | undefined {
  const overlayId =
    persistTemplateId?.trim() || getTemplateIdForParticipantApplicationVariant(variant)
  if (variant === 'gemini-recruit') {
    return collectOperationalOverlayForCatalogId(overlayId) ?? undefined
  }
  if (
    isApplicantRecruitInstitutionVariant(variant) ||
    isGeneralRecruitOverlayVariant(variant) ||
    isGeneralApplicationOverlayVariant(variant)
  ) {
    return collectOperationalOverlayForCatalogId(overlayId) ?? undefined
  }
  if (variant === 'ujat-recruit-institution') {
    return {
      ...pickUjatRecruitInstitutionOverlay(peekUjatProgramRegistrationOverlayRecord(overlayId)),
      ...(collectOperationalOverlayForCatalogId(overlayId) ?? {}),
    }
  }
  if (variant === 'ujat-recruit-volunteer') {
    return {
      ...pickUjatRecruitVolunteerOverlay(peekUjatProgramRegistrationOverlayRecord(overlayId)),
      ...(collectOperationalOverlayForCatalogId(overlayId) ?? {}),
    }
  }
  if (variant === 'ujat-application-institution' || variant === 'ujat-application-volunteer') {
    return collectOperationalOverlayForCatalogId(overlayId) ?? undefined
  }
  return undefined
}

export function useProgramParticipantApplicationEditor(
  active: boolean,
  previewHeaderTitle: string,
  variant: ProgramParticipantApplicationEditorVariant = 'individual',
  editorOptions?: UseProgramParticipantApplicationEditorOptions
) {
  const onTemplateDraftSaveConfirmed = editorOptions?.onTemplateDraftSaveConfirmed
  const localOnlyDraftPersistence = editorOptions?.localOnlyDraftPersistence === true
  const registrationWizardProgramType = editorOptions?.registrationWizardProgramType
  const usesRegistrationWizardDraft =
    registrationWizardProgramType != null && registrationWizardProgramType !== ''
  const usesTypedUjatRecruitmentWizard =
    usesRegistrationWizardDraft &&
    (variant === 'ujat-recruit-institution' || variant === 'ujat-recruit-volunteer') &&
    editorOptions?.ujatRecruitParagraphProps?.form != null
  const skipDraftRestore = editorOptions?.skipDraftRestore === true
  const persistTemplateVersionId =
    editorOptions?.templateVersionId ??
    (!usesRegistrationWizardDraft
      ? getFormTemplateVersionCacheEntry(editorOptions?.templateCode?.trim() ?? '')
          ?.latestVersionId
      : undefined)
  const preferLocalDraft = editorOptions?.preferLocalDraft === true
  const requireRemoteDraft = editorOptions?.requireRemoteDraft === true
  const registrationWizardOpen = editorOptions?.registrationWizardOpen
  const keepSessionCacheAcrossParticipantDeactivate = registrationWizardOpen === true
  const isTemplateManagementSave = onTemplateDraftSaveConfirmed != null
  const isUjatTemplateAuthoring =
    isTemplateManagementSave &&
    !usesRegistrationWizardDraft &&
    (variant === 'ujat-recruit-institution' || variant === 'ujat-recruit-volunteer')
  const { showSaveSuccess, showSaveFailure } = useFormTemplateSaveFeedback()

  const resolvePersistTemplateId = useCallback(() => {
    const override = editorOptions?.templateCode?.trim()
    if (override != null && override !== '') return override
    return getTemplateIdForParticipantApplicationVariant(variant)
  }, [editorOptions?.templateCode, variant])

  /** localOnly 저장/복원 키 — 유형별 격리 시 catalog id와 다를 수 있음 */
  const resolveLocalDraftStorageKey = useCallback(() => {
    const localKey = editorOptions?.localOnlyDraftStorageKey?.trim()
    if (localOnlyDraftPersistence && localKey != null && localKey !== '') return localKey
    return resolvePersistTemplateId()
  }, [
    editorOptions?.localOnlyDraftStorageKey,
    localOnlyDraftPersistence,
    resolvePersistTemplateId,
  ])

  const isStructureLocked = isWritingFormTemplateStructureLocked({
    templateCode: resolvePersistTemplateId(),
    systemTemplate: editorOptions?.systemTemplate,
    forceUserEditable: editorOptions?.forceUserEditable,
  })
  const forceSeedParagraphsRequired =
    editorOptions?.forceSeedParagraphsRequired === true ||
    variant === 'economy-recruit-institution' ||
    variant === 'economy-application-institution' ||
    variant === 'ujat-recruit-institution' ||
    variant === 'ujat-recruit-volunteer' ||
    variant === 'ujat-application-institution' ||
    variant === 'ujat-application-volunteer'

  const seedParagraphIds = useMemo(() => {
    if (variant === 'institution') return PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'economy-application-institution')
      return PROGRAM_APPLICATION_FORM_ECONOMY_SEED_PARAGRAPH_IDS
    if (variant === 'trained-teachers-application-institution')
      return PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_SEED_PARAGRAPH_IDS
    if (variant === 'gemini-application-institution')
      return GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'gemini-application-instructor')
      return GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS
    if (variant === 'ujat-application-institution')
      return UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'ujat-application-volunteer')
      return UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS
    if (variant === 'applicant-recruit-institution')
      return APPLICANT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'economy-recruit-institution')
      return ECONOMY_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'trained-teachers-recruit-institution')
      return TRAINED_TEACHERS_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'ujat-recruit-institution')
      return UJAT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'applicant-recruit-individual')
      return APPLICANT_RECRUIT_FORM_INDIVIDUAL_SEED_PARAGRAPH_IDS
    if (variant === 'recruit-instructor') return RECRUIT_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS
    if (variant === 'recruit-volunteer') return RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS
    if (variant === 'ujat-recruit-volunteer') return UJAT_RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS
    if (variant === 'gemini-recruit') return GEMINI_VISITING_TRAINING_RECRUIT_FORM_SEED_PARAGRAPH_IDS
    if (variant === 'instructor') return PROGRAM_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS
    if (variant === 'volunteer') return PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS
    return PROGRAM_PARTICIPANT_APPLICATION_SEED_PARAGRAPH_IDS
  }, [variant])

  /** API/시드 로드 전 — 개인 신청 mock 등 잘못된 variant가 노출되지 않도록 빈 draft 유지 */
  const [draft, setDraft] = useState<WritingFormDraft>(() => EMPTY_WRITING_FORM_DRAFT)
  const [draftHydrateKey, setDraftHydrateKey] = useState<string | null>(null)
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null)
  const [isDraftLoading, setIsDraftLoading] = useState(() => active)
  const [remoteDraftLoadError, setRemoteDraftLoadError] = useState<unknown>(null)
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)
  const [ujatGradeApplicationBlockIds, setUjatGradeApplicationBlockIds] = useState<string[]>(() => [
    crypto.randomUUID(),
  ])
  const [ujatApplicationGradeByBlockId, setUjatApplicationGradeByBlockId] = useState<
    Record<string, string | undefined>
  >({})
  const [ujatGradeClassTimeBlockIds, setUjatGradeClassTimeBlockIds] = useState<string[]>(() => [
    crypto.randomUUID(),
  ])
  const [volunteerExceptionScheduleCount, setVolunteerExceptionScheduleCount] = useState(0)
  const [ujatVolunteerApplicationType, setUjatVolunteerApplicationType] = useState<
    'new' | 'ujat-graduate'
  >('ujat-graduate')

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  const createSeedDraft = useCallback((): WritingFormDraft => {
    if (variant === 'institution') return createProgramApplicationFormInstitutionDraft()
    if (variant === 'economy-application-institution')
      return createProgramApplicationFormEconomyDraft()
    if (variant === 'trained-teachers-application-institution')
      return createProgramApplicationFormTrainedTeachersDraft()
    if (variant === 'gemini-application-institution')
      return createGeminiVisitingTrainingApplicationFormInstitutionDraft()
    if (variant === 'gemini-application-instructor')
      return createGeminiVisitingTrainingApplicationFormInstructorDraft()
    if (variant === 'ujat-application-institution')
      return createUjatProgramApplicationFormInstitutionDraft()
    if (variant === 'ujat-application-volunteer')
      return createUjatProgramApplicationFormVolunteerDraft()
    if (variant === 'applicant-recruit-institution')
      return createApplicantRecruitFormInstitutionDraft()
    if (variant === 'economy-recruit-institution')
      return createEconomyRecruitFormInstitutionDraft()
    if (variant === 'trained-teachers-recruit-institution')
      return createTrainedTeachersRecruitFormInstitutionDraft()
    if (variant === 'ujat-recruit-institution') return createUjatRecruitFormInstitutionDraft()
    if (variant === 'applicant-recruit-individual')
      return createApplicantRecruitFormIndividualDraft()
    if (variant === 'recruit-instructor') return createRecruitFormInstructorDraft()
    if (variant === 'recruit-volunteer') return createRecruitFormVolunteerDraft()
    if (variant === 'ujat-recruit-volunteer') return createUjatRecruitFormVolunteerDraft()
    if (variant === 'gemini-recruit') return createGeminiVisitingTrainingRecruitFormDraft()
    if (variant === 'instructor') return createProgramApplicationFormInstructorDraft()
    if (variant === 'volunteer') return createProgramApplicationFormVolunteerDraft()
    return createProgramParticipantApplicationDraft()
  }, [variant])

  const normalizeEditorDraft = useCallback(
    (next: WritingFormDraft): WritingFormDraft => {
      const migrated =
        variant === 'ujat-application-volunteer'
          ? migrateUjatProgramApplicationVolunteerChoiceParagraphs(next)
          : variant === 'ujat-application-institution'
            ? migrateUjatProgramApplicationInstitutionParagraphs(next)
            : variant === 'gemini-application-institution'
              ? migrateGeminiVisitingTrainingApplicationInstitutionParagraphs(next)
              : variant === 'economy-application-institution'
                ? migrateProgramApplicationFormEconomyParagraphs(next)
                : variant === 'trained-teachers-application-institution'
                  ? migrateProgramApplicationFormTrainedTeachersParagraphs(next)
                : variant === 'institution'
                  ? migrateProgramApplicationFormInstitutionParagraphs(next)
                  : variant === 'individual'
                    ? migrateProgramParticipantApplicationParagraphs(next)
                  : variant === 'instructor'
                    ? migrateProgramApplicationFormInstructorParagraphs(next)
                    : variant === 'volunteer'
                      ? migrateProgramApplicationFormVolunteerParagraphs(next)
                      : next
      const withTitleRequired = forceSeedParagraphsRequired
        ? withForcedSeedParagraphTitleRequired(migrated, seedParagraphIds)
        : migrated
      return normalizeWritingFormDraft(withTitleRequired)
    },
    [forceSeedParagraphsRequired, seedParagraphIds, variant]
  )

  /** 모집/신청 탭 전환 시 EMPTY→스피너 깜빡임 방지 — 세션 내 templateId별 마지막 draft */
  const sessionDraftCacheRef = useRef(
    new Map<
      string,
      {
        draft: WritingFormDraft
        overlay: Record<string, unknown> | undefined
        editorState: Record<string, unknown> | undefined
      }
    >()
  )
  /** 해당 templateId를 저장소에서 한 번이라도 hydrate 했는지 — 미완료면 캐시보다 저장본 우선 */
  const storageHydratedTemplateIdsRef = useRef(new Set<string>())
  const draftRef = useRef(draft)
  draftRef.current = draft
  const volunteerExceptionScheduleCountRef = useRef(volunteerExceptionScheduleCount)
  volunteerExceptionScheduleCountRef.current = volunteerExceptionScheduleCount
  const ujatVolunteerApplicationTypeRef = useRef(ujatVolunteerApplicationType)
  ujatVolunteerApplicationTypeRef.current = ujatVolunteerApplicationType
  const ujatGradeApplicationBlockIdsRef = useRef(ujatGradeApplicationBlockIds)
  ujatGradeApplicationBlockIdsRef.current = ujatGradeApplicationBlockIds
  const ujatApplicationGradeByBlockIdRef = useRef(ujatApplicationGradeByBlockId)
  ujatApplicationGradeByBlockIdRef.current = ujatApplicationGradeByBlockId
  const ujatGradeClassTimeBlockIdsRef = useRef(ujatGradeClassTimeBlockIds)
  ujatGradeClassTimeBlockIdsRef.current = ujatGradeClassTimeBlockIds
  const overlayVariantRef = useRef(variant)
  const snapshottedOnSwitchRef = useRef<string | null>(null)

  const editorHydrateTemplateId = usesRegistrationWizardDraft
    ? resolvePersistTemplateId()
    : localOnlyDraftPersistence
      ? resolveLocalDraftStorageKey()
      : resolvePersistTemplateId()
  const editorHydrateKey = participantEditorHydrateKey({
    templateId: editorHydrateTemplateId,
    persistTemplateVersionId,
    usesRegistrationWizardDraft,
    localOnlyDraftPersistence,
    preferLocalDraft,
    wizardDraftRevision: editorOptions?.wizardDraftRevision ?? 0,
    volunteerHalf:
      variant === 'ujat-recruit-volunteer'
        ? editorOptions?.ujatRecruitParagraphProps?.volunteerHalf
        : undefined,
  })

  if (active && draftHydrateKey !== editorHydrateKey) {
    if (draftHydrateKey != null && draft.paragraphs.length > 0) {
      const previousVariant = overlayVariantRef.current
      const previousPersistId = draftHydrateKey.split('::')[0]
      writeParticipantEditorSessionSnapshot({
        cacheKey: draftHydrateKey,
        cache: sessionDraftCacheRef.current,
        hydratedIds: storageHydratedTemplateIdsRef.current,
        draft,
        variant: previousVariant,
        persistTemplateId: previousPersistId,
        volunteerExceptionScheduleCount: volunteerExceptionScheduleCountRef.current,
        ujatVolunteerApplicationType: ujatVolunteerApplicationTypeRef.current,
        ujatGradeApplicationBlockIds: ujatGradeApplicationBlockIdsRef.current,
        ujatApplicationGradeByBlockId: ujatApplicationGradeByBlockIdRef.current,
        ujatGradeClassTimeBlockIds: ujatGradeClassTimeBlockIdsRef.current,
        markHydratedWhenOverlayPresent: usesRegistrationWizardDraft,
        flushRecruitDetailBeforeCollect: true,
        skipRecruitmentOverlay: usesTypedUjatRecruitmentWizard || isUjatTemplateAuthoring,
      })
      snapshottedOnSwitchRef.current = draftHydrateKey
    }
    setDraftHydrateKey(editorHydrateKey)
    const cached = requireRemoteDraft ? undefined : sessionDraftCacheRef.current.get(editorHydrateKey)
    const cacheIsHydrated = requireRemoteDraft
      ? false
      : storageHydratedTemplateIdsRef.current.has(editorHydrateKey)
    const autofilled =
      usesRegistrationWizardDraft
        ? peekRegistrationWizardSessionDrafts().find(
            entry =>
              entry.templateCode === editorHydrateTemplateId &&
              !hasIncompleteApplicationFormThirdPartyRecipient(entry.draft)
          )
        : undefined
    const nextDraft =
      cached != null && cacheIsHydrated
        ? cached.draft
        : (autofilled?.draft ?? (requireRemoteDraft ? EMPTY_WRITING_FORM_DRAFT : createSeedDraft()))
    const normalized = normalizeEditorDraft(nextDraft)
    setDraft(normalized)
    setActiveParagraphId(normalized.paragraphs[0]?.id ?? null)
    setSingleItemListActiveItemId(null)
    setIsDraftLoading(requireRemoteDraft)
    setRemoteDraftLoadError(null)
  }
  overlayVariantRef.current = variant

  const prevParticipantActiveRef = useRef(active)
  useEffect(() => {
    const wasActive = prevParticipantActiveRef.current
    prevParticipantActiveRef.current = active
    if (
      wasActive &&
      !active &&
      keepSessionCacheAcrossParticipantDeactivate &&
      draftHydrateKey != null &&
      draftRef.current.paragraphs.length > 0
    ) {
      const persistId = draftHydrateKey.split('::')[0]
      writeParticipantEditorSessionSnapshot({
        cacheKey: draftHydrateKey,
        cache: sessionDraftCacheRef.current,
        hydratedIds: storageHydratedTemplateIdsRef.current,
        draft: draftRef.current,
        variant: overlayVariantRef.current,
        persistTemplateId: persistId,
        volunteerExceptionScheduleCount: volunteerExceptionScheduleCountRef.current,
        ujatVolunteerApplicationType: ujatVolunteerApplicationTypeRef.current,
        ujatGradeApplicationBlockIds: ujatGradeApplicationBlockIdsRef.current,
        ujatApplicationGradeByBlockId: ujatApplicationGradeByBlockIdRef.current,
        ujatGradeClassTimeBlockIds: ujatGradeClassTimeBlockIdsRef.current,
        markHydratedWhenOverlayPresent: usesRegistrationWizardDraft,
        flushRecruitDetailBeforeCollect: true,
        skipRecruitmentOverlay: usesTypedUjatRecruitmentWizard || isUjatTemplateAuthoring,
      })
    }
  }, [
    active,
    draftHydrateKey,
    keepSessionCacheAcrossParticipantDeactivate,
    usesRegistrationWizardDraft,
    usesTypedUjatRecruitmentWizard,
    isUjatTemplateAuthoring,
  ])

  useEffect(() => {
    if (!active) {
      setIsDraftLoading(false)
      // 등록 위저드: 공통 단계로 잠깐 나가도 모집/신청 입력 유지. 위저드 종료 시에만 clear.
      if (!keepSessionCacheAcrossParticipantDeactivate) {
        sessionDraftCacheRef.current.clear()
        storageHydratedTemplateIdsRef.current.clear()
      }
      return
    }
    /* eslint-disable react-hooks/set-state-in-effect -- 풀페이지 미리보기 열림과 동기화해 시드·저장본을 반영 */
    let cancelled = false
    const templateId = editorHydrateTemplateId
    setOperationalOverlayScope(templateId)
    const hydrateKey = editorHydrateKey
    const clearOverlaysOnHydrate = peekWizardContentResetPending()
    const replaceHydratedOverlay =
      !isUjatTemplateAuthoring && (clearOverlaysOnHydrate || !usesRegistrationWizardDraft)
    setRemoteDraftLoadError(null)
    const finishWizardDetailHydrate = () => {
      if (replaceHydratedOverlay) commitRecruitDetailContentReset()
      if (clearOverlaysOnHydrate) consumeWizardContentResetPending()
    }

    const applyDraftNow = (next: WritingFormDraft) => {
      const normalized = normalizeEditorDraft(next)
      setDraft(normalized)
      setActiveParagraphId(normalized.paragraphs[0]?.id ?? null)
      setSingleItemListActiveItemId(null)
    }

    const cached = requireRemoteDraft ? undefined : sessionDraftCacheRef.current.get(hydrateKey)
    const cacheIsHydrated = requireRemoteDraft
      ? false
      : storageHydratedTemplateIdsRef.current.has(hydrateKey)
    // draft는 render에서 맞춤. 여기선 overlay만 보강해 탭 전환 재페인트가 나지 않게 한다.
    if (cached && cacheIsHydrated && !clearOverlaysOnHydrate) {
      if (isUjatTemplateAuthoring) {
        // Independent UJAT authoring is hydrated from the typed template state below.
      } else if (usesTypedUjatRecruitmentWizard) {
        // Typed recruitment RHF is the only source. Legacy recruitment overlays are not
        // rehydrated when a wizard tab is revisited.
      } else if (variant === 'ujat-recruit-institution') {
        replaceUjatRecruitInstitutionOverlay(
          coalesceUjatRecruitOverlay(cached.overlay ?? {}, getUjatRecruitInstitutionOverlayRecord())
        )
        restoreRecruitDetailInfoIntoGeneralStore(
          coalesceUjatRecruitOverlay(cached.overlay ?? {}, getGeneralRecruitOverlayRecord()),
          recruitDetailInfoOverlayPrefixForEditorVariant(variant),
          { forceEmptyLive: true }
        )
      } else if (variant === 'ujat-recruit-volunteer') {
        replaceUjatRecruitVolunteerOverlay(
          coalesceUjatRecruitOverlay(cached.overlay ?? {}, getUjatRecruitVolunteerOverlayRecord())
        )
        const volunteerCached = coalesceUjatRecruitOverlay(
          cached.overlay ?? {},
          getGeneralRecruitOverlayRecord()
        )
        restoreRecruitDetailInfoIntoGeneralStore(
          volunteerCached,
          recruitDetailInfoOverlayPrefixForEditorVariant(variant),
          { forceEmptyLive: true }
        )
        restoreUjatVolunteerRecruitGeneralStoreSidecar(volunteerCached, {
          forceEmptyLive: true,
        })
      } else {
        restoreParticipantOverlayForVariant(variant, cached.overlay, {
          persistTemplateId: templateId,
        })
        applyParticipantApplicationEditorState({
          variant,
          editorState: cached.editorState,
          setVolunteerExceptionScheduleCount,
          setUjatVolunteerApplicationType,
          setUjatGradeApplicationBlockIds,
          setUjatApplicationGradeByBlockId,
          setUjatGradeClassTimeBlockIds,
        })
      }
      setIsDraftLoading(requireRemoteDraft)
    } else {
      setIsDraftLoading(requireRemoteDraft)
    }

    const preferSessionCache = cached != null && cacheIsHydrated && !clearOverlaysOnHydrate

    if (!usesRegistrationWizardDraft && !preferSessionCache && !isUjatTemplateAuthoring) {
      restoreParticipantOverlayForVariant(variant, undefined, {
        resetIfMissing: true,
        replace: true,
        persistTemplateId: templateId,
      })
      commitRecruitDetailContentReset()
    }

    const loadOptions = {
      localOnly: localOnlyDraftPersistence,
      templateVersionId: persistTemplateVersionId,
      preferLocal: preferLocalDraft,
    }

    const skipFreshWizardDraftLoad = shouldSkipFreshWizardDraftLoad({
      skipDraftRestore,
      wizardDraftRevision: editorOptions?.wizardDraftRevision ?? 0,
    })
    const loadDraftPromise = usesRegistrationWizardDraft
      ? skipFreshWizardDraftLoad
        ? Promise.resolve(null)
        : loadRegistrationWizardFormDraft({
            programType: registrationWizardProgramType!,
            templateCode: templateId,
          })
      : skipDraftRestore
        ? Promise.resolve(null)
        : loadWritingFormTemplateDraft(templateId, loadOptions)

    if (variant === 'ujat-recruit-institution' || variant === 'ujat-recruit-volunteer') {
      void loadDraftPromise.then(saved => {
        if (cancelled) {
          if (clearOverlaysOnHydrate) consumeWizardContentResetPending()
          return
        }
        if (preferSessionCache) return
        if (isUjatTemplateAuthoring) {
          const legacyState =
            saved?.settingsJson == null && saved?.overlay != null
              ? buildUjatRecruitTemplateLegacyTypedState({
                  variant,
                  overlay: saved.overlay,
                })
              : undefined
          hydrateUjatRecruitTemplateTypedStateFromSettings({
            templateCode: templateId,
            settingsJson: saved?.settingsJson,
            legacyState,
          })
          if (saved?.draft != null && saved.draft.paragraphs.length > 0) {
            applyDraftNow(saved.draft)
          }
          storageHydratedTemplateIdsRef.current.add(hydrateKey)
          setIsDraftLoading(false)
          return
        }
        if (usesTypedUjatRecruitmentWizard) {
          if (saved?.draft != null && saved.draft.paragraphs.length > 0) {
            applyDraftNow(saved.draft)
          }
          storageHydratedTemplateIdsRef.current.add(hydrateKey)
          setIsDraftLoading(false)
          return
        }
        if (saved?.draft || saved?.overlay) {
          if (saved.draft != null && saved.draft.paragraphs.length > 0) {
            applyDraftNow(saved.draft)
          }
          if (variant === 'ujat-recruit-institution') {
            replaceUjatRecruitInstitutionOverlay(
              coalesceUjatRecruitOverlay(
                saved.overlay ?? {},
                replaceHydratedOverlay ? {} : getUjatRecruitInstitutionOverlayRecord()
              )
            )
            const incoming = coalesceUjatRecruitOverlay(
              saved.overlay ?? {},
              replaceHydratedOverlay ? {} : getGeneralRecruitOverlayRecord()
            )
            if (replaceHydratedOverlay) {
              replaceRecruitDetailInfoIntoGeneralStore(
                incoming,
                recruitDetailInfoOverlayPrefixForEditorVariant(variant)
              )
            } else {
              restoreRecruitDetailInfoIntoGeneralStore(
                incoming,
                recruitDetailInfoOverlayPrefixForEditorVariant(variant)
              )
            }
          } else {
            replaceUjatRecruitVolunteerOverlay(
              coalesceUjatRecruitOverlay(
                saved.overlay ?? {},
                replaceHydratedOverlay ? {} : getUjatRecruitVolunteerOverlayRecord()
              )
            )
            const volunteerSaved = coalesceUjatRecruitOverlay(
              saved.overlay ?? {},
              replaceHydratedOverlay ? {} : getGeneralRecruitOverlayRecord()
            )
            if (replaceHydratedOverlay) {
              replaceRecruitDetailInfoIntoGeneralStore(
                volunteerSaved,
                recruitDetailInfoOverlayPrefixForEditorVariant(variant)
              )
              replaceUjatVolunteerRecruitGeneralStoreSidecar(volunteerSaved)
            } else {
              restoreRecruitDetailInfoIntoGeneralStore(
                volunteerSaved,
                recruitDetailInfoOverlayPrefixForEditorVariant(variant)
              )
              restoreUjatVolunteerRecruitGeneralStoreSidecar(volunteerSaved)
            }
          }
          finishWizardDetailHydrate()
          storageHydratedTemplateIdsRef.current.add(hydrateKey)
          return
        }
        const legacy =
          clearOverlaysOnHydrate
            ? null
            : localOnlyDraftPersistence
              ? variant === 'ujat-recruit-institution'
                ? loadUjatRecruitInstitutionTemplateSave()
                : loadUjatRecruitVolunteerTemplateSave()
              : null
        if (legacy) {
          applyDraftNow(legacy.draft)
          if (variant === 'ujat-recruit-institution') {
            replaceUjatRecruitInstitutionOverlay(
              coalesceUjatRecruitOverlay(
                legacy.overlay ?? {},
                getUjatRecruitInstitutionOverlayRecord()
              )
            )
          } else {
            replaceUjatRecruitVolunteerOverlay(
              coalesceUjatRecruitOverlay(
                legacy.overlay ?? {},
                getUjatRecruitVolunteerOverlayRecord()
              )
            )
          }
          const volunteerLegacy = coalesceUjatRecruitOverlay(
            legacy.overlay ?? {},
            getGeneralRecruitOverlayRecord()
          )
          restoreRecruitDetailInfoIntoGeneralStore(
            volunteerLegacy,
            recruitDetailInfoOverlayPrefixForEditorVariant(variant)
          )
          if (variant === 'ujat-recruit-volunteer') {
            restoreUjatVolunteerRecruitGeneralStoreSidecar(volunteerLegacy)
          }
        } else if (replaceHydratedOverlay) {
          if (variant === 'ujat-recruit-institution') {
            replaceUjatRecruitInstitutionOverlay({})
            replaceRecruitDetailInfoIntoGeneralStore(
              undefined,
              recruitDetailInfoOverlayPrefixForEditorVariant(variant)
            )
          } else {
            replaceUjatRecruitVolunteerOverlay({})
            replaceRecruitDetailInfoIntoGeneralStore(
              undefined,
              recruitDetailInfoOverlayPrefixForEditorVariant(variant)
            )
            replaceUjatVolunteerRecruitGeneralStoreSidecar(undefined)
          }
          finishWizardDetailHydrate()
        } else if (clearOverlaysOnHydrate) {
          consumeWizardContentResetPending()
        }
        storageHydratedTemplateIdsRef.current.add(hydrateKey)
      }).catch(error => {
        if (cancelled) return
        console.warn('[participant-application-editor] draft load failed', error)
        setRemoteDraftLoadError(error)
        setIsDraftLoading(false)
      })
    } else {
      void loadDraftPromise.then(async saved => {
        if (cancelled) {
          if (clearOverlaysOnHydrate) consumeWizardContentResetPending()
          return
        }
        if (preferSessionCache) return

        if (requireRemoteDraft) {
          if (saved?.draft == null) {
            setRemoteDraftLoadError(new Error('원격 신청 양식을 불러올 수 없습니다.'))
            setIsDraftLoading(false)
            return
          }
          applyDraftNow(saved.draft)
          restoreParticipantOverlayForVariant(variant, saved.overlay, {
            resetIfMissing: replaceHydratedOverlay,
            replace: replaceHydratedOverlay,
            persistTemplateId: templateId,
          })
          finishWizardDetailHydrate()
          applyParticipantApplicationEditorState({
            variant,
            editorState: saved.editorState,
            setVolunteerExceptionScheduleCount,
            setUjatVolunteerApplicationType,
            setUjatGradeApplicationBlockIds,
            setUjatApplicationGradeByBlockId,
            setUjatGradeClassTimeBlockIds,
          })
          storageHydratedTemplateIdsRef.current.add(hydrateKey)
          setIsDraftLoading(false)
          return
        }
        const autofilled = clearOverlaysOnHydrate
          ? undefined
          : peekRegistrationWizardSessionDrafts().find(
              entry =>
                entry.templateCode === templateId &&
                !hasIncompleteApplicationFormThirdPartyRecipient(entry.draft)
            )
        const useAutofill =
          autofilled != null &&
          saved?.draft != null &&
          hasIncompleteApplicationFormThirdPartyRecipient(saved.draft)
        const autofillSnapshot = useAutofill ? autofilled : undefined

        if (saved?.draft || saved?.overlay) {
          if (autofillSnapshot != null) {
            applyDraftNow(autofillSnapshot.draft)
          } else if (saved.draft != null && saved.draft.paragraphs.length > 0) {
            applyDraftNow(saved.draft)
          }
          restoreParticipantOverlayForVariant(variant, autofillSnapshot?.overlay ?? saved.overlay, {
            resetIfMissing: replaceHydratedOverlay,
            replace: replaceHydratedOverlay,
            persistTemplateId: templateId,
          })
          finishWizardDetailHydrate()
          applyParticipantApplicationEditorState({
            variant,
            editorState: autofillSnapshot?.editorState ?? saved.editorState,
            setVolunteerExceptionScheduleCount,
            setUjatVolunteerApplicationType,
            setUjatGradeApplicationBlockIds,
            setUjatApplicationGradeByBlockId,
            setUjatGradeClassTimeBlockIds,
          })
          storageHydratedTemplateIdsRef.current.add(hydrateKey)
          return
        }
        if (autofilled != null) {
          applyDraftNow(autofilled.draft)
          restoreParticipantOverlayForVariant(variant, autofilled.overlay, {
            resetIfMissing: replaceHydratedOverlay,
            replace: replaceHydratedOverlay,
            persistTemplateId: templateId,
          })
          applyParticipantApplicationEditorState({
            variant,
            editorState: autofilled.editorState,
            setVolunteerExceptionScheduleCount,
            setUjatVolunteerApplicationType,
            setUjatGradeApplicationBlockIds,
            setUjatApplicationGradeByBlockId,
            setUjatGradeClassTimeBlockIds,
          })
          finishWizardDetailHydrate()
          storageHydratedTemplateIdsRef.current.add(hydrateKey)
          return
        }
        if (
          usesRegistrationWizardDraft &&
          saved?.draft == null &&
          autofilled == null
        ) {
          const defaults = await import('@/features/template/lib/published-catalog-defaults')
          const published = await defaults.loadPublishedCatalogDraft(templateId)
          if (!cancelled && published != null) {
            const seed = normalizeEditorDraft(createSeedDraft())
            applyDraftNow(defaults.resolveWizardCatalogDraft({ saved: null, seed, published }))
          }
        }
        if (variant === 'ujat-application-volunteer') {
          setUjatVolunteerApplicationType('ujat-graduate')
        }
        if (variant === 'ujat-application-institution') {
          const overlayBlockIds = ujatApplicationInstitutionBlockIdsFromOverlay({
            ...getUjatApplicationInstitutionOverlayRecord(),
            ...(collectOperationalOverlayForCatalogId(templateId) ?? {}),
          })
          if (overlayBlockIds != null) {
            setUjatGradeApplicationBlockIds(overlayBlockIds.gradeIds)
            setUjatGradeClassTimeBlockIds(overlayBlockIds.classTimeIds)
          } else {
            setUjatGradeApplicationBlockIds([crypto.randomUUID()])
            setUjatApplicationGradeByBlockId({})
            setUjatGradeClassTimeBlockIds([crypto.randomUUID()])
          }
        }
        if (replaceHydratedOverlay) {
          restoreParticipantOverlayForVariant(variant, undefined, {
            resetIfMissing: true,
            replace: true,
            persistTemplateId: templateId,
          })
          finishWizardDetailHydrate()
        } else if (clearOverlaysOnHydrate) {
          consumeWizardContentResetPending()
        }
        storageHydratedTemplateIdsRef.current.add(hydrateKey)
      }).catch(error => {
        if (cancelled) return
        console.warn('[participant-application-editor] draft load failed', error)
        setRemoteDraftLoadError(error)
        setIsDraftLoading(false)
      })
    }

    /* eslint-enable react-hooks/set-state-in-effect */

    return () => {
      cancelled = true
      // 위저드를 닫는 중이면 세션 초안을 다시 심지 않는다. 닫기 cleanup이 먼저 초기화한다.
      if (usesRegistrationWizardDraft && isRegistrationWizardVisitEnding()) {
        if (clearOverlaysOnHydrate) consumeWizardContentResetPending()
        return
      }
      // 추가 내용 에디터는 키 입력마다 overlay에 안 쓴다. 단계 캐시보다 먼저 넣는다.
      // suppress는 overlay 적용 후 consume. cleanup에서 풀면 Strict Mode 재마운트가 peek를 놓친다.
      if (!usesTypedUjatRecruitmentWizard && !isUjatTemplateAuthoring) {
        flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
      }
      const overlay = usesTypedUjatRecruitmentWizard || isUjatTemplateAuthoring
        ? undefined
        : collectParticipantOverlayForVariant(variant, templateId)
      const hasOverlayValues = overlay != null && Object.keys(overlay).length > 0
      // hydrate 완료 전 cleanup(Strict Mode 등)은 시드+빈 overlay로 캐시를 오염시키지 않음
      if (
        !usesTypedUjatRecruitmentWizard &&
        !isUjatTemplateAuthoring &&
        !storageHydratedTemplateIdsRef.current.has(hydrateKey) &&
        !hasOverlayValues
      ) return
      const existing = sessionDraftCacheRef.current.get(hydrateKey)
      const draftToSave =
        snapshottedOnSwitchRef.current === hydrateKey &&
        existing?.draft != null &&
        existing.draft.paragraphs.length > 0
          ? existing.draft
          : draftRef.current
      if (draftToSave.paragraphs.length === 0) return
      const editorState = buildParticipantApplicationEditorState({
        variant,
        volunteerExceptionScheduleCount: volunteerExceptionScheduleCountRef.current,
        ujatVolunteerApplicationType: ujatVolunteerApplicationTypeRef.current,
        ujatGradeApplicationBlockIds: ujatGradeApplicationBlockIdsRef.current,
        ujatApplicationGradeByBlockId: ujatApplicationGradeByBlockIdRef.current,
        ujatGradeClassTimeBlockIds: ujatGradeClassTimeBlockIdsRef.current,
      })
      sessionDraftCacheRef.current.set(hydrateKey, {
        draft: draftToSave,
        overlay,
        editorState,
      })
      // 양식 관리: 저장본 로드 전 cleanup이 스토어 잔여 키로 캐시를 hydrated 처리하면 저장본 적용이 건너뛰어진다.
      if (hasOverlayValues && usesRegistrationWizardDraft) {
        storageHydratedTemplateIdsRef.current.add(hydrateKey)
        participantSessionOverlayByCatalogId.set(templateId, overlay ?? {})
      }
      if (usesRegistrationWizardDraft) {
        rememberRegistrationWizardSessionDraft({
          templateCode: templateId,
          draft: draftToSave,
          editorState,
          overlay,
        })
      }
    }
  }, [
    active,
    editorHydrateKey,
    editorHydrateTemplateId,
    localOnlyDraftPersistence,
    normalizeEditorDraft,
    persistTemplateVersionId,
    preferLocalDraft,
    requireRemoteDraft,
    registrationWizardProgramType,
    skipDraftRestore,
    usesRegistrationWizardDraft,
    usesTypedUjatRecruitmentWizard,
    isUjatTemplateAuthoring,
    variant,
  ])

  useEffect(() => {
    if (!active || !usesRegistrationWizardDraft) return
    const templateId = resolvePersistTemplateId()
    return subscribeRegistrationWizardApplicationDraft((code, next, editorState, overlay) => {
      if (code !== templateId) return
      if (overlay != null && !usesTypedUjatRecruitmentWizard) {
        restoreParticipantOverlayForVariant(variant, overlay, {
          replace: true,
          persistTemplateId: templateId,
        })
      }
      applyParticipantApplicationEditorState({
        variant,
        editorState,
        setVolunteerExceptionScheduleCount,
        setUjatVolunteerApplicationType,
        setUjatGradeApplicationBlockIds,
        setUjatApplicationGradeByBlockId,
        setUjatGradeClassTimeBlockIds,
      })
      setDraft(prev =>
        prev.paragraphs.length === 0 ? next : applyDevAutofillThirdPartyRecipient(prev)
      )
    })
  }, [
    active,
    resolvePersistTemplateId,
    usesRegistrationWizardDraft,
    usesTypedUjatRecruitmentWizard,
    variant,
  ])

  /** 등록 위저드 닫힘 → 세션 캐시 정리 (다음 신규 등록과 섞이지 않게) */
  useEffect(() => {
    if (registrationWizardOpen !== false) return
    sessionDraftCacheRef.current.clear()
    storageHydratedTemplateIdsRef.current.clear()
    clearParticipantSessionOverlayFlushRegistry()
    clearRegistrationWizardSessionDrafts()
  }, [registrationWizardOpen])

  /** 기관 신청 스텝 — overlay/위저드 draft에서 희망 교육 형태를 다시 켠다 */
  useEffect(() => {
    if (!active || variant !== 'institution') return
    const live = getProgramRegistrationOverlayRecord()
    if (Object.keys(live).length > 0) {
      syncInstitutionApplicationPreferredEducationFormFromOverlay(live)
      return
    }
    if (!usesRegistrationWizardDraft || registrationWizardProgramType == null) return
    let cancelled = false
    void loadRegistrationWizardFormDraft({
      programType: registrationWizardProgramType,
      templateCode: PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
    }).then(saved => {
      if (cancelled) return
      syncInstitutionApplicationPreferredEducationFormFromOverlay(saved?.overlay)
    })
    return () => {
      cancelled = true
    }
  }, [active, registrationWizardProgramType, usesRegistrationWizardDraft, variant])

  useEffect(() => {
    if (!active) {
      // 등록 위저드: 일반과 같이 모집/신청 overlay는 모달이 닫힐 때까지 유지
      if (!keepSessionCacheAcrossParticipantDeactivate) {
        beginRecruitDetailContentReset()
        resetOperationalOverlayForCatalogId(editorHydrateTemplateId)
        if (variant === 'ujat-recruit-institution') resetUjatRecruitInstitutionOverlay()
        if (variant === 'ujat-recruit-volunteer') resetUjatRecruitVolunteerOverlay()
        if (variant === 'gemini-recruit') {
          resetGeminiRecruitForm()
        }
        if (variant === 'ujat-application-institution') resetUjatApplicationInstitutionOverlay()
        if (variant === 'ujat-application-volunteer') resetUjatApplicationVolunteerOverlay()
        commitRecruitDetailContentReset()
        consumeWizardContentResetPending()
      }
      closeWritingUserPreview()
    }
  }, [
    active,
    closeWritingUserPreview,
    editorHydrateTemplateId,
    keepSessionCacheAcrossParticipantDeactivate,
    variant,
  ])

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => {
          if (p.id !== id) return p
          let next = updater(p)
          if (seedParagraphIds.has(id)) {
            next = { ...next, requiredMark: true, answerRequired: true } as WritingFormParagraph
          }
          return next
        }),
      }))
    },
    [seedParagraphIds]
  )

  const onReorderMiddle = useCallback(
    (dragId: string, overId: string) => {
      if (
        !canReorderParticipantApplicationParagraphs({
          structureLocked: isStructureLocked,
          recruitmentForm: isRecruitmentEditorVariant(variant),
        })
      ) {
        return
      }
      setDraft(prev => ({
        ...prev,
        paragraphs: (() => {
          const from = prev.paragraphs.findIndex(p => p.id === dragId)
          const to = prev.paragraphs.findIndex(p => p.id === overId)
          if (from < 0 || to < 0 || from === to) return prev.paragraphs
          const next = [...prev.paragraphs]
          const [moved] = next.splice(from, 1)
          if (!moved) return prev.paragraphs
          next.splice(to, 0, moved)
          return next
        })(),
      }))
    },
    [isStructureLocked, variant]
  )

  const onTitleNumberingChange = useCallback(
    (style: FormTitleNumberingStyle) => {
      if (isStructureLocked) return
      setDraft(prev => ({
        ...prev,
        formSettings: { ...prev.formSettings, titleNumbering: style },
      }))
    },
    [isStructureLocked]
  )

  const middleParagraphActions = useParticipantApplicationMiddleActions(
    setDraft,
    setActiveParagraphId,
    seedParagraphIds
  )

  const writingFormMiddleParagraphActions = useWritingFormMiddleParagraphActions(
    setDraft,
    setActiveParagraphId
  )

  const effectiveMiddleParagraphActions = !isStructureLocked
    ? writingFormMiddleParagraphActions
    : middleParagraphActions

  const effectiveStructureLockedParagraphIds = isStructureLocked ? seedParagraphIds : undefined
  const allowAddAfterStructureLockedParagraphs =
    isStructureLocked && !isRecruitmentEditorVariant(variant)
  const allowReorderWhenStructureLocked = canReorderParticipantApplicationParagraphs({
    structureLocked: isStructureLocked,
    recruitmentForm: isRecruitmentEditorVariant(variant),
  })

  /**
   * 신청 양식 시드 fill 잠금 — 등록 위저드·템플릿 관리·프로그램 상세 수정 공통.
   * 동의/객관식 선택·신청자 입력은 막고, 타이틀·본문·텍스트형 TD는 편집.
   * 모집은 구조만 잠그고 운영 값(기간·상세·표 셀)은 입력 가능.
   */
  const isApplicationSeedFillLocked =
    isStructureLocked && !isRecruitmentEditorVariant(variant)
  /** 등록 위저드 신청 — 선택 템플릿 구조를 쓰되 공통정보 연동은 유지한다. */
  const isRegistrationApplicationStructureEdit =
    usesRegistrationWizardDraft && !isRecruitmentEditorVariant(variant)

  const {
    horizontalTableRowSelectionsByParagraphId,
    verticalTableBodyRowSelection,
    activeHorizontalTableRowSelection,
    onHorizontalTableRowSelectionChange,
    onVerticalTableBodyRowSelectionChange,
    focusHorizontalTableBodyRow,
    focusVerticalTableBodyRow,
  } = useTableRowSelectionState({
    paragraphs: draft.paragraphs,
    activeParagraphId,
  })

  const handleSelectCard = useCallback((id: string) => {
    setActiveParagraphId(id)
    setSingleItemListActiveItemId(null)
  }, [])

  const onApplicationGradeByBlockChange = useCallback(
    (blockId: string, grade: string | undefined) => {
      setUjatApplicationGradeByBlockId(prev => ({ ...prev, [blockId]: grade }))
    },
    []
  )

  const onAddUjatGradeApplicationBlock = useCallback(() => {
    setUjatGradeApplicationBlockIds(ids => [...ids, crypto.randomUUID()])
  }, [])

  const onRemoveUjatGradeApplicationBlockAtIndex = useCallback((index: number) => {
    if (index < 1) return
    const removedId = ujatGradeApplicationBlockIds[index]
    if (removedId == null) return
    setUjatGradeApplicationBlockIds(prev => {
      if (prev.length <= 1 || index < 0 || index >= prev.length) return prev
      return prev.filter((_, i) => i !== index)
    })
    setUjatApplicationGradeByBlockId(g => {
      const next = { ...g }
      delete next[removedId]
      return next
    })
    updateUjatApplicationInstitutionOverlayKey<Record<string, UjatApplicationGradeDetail>>(
      UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.gradeDetailByBlock,
      previous => {
        const next = { ...(previous ?? {}) }
        delete next[removedId]
        return next
      }
    )
  }, [ujatGradeApplicationBlockIds])

  const onAddUjatGradeClassTimeBlock = useCallback(() => {
    setUjatGradeClassTimeBlockIds(ids => [...ids, crypto.randomUUID()])
  }, [])

  const onRemoveUjatGradeClassTimeBlockAtIndex = useCallback((index: number) => {
    if (index < 1) return
    setUjatGradeClassTimeBlockIds(prev => {
      if (prev.length <= 1 || index < 0 || index >= prev.length) return prev
      return prev.filter((_, i) => i !== index)
    })
    const removedId = ujatGradeClassTimeBlockIds[index]
    if (removedId != null) {
      updateUjatApplicationInstitutionOverlayKey<
        Record<string, Record<string, boolean>>
      >(UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.classTimeCheckedByBlock, previous => {
        const next = { ...(previous ?? {}) }
        delete next[removedId]
        return next
      })
      updateUjatApplicationInstitutionOverlayKey<
        Record<
          string,
          UjatApplicationClassTimePeriods
        >
      >(UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.classTimePeriodsByBlock, previous => {
        const next = { ...(previous ?? {}) }
        delete next[removedId]
        return next
      })
    }
  }, [ujatGradeClassTimeBlockIds])

  const applicationGradeValuesForClassTime = useMemo(() => {
    const vals = Object.values(ujatApplicationGradeByBlockId).filter(
      (v): v is string => typeof v === 'string' && v.length > 0
    )
    const uniq = [...new Set(vals)]
    uniq.sort((a, b) => Number(a) - Number(b))
    return uniq
  }, [ujatApplicationGradeByBlockId])

  const ujatProgramApplicationGradeInfo = useMemo(
    () =>
      variant === 'ujat-application-institution'
        ? {
            applicationGradeBlockIds: ujatGradeApplicationBlockIds,
            applicationGradeByBlockId: ujatApplicationGradeByBlockId,
            onApplicationGradeByBlockChange: onApplicationGradeByBlockChange,
            onAddApplicationGrade: onAddUjatGradeApplicationBlock,
            onRemoveApplicationGradeAtIndex: onRemoveUjatGradeApplicationBlockAtIndex,
          }
        : undefined,
    [
      variant,
      ujatGradeApplicationBlockIds,
      ujatApplicationGradeByBlockId,
      onApplicationGradeByBlockChange,
      onAddUjatGradeApplicationBlock,
      onRemoveUjatGradeApplicationBlockAtIndex,
    ]
  )

  const ujatProgramApplicationGradeClassTime = useMemo(
    () =>
      variant === 'ujat-application-institution'
        ? {
            classTimeBlockIds: ujatGradeClassTimeBlockIds,
            onAddClassTimeBlock: onAddUjatGradeClassTimeBlock,
            onRemoveClassTimeBlockAtIndex: onRemoveUjatGradeClassTimeBlockAtIndex,
            applicationGradeValuesForClassTime,
          }
        : undefined,
    [
      variant,
      ujatGradeClassTimeBlockIds,
      onAddUjatGradeClassTimeBlock,
      onRemoveUjatGradeClassTimeBlockAtIndex,
      applicationGradeValuesForClassTime,
    ]
  )

  const { pinnedTop, sortableMiddle, pinnedBottom } = useMemo(() => {
    const { titleNumbering } = draft.formSettings
    const line = (p: WritingFormParagraph) => ({
      id: p.id,
      displayLine: getFormNavDisplayLine(draft.paragraphs, p, titleNumbering),
    })
    return {
      pinnedTop: null as ReturnType<typeof line> | null,
      sortableMiddle: draft.paragraphs.map(line),
      pinnedBottom: null as ReturnType<typeof line> | ReturnType<typeof line>[] | null,
    }
  }, [draft.formSettings.titleNumbering, draft.paragraphs])

  const programLinkedPreview = editorOptions?.programLinkedApplicationFormPreview === true
  const linkedProgram = editorOptions?.program ?? null
  const programLinkedInstitutionApplicationForm =
    editorOptions?.programLinkedInstitutionApplicationForm === true

  const instructorScheduleProgram =
    linkedProgram ?? editorOptions?.instructorScheduleSourceProgram ?? null

  const instructorScheduleSlots = useMemo(
    () =>
      instructorScheduleProgram && variant === 'instructor'
        ? buildInstructorAvailableScheduleSlotsFromProgram(instructorScheduleProgram)
        : undefined,
    [instructorScheduleProgram, variant]
  )

  const instructorHideScheduleCalendar =
    instructorScheduleProgram != null &&
    variant === 'instructor' &&
    isGeneralIndividualProgram(instructorScheduleProgram)

  const volunteerScheduleSeed = useMemo(
    () =>
      linkedProgram && variant === 'volunteer'
        ? resolveGeneralProgramVolunteerInterviewSchedulePreviewSeed(linkedProgram)
        : undefined,
    [linkedProgram, variant]
  )

  const volunteerActivityScheduleSlots = useMemo(
    () =>
      linkedProgram && variant === 'volunteer'
        ? buildVolunteerActivityAvailableScheduleSlots(linkedProgram)
        : undefined,
    [linkedProgram, variant]
  )

  const volunteerHideActivityScheduleCalendar =
    linkedProgram != null &&
    variant === 'volunteer' &&
    isGeneralIndividualProgram(linkedProgram)

  const programApplicationFormInstructorOptions = useMemo(
    () =>
      variant === 'instructor'
        ? {
            enabled: true as const,
            isTemplateAuthoringMode: !programLinkedPreview,
            ...(instructorScheduleSlots ? { scheduleSlots: instructorScheduleSlots } : {}),
            ...(instructorHideScheduleCalendar
              ? { hideScheduleCalendar: true as const }
              : {}),
            ...(programLinkedPreview ? { programLinkedPreview: true as const } : {}),
          }
        : { enabled: false as const },
    [variant, instructorScheduleSlots, instructorHideScheduleCalendar, programLinkedPreview]
  )
  const onAddVolunteerExceptionSchedule = useCallback(() => {
    setVolunteerExceptionScheduleCount(prev => prev + 1)
  }, [])
  const [volunteerInterviewExcludeNone, setVolunteerInterviewExcludeNone] = useState(false)
  const onVolunteerInterviewExclusionChange = useCallback(
    (state: { excludeNone: boolean }) => {
      setVolunteerInterviewExcludeNone(state.excludeNone)
    },
    []
  )

  const programApplicationFormVolunteerOptions = useMemo(
    () =>
      variant === 'volunteer' ||
      variant === 'recruit-volunteer' ||
      variant === 'ujat-recruit-volunteer'
        ? {
            enabled: true as const,
            exceptionScheduleCount: volunteerExceptionScheduleCount,
            exceptionScheduleAddDisabled: volunteerInterviewExcludeNone,
            onAddExceptionSchedule: onAddVolunteerExceptionSchedule,
            onCommonExclusionChange: onVolunteerInterviewExclusionChange,
            ...(volunteerScheduleSeed ? { commonScheduleSeed: volunteerScheduleSeed } : {}),
            ...(volunteerActivityScheduleSlots
              ? { activityScheduleSlots: volunteerActivityScheduleSlots }
              : {}),
            ...(volunteerHideActivityScheduleCalendar
              ? { hideActivityScheduleCalendar: true as const }
              : {}),
            ...(programLinkedPreview && variant === 'volunteer'
              ? { programLinkedPreview: true as const }
              : {}),
          }
        : {
            enabled: false as const,
            exceptionScheduleCount: 0,
            exceptionScheduleAddDisabled: false,
            onAddExceptionSchedule: () => {},
            onCommonExclusionChange: undefined,
          },
    [
      variant,
      volunteerExceptionScheduleCount,
      volunteerInterviewExcludeNone,
      onAddVolunteerExceptionSchedule,
      onVolunteerInterviewExclusionChange,
      volunteerScheduleSeed,
      volunteerActivityScheduleSlots,
      volunteerHideActivityScheduleCalendar,
      programLinkedPreview,
    ]
  )

  const institutionApplicationBridge = useInstitutionApplicationProgramBridge()
  const institutionApplicationFormVisibilityVersion = useInstitutionApplicationFormVisibilityVersion()
  const institutionApplicationHiddenParagraphIds = useMemo(() => {
    if (variant !== 'institution') return undefined
    const hidden = getInstitutionApplicationFormHiddenParagraphIds(institutionApplicationBridge)
    if (hidden == null) return undefined
    const isTemplateAuthoringContext =
      isInstitutionApplicationBridgeTemplateAuthoring(institutionApplicationBridge)
    if (!isTemplateAuthoringContext) return hidden
    const next = new Set(hidden)
    next.delete(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice)
    return next.size > 0 ? next : undefined
  }, [variant, institutionApplicationBridge, institutionApplicationFormVisibilityVersion])

  const economyApplicationHiddenParagraphIds = useMemo(() => {
    if (variant !== 'economy-application-institution') return undefined
    if (shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph()) return undefined
    return new Set([PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod])
  }, [variant, institutionApplicationFormVisibilityVersion])

  const volunteerApplicationHiddenParagraphIds = useMemo(() => {
    if (variant !== 'volunteer') return undefined
    return resolveGeneralApplicationFormHiddenParagraphIds('volunteer', {
      program: linkedProgram,
      paragraphs: draft.paragraphs,
      isTemplateAuthoringMode: !programLinkedPreview,
    })
  }, [variant, draft.paragraphs, linkedProgram, programLinkedPreview])

  const volunteerInterviewRequired = useSyncExternalStore(
    variant === 'recruit-volunteer' ? subscribeVolunteerInterviewRequiredOverlay : subscribeNoop,
    getVolunteerInterviewRequiredSnapshot,
    getVolunteerInterviewRequiredSnapshot
  )

  const recruitVolunteerHiddenParagraphIds = useMemo(() => {
    if (variant !== 'recruit-volunteer') return undefined
    return getRecruitVolunteerHiddenParagraphIds()
  }, [variant, volunteerInterviewRequired])

  const individualApplicationHiddenParagraphIds = useMemo(() => {
    if (variant !== 'individual') return undefined
    if (linkedProgram == null) return undefined
    return resolveGeneralApplicationFormHiddenParagraphIds('individual', {
      program: linkedProgram,
      paragraphs: draft.paragraphs,
      institutionBridge: institutionApplicationBridge,
    })
  }, [variant, linkedProgram, draft.paragraphs, institutionApplicationBridge])

  const ujatVolunteerRecruitCohortLabel = useMemo(() => {
    if (variant !== 'ujat-application-volunteer' || linkedProgram == null) return undefined
    const half = editorOptions?.ujatRecruitParagraphProps?.volunteerHalf ?? 'h2'
    return getUjatVolunteerRound(linkedProgram, half)?.curriculum?.trim() || undefined
  }, [variant, linkedProgram, editorOptions?.ujatRecruitParagraphProps?.volunteerHalf])

  const ujatProgramApplicationFormVolunteerOptions = useMemo<UjatProgramApplicationVolunteerBodyOptions>(
    () =>
      variant === 'ujat-application-volunteer'
        ? {
            enabled: true as const,
            applicationType: ujatVolunteerApplicationType,
            onApplicationTypeChange: setUjatVolunteerApplicationType,
            isTemplateAuthoringMode: !programLinkedPreview,
            ...(programLinkedPreview ? { programLinkedPreview: true as const } : {}),
            recruitCohortLabel: ujatVolunteerRecruitCohortLabel,
          }
        : {
            enabled: false as const,
            applicationType: 'ujat-graduate' as const,
            onApplicationTypeChange: () => {},
          },
    [
      variant,
      ujatVolunteerApplicationType,
      programLinkedPreview,
      ujatVolunteerRecruitCohortLabel,
    ]
  )

  const leftPanelParagraphBodyOptions = useMemo(
    () => {
      if (!active) return INACTIVE_LEFT_PANEL_PARAGRAPH_BODY_OPTIONS
      return {
      structureLockedParagraphIds: effectiveStructureLockedParagraphIds,
      catalogOriginalParagraphTitleLocked:
        isTemplateManagementSave &&
        isCatalogOriginalWritingTemplate({
          templateCode: resolvePersistTemplateId(),
          systemTemplate: editorOptions?.systemTemplate,
        })
          ? true
          : undefined,
      structureLockedAuthoringChoicePreview: isApplicationSeedFillLocked
        ? false
        : isStructureLocked
          ? true
          : undefined,
      structureLockedAuthoringOperationalFill:
        isStructureLocked && isRecruitmentEditorVariant(variant) ? true : undefined,
      seedApplicantFillLocked: isApplicationSeedFillLocked ? true : undefined,
      structureLockedChoiceDisplayOnly: isApplicationSeedFillLocked
        ? true
        : undefined,
      programApplicationFormInstitution: variant === 'institution',
      programApplicationFormEconomyInstitution:
        variant === 'economy-application-institution'
          ? {
              enabled: true as const,
              sponsorId: linkedProgram?.sponsorId,
              sponsorDisplayName: linkedProgram?.generalCommonInfo?.sponsorDisplayName,
            }
          : undefined,
      programApplicationFormTrainedTeachersInstitution:
        variant === 'trained-teachers-application-institution',
      programApplicationFormGeminiInstitution: variant === 'gemini-application-institution',
      programApplicationFormGeminiInstructor:
        variant === 'gemini-application-instructor'
          ? { enabled: true as const, isTemplateAuthoringMode: true as const }
          : undefined,
      ujatProgramApplicationFormInstitution: variant === 'ujat-application-institution',
      ujatProgramApplicationFormVolunteer: ujatProgramApplicationFormVolunteerOptions,
      hiddenParagraphIds: (() => {
        if (variant === 'ujat-application-volunteer') {
          return resolveUjatVolunteerHiddenParagraphIds(ujatVolunteerApplicationType, {
            isTemplateAuthoringMode: !programLinkedPreview,
          })
        }
        if (variant === 'instructor') return undefined
        if (linkedProgram != null) {
          return resolveGeneralApplicationFormHiddenParagraphIds(variant, {
            program: linkedProgram,
            paragraphs: draft.paragraphs,
            institutionBridge: institutionApplicationBridge,
            isTemplateAuthoringMode: !programLinkedPreview,
          })
        }
        if (variant === 'volunteer') return volunteerApplicationHiddenParagraphIds
        if (variant === 'recruit-volunteer') return recruitVolunteerHiddenParagraphIds
        if (variant === 'individual') return individualApplicationHiddenParagraphIds
        if (variant === 'economy-application-institution') return economyApplicationHiddenParagraphIds
        return institutionApplicationHiddenParagraphIds
      })(),
      ujatProgramApplicationGradeInfo,
      ujatProgramApplicationGradeClassTime,
      applicantRecruitFormInstitution: variant === 'applicant-recruit-institution',
      economyRecruitFormInstitution: variant === 'economy-recruit-institution',
      trainedTeachersRecruitFormInstitution: variant === 'trained-teachers-recruit-institution',
      showInstitutionApplicationLimits:
        (variant === 'applicant-recruit-institution' ||
          variant === 'economy-recruit-institution' ||
          variant === 'trained-teachers-recruit-institution') &&
        (editorOptions?.participantOrganization ?? true),
      applicantRecruitInstitutionLayoutVariant:
        variant === 'economy-recruit-institution'
          ? 'economy'
          : variant === 'trained-teachers-recruit-institution'
            ? 'trainedTeachers'
            : editorOptions?.applicantRecruitInstitutionLayoutVariant,
      applicantRecruitInstitutionDefaults: editorOptions?.applicantRecruitInstitutionDefaults,
      applicantRecruitInstitutionRecruitLimitVisibility:
        editorOptions?.applicantRecruitInstitutionRecruitLimitVisibility,
      /** 양식 관리(미연동)만 상시 노출 — 등록 위저드 모집은 recruitLimitVisibility·브리지로 판단 */
      applicantRecruitInstitutionTemplateAuthoringMode:
        isRecruitmentEditorVariant(variant) &&
        !programLinkedPreview &&
        !usesRegistrationWizardDraft,
      applicantRecruitFormIndividual: variant === 'applicant-recruit-individual',
      recruitFormInstructor: variant === 'recruit-instructor',
      recruitFormVolunteer: variant === 'recruit-volunteer',
      geminiRecruitForm: variant === 'gemini-recruit',
      ujatRecruitFormInstitution: variant === 'ujat-recruit-institution',
      ujatRecruitFormVolunteer: variant === 'ujat-recruit-volunteer',
      ujatRecruitParagraphProps: isUjatTemplateAuthoring
        ? {
            ...(editorOptions?.ujatRecruitParagraphProps ?? {}),
            templateCode: editorHydrateTemplateId,
            templateAuthoring: true,
          }
        : editorOptions?.ujatRecruitParagraphProps,
      programApplicationFormIndividual: variant === 'individual',
      programApplicationFormInstructor: programApplicationFormInstructorOptions,
      programApplicationFormVolunteer:
        variant === 'recruit-volunteer' || variant === 'ujat-recruit-volunteer'
          ? {
              ...programApplicationFormVolunteerOptions,
              enabled: true as const,
              isTemplateAuthoringMode: true as const,
              // 템플릿 관리만 달력 고정 — 등록 위저드·localOnly는 진행 불가일 편집 가능
              freezeUnavailableCalendar:
                !localOnlyDraftPersistence && !usesRegistrationWizardDraft,
            }
          : programApplicationFormVolunteerOptions,
      programLinkedInstitutionApplicationForm,
      programLinkedIndividualApplicationForm: variant === 'individual' && programLinkedPreview,
      registrationWizardApplicationSchedulePlaceholder:
        usesRegistrationWizardDraft &&
        programLinkedPreview &&
        (variant === 'instructor' || variant === 'volunteer'),
      ...(programLinkedPreview &&
      (variant === 'institution' ||
        variant === 'individual' ||
        variant === 'economy-application-institution' ||
        variant === 'trained-teachers-application-institution')
        ? { institutionApplicationProgramBridge: institutionApplicationBridge }
        : {}),
    }
    },
    [
      active,
      draft.paragraphs,
      editorOptions?.applicantRecruitInstitutionDefaults,
      editorOptions?.applicantRecruitInstitutionRecruitLimitVisibility,
      editorOptions?.applicantRecruitInstitutionLayoutVariant,
      editorOptions?.participantOrganization,
      editorOptions?.ujatRecruitParagraphProps,
      editorHydrateTemplateId,
      economyApplicationHiddenParagraphIds,
      individualApplicationHiddenParagraphIds,
      institutionApplicationBridge,
      institutionApplicationFormVisibilityVersion,
      institutionApplicationHiddenParagraphIds,
      isApplicationSeedFillLocked,
      isRegistrationApplicationStructureEdit,
      linkedProgram,
      localOnlyDraftPersistence,
      usesRegistrationWizardDraft,
      isUjatTemplateAuthoring,
      programApplicationFormInstructorOptions,
      programApplicationFormVolunteerOptions,
      programLinkedInstitutionApplicationForm,
      programLinkedPreview,
      recruitVolunteerHiddenParagraphIds,
      editorOptions?.systemTemplate,
      effectiveStructureLockedParagraphIds,
      isStructureLocked,
      isTemplateManagementSave,
      resolvePersistTemplateId,
      ujatProgramApplicationFormVolunteerOptions,
      ujatProgramApplicationGradeClassTime,
      ujatProgramApplicationGradeInfo,
      ujatVolunteerApplicationType,
      variant,
      volunteerApplicationHiddenParagraphIds,
    ]
  )

  const writingPreviewSession = useMemo(
    () => ({
      draft,
      updateParagraph,
      headerTitle: previewHeaderTitle,
      editorKind: 'horizontal_table' as const,
      paragraphBodyOptions: leftPanelParagraphBodyOptions,
    }),
    [draft, leftPanelParagraphBodyOptions, previewHeaderTitle, updateParagraph]
  )

  useEffect(() => {
    if (!active) return
    if (!isWritingUserPreviewOpen) return
    syncWritingUserPreviewSession(writingPreviewSession)
  }, [active, isWritingUserPreviewOpen, syncWritingUserPreviewSession, writingPreviewSession])

  const handlePreview = useCallback(() => {
    openWritingUserPreview(writingPreviewSession)
  }, [openWritingUserPreview, writingPreviewSession])

  const handleSave = useCallback(async (options?: { silent?: boolean }) => {
    try {
      // 파일명만 먼저 overlay에 남는다. id·contentUrl은 업로드 완료 후이므로 저장 전에 기다린다.
      await awaitRecruitDetailMediaUploads()
      const templateId = usesRegistrationWizardDraft
        ? resolvePersistTemplateId()
        : localOnlyDraftPersistence
          ? resolveLocalDraftStorageKey()
          : resolvePersistTemplateId()
      const linkedProgram = editorOptions?.program
      const persistBoundForm = async (payload: {
        draft: typeof draft
        overlay?: Record<string, unknown>
        editorState?: Record<string, unknown>
        settingsJson?: Record<string, unknown>
        localOnly: boolean
      }) => {
        if (!payload.localOnly && persistTemplateVersionId != null && linkedProgram?.id != null) {
          const { saveProgramScopedOperationalFormVersion } = await import(
            '@/features/program/general/lib/sync-registration-form-bindings'
          )
          await saveProgramScopedOperationalFormVersion({
            program: linkedProgram,
            templateCode: templateId,
            versionId: persistTemplateVersionId,
            draft: payload.draft,
            overlay: payload.overlay,
            editorState: payload.editorState,
            settingsJson: payload.settingsJson,
          })
          return
        }
        await persistWritingFormTemplateDraft({
          templateId,
          draft: payload.draft,
          overlay: payload.overlay,
          editorState: payload.editorState,
          settingsJson: payload.settingsJson,
          localOnly: payload.localOnly,
          // 독립 Template Authoring은 catalog code의 Form Version DRAFT를 저장한다.
          // versionId만 있고 linked program이 없는 경우를 프로그램 전용 버전으로
          // 취급하면 공용 DRAFT까지 fail-closed COPY 가드에 걸린다.
          templateVersionId: linkedProgram?.id != null ? persistTemplateVersionId : undefined,
        })
      }
      if (usesRegistrationWizardDraft) {
        if (!usesTypedUjatRecruitmentWizard) {
          flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
        }
        const editorState = buildParticipantApplicationEditorState({
          variant,
          volunteerExceptionScheduleCount,
          ujatVolunteerApplicationType,
          ujatGradeApplicationBlockIds,
          ujatApplicationGradeByBlockId,
          ujatGradeClassTimeBlockIds,
        })
        const overlay = usesTypedUjatRecruitmentWizard
          ? undefined
          : collectParticipantOverlayForVariant(variant, templateId)
        const { persistRegistrationWizardFormDraft } = await import(
          '@/features/program/general/lib/registration-wizard-form-draft'
        )
        await persistRegistrationWizardFormDraft({
          programType: registrationWizardProgramType!,
          templateCode: templateId,
          draft,
          editorState,
          ...(overlay != null ? { overlay } : {}),
        })
      } else if (variant === 'ujat-recruit-institution') {
        if (isUjatTemplateAuthoring) {
          const settingsJson = collectUjatRecruitTemplateTypedSettings({
            templateCode: templateId,
            variant,
          })
          await persistBoundForm({ draft, settingsJson, localOnly: false })
          const { rememberUjatRecruitTemplateSave, clearUjatRecruitTemplateLocalStorage } =
            await import('@/features/program/ujat/lib/ujat-recruit-template-local-save')
          clearUjatRecruitTemplateLocalStorage()
          rememberUjatRecruitTemplateSave(templateId, { draft, overlay: {}, settingsJson })
        } else {
          flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
          const overlay = collectParticipantOverlayForVariant(variant, templateId) ?? {}
          await persistBoundForm({
            draft,
            overlay,
            localOnly:
              localOnlyDraftPersistence ||
              (preferLocalDraft && persistTemplateVersionId == null),
          })
          if (localOnlyDraftPersistence) {
            persistUjatRecruitInstitutionTemplateSave({ draft, overlay })
          } else {
            const { rememberUjatRecruitTemplateSave, clearUjatRecruitTemplateLocalStorage } =
              await import('@/features/program/ujat/lib/ujat-recruit-template-local-save')
            clearUjatRecruitTemplateLocalStorage()
            rememberUjatRecruitTemplateSave(templateId, { draft, overlay })
          }
        }
      } else if (variant === 'ujat-recruit-volunteer') {
        if (isUjatTemplateAuthoring) {
          const settingsJson = collectUjatRecruitTemplateTypedSettings({
            templateCode: templateId,
            variant,
            volunteerHalf: editorOptions?.ujatRecruitParagraphProps?.volunteerHalf,
          })
          await persistBoundForm({ draft, settingsJson, localOnly: false })
          const { rememberUjatRecruitTemplateSave, clearUjatRecruitTemplateLocalStorage } =
            await import('@/features/program/ujat/lib/ujat-recruit-template-local-save')
          clearUjatRecruitTemplateLocalStorage()
          rememberUjatRecruitTemplateSave(templateId, { draft, overlay: {}, settingsJson })
        } else {
          flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
          const overlay = collectParticipantOverlayForVariant(variant, templateId) ?? {}
          await persistBoundForm({
            draft,
            overlay,
            localOnly:
              localOnlyDraftPersistence ||
              (preferLocalDraft && persistTemplateVersionId == null),
          })
          if (localOnlyDraftPersistence) {
            persistUjatRecruitVolunteerTemplateSave({ draft, overlay })
          } else {
            const { rememberUjatRecruitTemplateSave, clearUjatRecruitTemplateLocalStorage } =
              await import('@/features/program/ujat/lib/ujat-recruit-template-local-save')
            clearUjatRecruitTemplateLocalStorage()
            rememberUjatRecruitTemplateSave(templateId, { draft, overlay })
          }
        }
      } else {
        const editorState = buildParticipantApplicationEditorState({
          variant,
          volunteerExceptionScheduleCount,
          ujatVolunteerApplicationType,
          ujatGradeApplicationBlockIds,
          ujatApplicationGradeByBlockId,
          ujatGradeClassTimeBlockIds,
        })
        flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
        const overlay = collectParticipantOverlayForVariant(variant, templateId)
        await persistBoundForm({
          draft,
          editorState,
          ...(overlay != null ? { overlay } : {}),
          localOnly:
            localOnlyDraftPersistence ||
            (preferLocalDraft && persistTemplateVersionId == null),
        })
      }
      if (options?.silent) return
      if (isTemplateManagementSave) {
        showSaveSuccess(onTemplateDraftSaveConfirmed)
      }
    } catch (error) {
      console.debug('programParticipantApplicationEditor save failed', error)
      if (options?.silent) throw error
      showSaveFailure(error)
      throw error
    }
  }, [
    draft,
    editorOptions?.program,
    isTemplateManagementSave,
    isUjatTemplateAuthoring,
    localOnlyDraftPersistence,
    onTemplateDraftSaveConfirmed,
    persistTemplateVersionId,
    preferLocalDraft,
    registrationWizardProgramType,
    resolveLocalDraftStorageKey,
    resolvePersistTemplateId,
    showSaveFailure,
    showSaveSuccess,
    usesRegistrationWizardDraft,
    usesTypedUjatRecruitmentWizard,
    editorOptions?.ujatRecruitParagraphProps?.volunteerHalf,
    ujatApplicationGradeByBlockId,
    ujatGradeApplicationBlockIds,
    ujatGradeClassTimeBlockIds,
    ujatVolunteerApplicationType,
    variant,
    volunteerExceptionScheduleCount,
  ])

  const onSelectSingleItemListItem = useCallback((paragraphId: string, itemId: string | null) => {
    setActiveParagraphId(paragraphId)
    setSingleItemListActiveItemId(itemId)
  }, [])

  const flushSessionSnapshot = useCallback(() => {
    if (!active || draftRef.current.paragraphs.length === 0) return
    writeParticipantEditorSessionSnapshot({
      cacheKey: editorHydrateKey,
      cache: sessionDraftCacheRef.current,
      hydratedIds: storageHydratedTemplateIdsRef.current,
      draft: draftRef.current,
      variant,
      persistTemplateId: editorHydrateTemplateId,
      volunteerExceptionScheduleCount: volunteerExceptionScheduleCountRef.current,
      ujatVolunteerApplicationType: ujatVolunteerApplicationTypeRef.current,
      ujatGradeApplicationBlockIds: ujatGradeApplicationBlockIdsRef.current,
      ujatApplicationGradeByBlockId: ujatApplicationGradeByBlockIdRef.current,
      ujatGradeClassTimeBlockIds: ujatGradeClassTimeBlockIdsRef.current,
      markHydratedWhenOverlayPresent: usesRegistrationWizardDraft,
      flushRecruitDetailBeforeCollect: true,
      skipRecruitmentOverlay: usesTypedUjatRecruitmentWizard || isUjatTemplateAuthoring,
    })
  }, [
    active,
    editorHydrateKey,
    editorHydrateTemplateId,
    usesRegistrationWizardDraft,
    usesTypedUjatRecruitmentWizard,
    variant,
    isUjatTemplateAuthoring,
  ])

  return {
    draft,
    isDraftLoading,
    remoteDraftLoadError,
    activeParagraphId,
    singleItemListActiveItemId,
    structureLockedParagraphIds: effectiveStructureLockedParagraphIds,
    allowAddAfterStructureLockedParagraphs,
    allowReorderWhenStructureLocked,
    pinnedTop,
    sortableMiddle,
    pinnedBottom,
    handleSelectCard,
    onReorderMiddle,
    onTitleNumberingChange,
    updateParagraph,
    middleParagraphActions: effectiveMiddleParagraphActions,
    horizontalTableRowSelectionsByParagraphId,
    verticalTableBodyRowSelection,
    activeHorizontalTableRowSelection,
    onHorizontalTableRowSelectionChange,
    onVerticalTableBodyRowSelectionChange,
    focusHorizontalTableBodyRow,
    focusVerticalTableBodyRow,
    handlePreview,
    handleSave,
    flushSessionSnapshot,
    onSelectSingleItemListItem,
    programApplicationFormInstructorOptions,
    programApplicationFormVolunteerOptions,
    ujatVolunteerApplicationType,
    setUjatVolunteerApplicationType,
    ujatProgramApplicationGradeInfo,
    ujatProgramApplicationGradeClassTime,
    ujatRecruitParagraphProps: editorOptions?.ujatRecruitParagraphProps,
    applicantRecruitInstitutionLayoutVariant:
      editorOptions?.applicantRecruitInstitutionLayoutVariant,
    applicantRecruitInstitutionDefaults: editorOptions?.applicantRecruitInstitutionDefaults,
    programLinkedInstitutionApplicationForm,
    institutionApplicationHiddenParagraphIds,
    economyApplicationHiddenParagraphIds,
    volunteerApplicationHiddenParagraphIds,
    recruitVolunteerHiddenParagraphIds,
    individualApplicationHiddenParagraphIds,
    leftPanelParagraphBodyOptions,
    volunteerExceptionScheduleCount,
  }
}

export type ProgramParticipantApplicationEditorViewModel = ReturnType<
  typeof useProgramParticipantApplicationEditor
>
