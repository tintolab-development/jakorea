/**
 * Gemini 찾아가는 연수 — 모집 공고 추가 임시저장 (localStorage, API 연동 전)
 * @see apps/cms/docs/implementation/template-form-draft-local-save.md
 */

const STORAGE_KEY = 'cms.jakorea.geminiRecruitmentAddDraft.v1'

export const GEMINI_RECRUITMENT_ADD_TEMPLATE_ID = 'gemini-visiting-training-recruitment-add'

export type GeminiRecruitmentAddFormSnapshot = {
  title: string
  applicationPeriodStart: string | null
  applicationPeriodEnd: string | null
  trainingRequestPeriodStart: string | null
  trainingRequestPeriodEnd: string | null
  minStudentCount: number | null
  trainingContentMarkdown: string
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
    form: cloneJson(record.form),
  }
}

export function persistGeminiRecruitmentAddDraft(form: GeminiRecruitmentAddFormSnapshot): boolean {
  try {
    const file = readFile()
    file.byTemplateId[GEMINI_RECRUITMENT_ADD_TEMPLATE_ID] = {
      version: 1,
      templateId: GEMINI_RECRUITMENT_ADD_TEMPLATE_ID,
      savedAt: new Date().toISOString(),
      form: cloneJson(form),
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
