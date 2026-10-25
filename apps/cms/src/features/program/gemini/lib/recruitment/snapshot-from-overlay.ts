import { GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS } from '@/features/template/model/gemini-visiting-training-recruit-form-draft'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  GEMINI_RECRUIT_OVERLAY_KEYS,
  getGeminiRecruitOverlayRecord,
  replaceGeminiRecruitOverlayExact,
  seedGeminiRecruitOverlayFromDetail,
} from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-overlay-sync'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { recruitDetailAdditionalContentOverlayKey } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  RECRUIT_DETAIL_INFO_OVERLAY_PREFIX,
  replaceRecruitDetailInfoIntoGeneralStore,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-overlay'
import {
  recruitDetailAttachmentFileNamesKey,
  recruitDetailThumbFileNameKey,
  recruitDetailThumbFileObjectIdKey,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import { resolveRecruitDetailTextFieldOverlayKey } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-text-field-keys'
import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import type { GeminiRecruitmentEducationForm } from './add-form-options'
import {
  createDefaultGeminiRecruitmentAddFormSnapshot,
  normalizeGeminiRecruitmentAddFormSnapshot,
  type GeminiRecruitmentAddFormSnapshot,
} from './add-local-save'

const DETAIL_PREFIX = RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.gemini

function readString(record: Record<string, unknown>, key: string, fallback = ''): string {
  const raw = record[key]
  return typeof raw === 'string' ? raw : fallback
}

function readNullableString(record: Record<string, unknown>, key: string): string | null {
  const raw = record[key]
  if (raw == null) return null
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
    return null
  }
  return trimmed
}

function readStringArray(record: Record<string, unknown>, key: string): string[] {
  const raw = record[key]
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string')
}

function readNumberOrNull(record: Record<string, unknown>, key: string): number | null {
  const raw = record[key]
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  return null
}

function readEducationForm(record: Record<string, unknown>): GeminiRecruitmentEducationForm {
  return record[GEMINI_RECRUIT_OVERLAY_KEYS.educationForm] === 'offline' ? 'offline' : 'online'
}

function paragraphDescription(draft: WritingFormDraft | null | undefined, id: string): string {
  const paragraph = draft?.paragraphs.find(item => item.id === id)
  return paragraph?.paragraphDescription?.trim() ?? ''
}

export function buildGeminiRecruitmentSnapshotFromOverlay(
  draft?: WritingFormDraft | null
): GeminiRecruitmentAddFormSnapshot {
  const institution = getGeminiRecruitOverlayRecord()
  const detail = getGeneralRecruitOverlayRecord()
  const thumbFileObjectId = readNumberOrNull(detail, recruitDetailThumbFileObjectIdKey(DETAIL_PREFIX))
  return normalizeGeminiRecruitmentAddFormSnapshot({
    title: readString(institution, GEMINI_RECRUIT_OVERLAY_KEYS.title),
    announcementPublished: (readString(
      institution,
      GEMINI_RECRUIT_OVERLAY_KEYS.announcementPublished,
      'published'
    ) || 'published') as ParticipantRecruitmentAnnouncementPublishedValue,
    educationTargetLevels: readStringArray(
      institution,
      GEMINI_RECRUIT_OVERLAY_KEYS.educationTargetLevels
    ),
    educationTargetDetail: readString(institution, GEMINI_RECRUIT_OVERLAY_KEYS.educationTargetDetail),
    applicationPeriodStart: readNullableString(
      institution,
      GEMINI_RECRUIT_OVERLAY_KEYS.applicationPeriodStart
    ),
    applicationPeriodEnd: readNullableString(
      institution,
      GEMINI_RECRUIT_OVERLAY_KEYS.applicationPeriodEnd
    ),
    trainingRequestPeriodStart: readNullableString(
      institution,
      GEMINI_RECRUIT_OVERLAY_KEYS.trainingRequestPeriodStart
    ),
    trainingRequestPeriodEnd: readNullableString(
      institution,
      GEMINI_RECRUIT_OVERLAY_KEYS.trainingRequestPeriodEnd
    ),
    minStudentCount: readNumberOrNull(institution, GEMINI_RECRUIT_OVERLAY_KEYS.minStudentCount),
    educationForm: readEducationForm(institution),
    inquiryContactName: readString(institution, GEMINI_RECRUIT_OVERLAY_KEYS.inquiryContactName),
    inquiryTel: readString(institution, GEMINI_RECRUIT_OVERLAY_KEYS.inquiryTel),
    inquiryEmail: readString(institution, GEMINI_RECRUIT_OVERLAY_KEYS.inquiryEmail),
    notesNotApplicable: institution[GEMINI_RECRUIT_OVERLAY_KEYS.notesNotApplicable] === true,
    notes: readString(institution, GEMINI_RECRUIT_OVERLAY_KEYS.notes),
    thumbnailFileName: readNullableString(detail, recruitDetailThumbFileNameKey(DETAIL_PREFIX)),
    ...(thumbFileObjectId != null ? { thumbnailFileObjectId: thumbFileObjectId } : {}),
    programDescription: readString(
      detail,
      resolveRecruitDetailTextFieldOverlayKey(DETAIL_PREFIX, '프로그램 설명')
    ),
    recruitmentGuide: readString(
      detail,
      resolveRecruitDetailTextFieldOverlayKey(DETAIL_PREFIX, '모집 안내')
    ),
    applicationMethod: readString(
      detail,
      resolveRecruitDetailTextFieldOverlayKey(DETAIL_PREFIX, '지원 방법')
    ),
    learningSupportContent: readString(
      detail,
      resolveRecruitDetailTextFieldOverlayKey(DETAIL_PREFIX, '학습 지원 내용')
    ),
    additionalContentMarkdown: readString(
      detail,
      recruitDetailAdditionalContentOverlayKey(DETAIL_PREFIX)
    ),
    attachmentFileNames: readStringArray(detail, recruitDetailAttachmentFileNamesKey(DETAIL_PREFIX)),
    institutionSectionDescription: paragraphDescription(
      draft,
      GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS.recruitInfo
    ),
    detailSectionDescription: paragraphDescription(
      draft,
      GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS.detailInfo
    ),
  })
}

export function seedGeminiRecruitmentOverlaysFromSnapshot(
  snapshot: GeminiRecruitmentAddFormSnapshot,
  templateCode?: string | null
): void {
  replaceGeminiRecruitOverlayExact(seedGeminiRecruitOverlayFromDetail(snapshot))
  replaceRecruitDetailInfoIntoGeneralStore(
    {
      [resolveRecruitDetailTextFieldOverlayKey(DETAIL_PREFIX, '프로그램 설명')]:
        snapshot.programDescription,
      [resolveRecruitDetailTextFieldOverlayKey(DETAIL_PREFIX, '모집 안내')]:
        snapshot.recruitmentGuide,
      [resolveRecruitDetailTextFieldOverlayKey(DETAIL_PREFIX, '지원 방법')]:
        snapshot.applicationMethod,
      [resolveRecruitDetailTextFieldOverlayKey(DETAIL_PREFIX, '학습 지원 내용')]:
        snapshot.learningSupportContent,
      [recruitDetailAdditionalContentOverlayKey(DETAIL_PREFIX)]: snapshot.additionalContentMarkdown,
      [recruitDetailThumbFileNameKey(DETAIL_PREFIX)]: snapshot.thumbnailFileName,
      ...(typeof snapshot.thumbnailFileObjectId === 'number'
        ? { [recruitDetailThumbFileObjectIdKey(DETAIL_PREFIX)]: snapshot.thumbnailFileObjectId }
        : {}),
      [recruitDetailAttachmentFileNamesKey(DETAIL_PREFIX)]: snapshot.attachmentFileNames,
    },
    DETAIL_PREFIX,
    templateCode
  )
}

export function isGeminiRecruitmentInstitutionComplete(
  snapshot: GeminiRecruitmentAddFormSnapshot
): boolean {
  const count = snapshot.minStudentCount ?? 0
  return (
    snapshot.title.trim().length > 0 &&
    snapshot.educationTargetLevels.length > 0 &&
    snapshot.educationTargetDetail.trim().length > 0 &&
    Boolean(snapshot.applicationPeriodStart && snapshot.applicationPeriodEnd) &&
    Boolean(snapshot.trainingRequestPeriodStart && snapshot.trainingRequestPeriodEnd) &&
    count >= 1 &&
    (snapshot.educationForm === 'online' || snapshot.educationForm === 'offline') &&
    snapshot.inquiryContactName.trim().length > 0 &&
    snapshot.inquiryTel.trim().length > 0 &&
    snapshot.inquiryEmail.trim().length > 0 &&
    (snapshot.notesNotApplicable || snapshot.notes.trim().length > 0)
  )
}

export function emptyGeminiRecruitmentSnapshot(): GeminiRecruitmentAddFormSnapshot {
  return createDefaultGeminiRecruitmentAddFormSnapshot()
}
