/**
 * Gemini 찾아가는 연수 — 모집 공고 추가 폼 스냅샷·브라우저 잔여 초안.
 * 「임시 저장」은 서버 DRAFT API를 호출한다. localStorage는 이전 초안 복원용으로만 남긴다.
 * @see apps/cms/docs/implementation/template-form-draft-local-save.md
 */

import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import {
  GEMINI_RECRUITMENT_DEFAULT_EDUCATION_STRUCTURE,
  type GeminiRecruitmentEducationForm,
  type GeminiRecruitmentEducationStructure,
} from './add-form-options'

const STORAGE_KEY = 'cms.jakorea.geminiRecruitmentAddDraft.v1'

export const GEMINI_RECRUITMENT_ADD_TEMPLATE_ID = 'gemini-visiting-training-recruitment-add'

/** v1 호환 — 로드 시 normalizeSnapshot으로 v2로 승격 */
type LegacyGeminiRecruitmentAddFormSnapshot = {
  title?: string
  applicationPeriodStart?: string | null
  applicationPeriodEnd?: string | null
  trainingRequestPeriodStart?: string | null
  trainingRequestPeriodEnd?: string | null
  minStudentCount?: number | null
  trainingContentMarkdown?: string
}

export type GeminiRecruitmentAddFormSnapshot = {
  title: string
  announcementPublished: ParticipantRecruitmentAnnouncementPublishedValue | ''
  educationTargetLevels: string[]
  educationTargetDetail: string
  applicationPeriodStart: string | null
  applicationPeriodEnd: string | null
  trainingRequestPeriodStart: string | null
  trainingRequestPeriodEnd: string | null
  minStudentCount: number | null
  educationForm: GeminiRecruitmentEducationForm
  /**
   * BE ProgramCreateRequest.educationStructure (top-level 필수).
   * UI 셀렉트 없음 → SCHEDULE 고정. CURRICULUM은 detailedProgramId 동반 필요.
   */
  educationStructure: GeminiRecruitmentEducationStructure
  inquiryContactName: string
  inquiryTel: string
  inquiryEmail: string
  notesNotApplicable: boolean
  notes: string
  thumbnailFileName: string | null
  /**
   * 업로드한 썸네일 fileObjectId — 저장 시 PUT /programs/{id}/thumbnail.
   * undefined: 변경 없음 / null: 삭제 / number: 새 이미지
   */
  thumbnailFileObjectId?: number | null
  programDescription: string
  recruitmentGuide: string
  applicationMethod: string
  learningSupportContent: string
  additionalContentMarkdown: string
  attachmentFileNames: string[]
  /**
   * 업로드한 첨부 fileObjectId — attachmentFileNames와 같은 index. 저장 시 PUT /programs/{id}/attachments.
   * undefined: 변경 없음 / null 칸: 파일명만 있는 기존 첨부
   */
  attachmentFileObjectIds?: Array<number | null>
  institutionSectionDescription: string
  detailSectionDescription: string
}

function normalizeEducationStructure(
  value: string | null | undefined
): GeminiRecruitmentEducationStructure {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'CURRICULUM') return 'CURRICULUM'
  return GEMINI_RECRUITMENT_DEFAULT_EDUCATION_STRUCTURE
}

export type GeminiRecruitmentAddDraftSaveRecord = {
  version: 1
  templateId: typeof GEMINI_RECRUITMENT_ADD_TEMPLATE_ID
  savedAt: string
  form: GeminiRecruitmentAddFormSnapshot
}

type LocalSaveFile = {
  version: 1
  byTemplateId: Record<string, GeminiRecruitmentAddDraftSaveRecord>
}

export function createDefaultGeminiRecruitmentAddFormSnapshot(): GeminiRecruitmentAddFormSnapshot {
  return {
    title: '',
    announcementPublished: '',
    educationTargetLevels: [],
    educationTargetDetail: '',
    applicationPeriodStart: null,
    applicationPeriodEnd: null,
    trainingRequestPeriodStart: null,
    trainingRequestPeriodEnd: null,
    minStudentCount: 15,
    educationForm: 'online',
    educationStructure: GEMINI_RECRUITMENT_DEFAULT_EDUCATION_STRUCTURE,
    inquiryContactName: '',
    inquiryTel: '',
    inquiryEmail: '',
    notesNotApplicable: false,
    notes: '',
    thumbnailFileName: null,
    programDescription: '',
    recruitmentGuide: '',
    applicationMethod: '',
    learningSupportContent: '',
    additionalContentMarkdown: '',
    attachmentFileNames: [],
    institutionSectionDescription: '',
    detailSectionDescription: '',
  }
}

export function normalizeGeminiRecruitmentAddFormSnapshot(
  raw: LegacyGeminiRecruitmentAddFormSnapshot | GeminiRecruitmentAddFormSnapshot | null | undefined
): GeminiRecruitmentAddFormSnapshot {
  const defaults = createDefaultGeminiRecruitmentAddFormSnapshot()
  if (raw == null) return defaults

  const legacy = raw as LegacyGeminiRecruitmentAddFormSnapshot & GeminiRecruitmentAddFormSnapshot
  const additionalContentMarkdown =
    legacy.additionalContentMarkdown ??
    legacy.trainingContentMarkdown ??
    defaults.additionalContentMarkdown

  return {
    title: legacy.title ?? defaults.title,
    announcementPublished: legacy.announcementPublished ?? defaults.announcementPublished,
    educationTargetLevels: Array.isArray(legacy.educationTargetLevels)
      ? [...legacy.educationTargetLevels]
      : defaults.educationTargetLevels,
    educationTargetDetail: legacy.educationTargetDetail ?? defaults.educationTargetDetail,
    applicationPeriodStart: legacy.applicationPeriodStart ?? defaults.applicationPeriodStart,
    applicationPeriodEnd: legacy.applicationPeriodEnd ?? defaults.applicationPeriodEnd,
    trainingRequestPeriodStart:
      legacy.trainingRequestPeriodStart ?? defaults.trainingRequestPeriodStart,
    trainingRequestPeriodEnd: legacy.trainingRequestPeriodEnd ?? defaults.trainingRequestPeriodEnd,
    minStudentCount:
      typeof legacy.minStudentCount === 'number' && Number.isFinite(legacy.minStudentCount)
        ? legacy.minStudentCount
        : defaults.minStudentCount,
    educationForm:
      legacy.educationForm === 'offline' ? 'offline' : defaults.educationForm,
    educationStructure: normalizeEducationStructure(legacy.educationStructure),
    inquiryContactName: legacy.inquiryContactName ?? defaults.inquiryContactName,
    inquiryTel: legacy.inquiryTel ?? defaults.inquiryTel,
    inquiryEmail: legacy.inquiryEmail ?? defaults.inquiryEmail,
    notesNotApplicable: legacy.notesNotApplicable ?? defaults.notesNotApplicable,
    notes: legacy.notes ?? defaults.notes,
    thumbnailFileName: legacy.thumbnailFileName ?? defaults.thumbnailFileName,
    ...(typeof legacy.thumbnailFileObjectId === 'number'
      ? { thumbnailFileObjectId: legacy.thumbnailFileObjectId }
      : {}),
    programDescription: legacy.programDescription ?? defaults.programDescription,
    recruitmentGuide: legacy.recruitmentGuide ?? defaults.recruitmentGuide,
    applicationMethod: legacy.applicationMethod ?? defaults.applicationMethod,
    learningSupportContent: legacy.learningSupportContent ?? defaults.learningSupportContent,
    additionalContentMarkdown,
    attachmentFileNames: Array.isArray(legacy.attachmentFileNames)
      ? [...legacy.attachmentFileNames]
      : defaults.attachmentFileNames,
    ...(Array.isArray(legacy.attachmentFileObjectIds)
      ? {
          attachmentFileObjectIds: legacy.attachmentFileObjectIds.map(id =>
            typeof id === 'number' && Number.isFinite(id) ? id : null
          ),
        }
      : {}),
    institutionSectionDescription:
      legacy.institutionSectionDescription ?? defaults.institutionSectionDescription,
    detailSectionDescription:
      legacy.detailSectionDescription ?? defaults.detailSectionDescription,
  }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function readFile(): LocalSaveFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, byTemplateId: {} }
    const parsed = JSON.parse(raw) as LocalSaveFile
    if (parsed?.version !== 1 || typeof parsed.byTemplateId !== 'object') {
      return { version: 1, byTemplateId: {} }
    }
    return parsed
  } catch {
    return { version: 1, byTemplateId: {} }
  }
}

function writeFile(file: LocalSaveFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
}

export function loadGeminiRecruitmentAddDraft(): GeminiRecruitmentAddDraftSaveRecord | null {
  const record = readFile().byTemplateId[GEMINI_RECRUITMENT_ADD_TEMPLATE_ID]
  if (!record || record.version !== 1) return null
  return {
    ...record,
    form: normalizeGeminiRecruitmentAddFormSnapshot(cloneJson(record.form)),
  }
}

/** 「임시저장」 덮어쓰기 확인용 — 사용자 작성 draft가 있으면 제목·savedAt 반환 */
export function peekGeminiRecruitmentAddDraftOverwrite(): {
  title: string
  savedAt: string
} | null {
  const saved = loadGeminiRecruitmentAddDraft()
  if (saved == null) return null
  const title = saved.form.title.trim() || '제목 없음'
  return { title, savedAt: saved.savedAt }
}

export function persistGeminiRecruitmentAddDraft(form: GeminiRecruitmentAddFormSnapshot): boolean {
  try {
    const file = readFile()
    file.byTemplateId[GEMINI_RECRUITMENT_ADD_TEMPLATE_ID] = {
      version: 1,
      templateId: GEMINI_RECRUITMENT_ADD_TEMPLATE_ID,
      savedAt: new Date().toISOString(),
      form: cloneJson(normalizeGeminiRecruitmentAddFormSnapshot(form)),
    }
    writeFile(file)
    return true
  } catch (error) {
    console.debug('geminiRecruitmentAddDraft save failed', error)
    return false
  }
}

export function removeGeminiRecruitmentAddDraft(): void {
  try {
    const file = readFile()
    delete file.byTemplateId[GEMINI_RECRUITMENT_ADD_TEMPLATE_ID]
    writeFile(file)
  } catch (error) {
    console.debug('geminiRecruitmentAddDraft remove failed', error)
  }
}
