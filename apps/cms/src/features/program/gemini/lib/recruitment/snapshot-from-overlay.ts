import { GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS } from '@/features/template/model/gemini-visiting-training-recruit-form-draft'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { mergeDevAutofillSparse } from '@/features/program/shared/lib/merge-dev-autofill-sparse'
import { isAnnouncementUnpublished } from '@/features/program/shared/lib/participant-recruitment-form-options'
import { GEMINI_RECRUITMENT_VALIDATION_KEYS } from './validation-keys'
import {
  GEMINI_RECRUIT_FIELD_KEYS,
  getGeminiRecruitFormRecord,
  replaceGeminiRecruitFormExact,
  seedGeminiRecruitFieldsFromDetail,
} from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-form-rhf'
import { getRecruitDetailInfoRecord } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-form-rhf'
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
  return record[GEMINI_RECRUIT_FIELD_KEYS.educationForm] === 'offline' ? 'offline' : 'online'
}

function paragraphDescription(draft: WritingFormDraft | null | undefined, id: string): string {
  const paragraph = draft?.paragraphs.find(item => item.id === id)
  return paragraph?.paragraphDescription?.trim() ?? ''
}

export function buildGeminiRecruitmentSnapshotFromOverlay(
  draft?: WritingFormDraft | null
): GeminiRecruitmentAddFormSnapshot {
  const institution = getGeminiRecruitFormRecord()
  const detail = getRecruitDetailInfoRecord()
  const thumbFileObjectId = readNumberOrNull(detail, recruitDetailThumbFileObjectIdKey(DETAIL_PREFIX))
  return normalizeGeminiRecruitmentAddFormSnapshot({
    title: readString(institution, GEMINI_RECRUIT_FIELD_KEYS.title),
    announcementPublished: (readString(
      institution,
      GEMINI_RECRUIT_FIELD_KEYS.announcementPublished,
      'published'
    ) || 'published') as ParticipantRecruitmentAnnouncementPublishedValue,
    educationTargetLevels: readStringArray(
      institution,
      GEMINI_RECRUIT_FIELD_KEYS.educationTargetLevels
    ),
    educationTargetDetail: readString(institution, GEMINI_RECRUIT_FIELD_KEYS.educationTargetDetail),
    applicationPeriodStart: readNullableString(
      institution,
      GEMINI_RECRUIT_FIELD_KEYS.applicationPeriodStart
    ),
    applicationPeriodEnd: readNullableString(
      institution,
      GEMINI_RECRUIT_FIELD_KEYS.applicationPeriodEnd
    ),
    trainingRequestPeriodStart: readNullableString(
      institution,
      GEMINI_RECRUIT_FIELD_KEYS.trainingRequestPeriodStart
    ),
    trainingRequestPeriodEnd: readNullableString(
      institution,
      GEMINI_RECRUIT_FIELD_KEYS.trainingRequestPeriodEnd
    ),
    minStudentCount: readNumberOrNull(institution, GEMINI_RECRUIT_FIELD_KEYS.minStudentCount),
    educationForm: readEducationForm(institution),
    inquiryContactName: readString(institution, GEMINI_RECRUIT_FIELD_KEYS.inquiryContactName),
    inquiryTel: readString(institution, GEMINI_RECRUIT_FIELD_KEYS.inquiryTel),
    inquiryEmail: readString(institution, GEMINI_RECRUIT_FIELD_KEYS.inquiryEmail),
    notesNotApplicable: institution[GEMINI_RECRUIT_FIELD_KEYS.notesNotApplicable] === true,
    notes: readString(institution, GEMINI_RECRUIT_FIELD_KEYS.notes),
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
  replaceGeminiRecruitFormExact(
    mergeDevAutofillSparse(
      getGeminiRecruitFormRecord(),
      seedGeminiRecruitFieldsFromDetail(snapshot)
    )
  )
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

export type GeminiRecruitmentMissingField = { key: string; label: string }

/**
 * QA-0390: 등록에 빠진 필수 항목 — `isGeminiRecruitmentInstitutionComplete`와 같은 조건.
 * 비고는 내용을 쓰거나 「해당 없음」을 골라야 한다.
 */
export function listGeminiRecruitmentInstitutionMissingFields(
  snapshot: GeminiRecruitmentAddFormSnapshot
): GeminiRecruitmentMissingField[] {
  const keys = GEMINI_RECRUITMENT_VALIDATION_KEYS
  const missing: GeminiRecruitmentMissingField[] = []
  const skipPeriods = isAnnouncementUnpublished(snapshot.announcementPublished)
  if (
    snapshot.announcementPublished !== 'published' &&
    snapshot.announcementPublished !== 'unpublished'
  ) {
    missing.push({ key: keys.announcementPublished, label: '공고 게시 여부' })
  }
  if (!snapshot.title.trim()) missing.push({ key: keys.title, label: '공고명' })
  if (snapshot.educationTargetLevels.length === 0) {
    missing.push({ key: keys.educationTargetLevels, label: '교육 대상' })
  }
  if (!snapshot.educationTargetDetail.trim()) {
    missing.push({ key: keys.educationTargetDetail, label: '교육 대상 상세' })
  }
  if (!skipPeriods && !(snapshot.applicationPeriodStart && snapshot.applicationPeriodEnd)) {
    missing.push({ key: keys.applicationPeriod, label: '기관 모집 기간' })
  }
  if (!skipPeriods && !(snapshot.trainingRequestPeriodStart && snapshot.trainingRequestPeriodEnd)) {
    missing.push({ key: keys.trainingRequestPeriod, label: '연수 요청 가능기간' })
  }
  if ((snapshot.minStudentCount ?? 0) < 1) {
    missing.push({ key: keys.minStudentCount, label: '최소 수강 인원' })
  }
  if (snapshot.educationForm !== 'online' && snapshot.educationForm !== 'offline') {
    missing.push({ key: keys.educationForm, label: '교육 형태' })
  }
  if (
    !snapshot.inquiryContactName.trim() ||
    !snapshot.inquiryTel.trim() ||
    !snapshot.inquiryEmail.trim()
  ) {
    missing.push({ key: keys.inquiry, label: '문의처(담당자·Tel·E-mail)' })
  }
  if (!snapshot.notesNotApplicable && !snapshot.notes.trim()) {
    missing.push({ key: keys.notes, label: '비고(내용 입력 또는 해당 없음 선택)' })
  }
  return missing
}

export function isGeminiRecruitmentInstitutionComplete(
  snapshot: GeminiRecruitmentAddFormSnapshot
): boolean {
  const count = snapshot.minStudentCount ?? 0
  const skipPeriods = isAnnouncementUnpublished(snapshot.announcementPublished)
  return (
    snapshot.title.trim().length > 0 &&
    (snapshot.announcementPublished === 'published' ||
      snapshot.announcementPublished === 'unpublished') &&
    snapshot.educationTargetLevels.length > 0 &&
    snapshot.educationTargetDetail.trim().length > 0 &&
    (skipPeriods || Boolean(snapshot.applicationPeriodStart && snapshot.applicationPeriodEnd)) &&
    (skipPeriods ||
      Boolean(snapshot.trainingRequestPeriodStart && snapshot.trainingRequestPeriodEnd)) &&
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
