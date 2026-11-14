import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  clearWritingFormParagraphFillPreviewAnswers,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  getUserInfoSelectedEntries,
  isUserInfoParagraph,
  normalizeWritingFormDraft,
  type MultipleChoiceParagraph,
  type ShortEssayParagraph,
  type StarRateParagraph,
  type TitleWithPeriodParagraph,
  type UserInfoParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import {
  normalizeUserInfoGenderValue,
  USER_INFO_GENDER_FIELD_KEY,
} from '@/features/template/ui/paragraph/single-item/user-info'
import {
  resolveSurveyWritingDraft,
  resolveSurveyWritingDraftSync,
} from './survey-writing-draft'
import type { RegisteredSurvey, SurveyPollRawResponse } from './survey-management-types'

export const LECTURE_EVAL_TEMPLATE_ID = 'survey-admin'

/** 강의 평가 응답·미리보기 — 설문 기간을 지정 텍스트로, 설문자 정보를 상세 정보 폼 규격(한 줄 두 항목)으로 표시 */
export const LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS = {
  surveyPeriodReadonly: true,
  lectureEvalRespondentDetailInfo: true,
} satisfies Partial<RenderFormParagraphBodyOptions>

export type LectureEvalTabKey = 'eval' | 'results'

export const LECTURE_EVAL_TABS = [
  { key: 'eval' as const, label: '강의 평가' },
  { key: 'results' as const, label: '결과' },
]

/** 일반 프로그램 강의평가 탭 — 시안 1141:267867 「강의평가」 붙여 쓰기 (UJAT는 `LECTURE_EVAL_TABS` 유지) */
export const GENERAL_LECTURE_EVAL_TABS = [
  { key: 'eval' as const, label: '강의평가' },
  { key: 'results' as const, label: '결과' },
]

/** 제출 시 mock 설문 종료·결과 탭 접근 (API 연동 전) */
export const LECTURE_EVAL_DEV_AUTO_FINISH_ON_SUBMIT = false

export const LECTURE_EVAL_STRUCTURE_LOCKED_IDS = new Set<string>([
  DEFAULT_SURVEY_PARAGRAPH_IDS.title,
  DEFAULT_SURVEY_PARAGRAPH_IDS.user,
  DEFAULT_SURVEY_PARAGRAPH_IDS.closing,
])

export type LectureEvalValidationResult =
  | { valid: true }
  | { valid: false; message: string }

const LECTURE_EVAL_MOCK_PERIOD = {
  startAt: '2026-09-15',
  endAt: '2026-10-05',
} as const

export type ResolveLectureEvalWritingDraftOptions = {
  clearAnswers?: boolean
  templateName?: string
  /**
   * 설문에 바인딩된 게시 version. 있으면 그 version 본문을 단건 조회한다(템플릿 목록 조회 없음).
   * 템플릿 목록은 FORM_TEMPLATE_READ라 Program Viewer(프로그램 상세)는 403 — 등록된 강의평가는 version으로 연다.
   */
  templateVersionId?: number
}

/**
 * 저장된 응답이 없을 때의 초기 답변 — 시드·양식에 박힌 미리보기 선택값(예: 척도 「매우 그렇다」)을 비운다.
 * 점수 선택형·별점·객관식·하단 동의는 양식 작성(fill) 공통 규칙, 주관식·설문자 정보는 강의평가 전용.
 */
function clearAnswerDefaults(paragraph: WritingFormParagraph): WritingFormParagraph {
  const cleared = clearWritingFormParagraphFillPreviewAnswers(paragraph)
  if (cleared.kind !== 'single_item') return cleared

  if (cleared.variant === 'short_essay') {
    const clearedItems = cleared.items?.map(item => ({ ...item, bodyText: '' })) ?? [
      {
        id: 'short-essay-item-1',
        label: 'Title 01',
        placeholder: '답변을 입력해 주세요',
        bodyText: '',
      },
    ]
    return {
      ...cleared,
      bodyText: '',
      items: clearedItems,
    } satisfies ShortEssayParagraph
  }

  if (isUserInfoParagraph(cleared) && cleared.fieldAnswers != null) {
    return { ...cleared, fieldAnswers: {} } satisfies UserInfoParagraph
  }

  return cleared
}

/**
 * 게시 version 본문을 그대로 연 강의평가 작성 초안 — 제목·기간은 양식 그대로 두고 답변만 비운다.
 * (`buildLectureEvalFormDraft`를 거치지 않는 version 단건 조회 경로용)
 */
export function clearLectureEvalFormAnswers(draft: WritingFormDraft): WritingFormDraft {
  return normalizeWritingFormDraft({
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph =>
      paragraph.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title
        ? paragraph
        : clearAnswerDefaults(paragraph)
    ),
  })
}

function applyLectureEvalTitleParagraph(
  paragraph: WritingFormParagraph,
  displayName: string | undefined,
  clearAnswers: boolean
): WritingFormParagraph {
  if (paragraph.id !== DEFAULT_SURVEY_PARAGRAPH_IDS.title) {
    return clearAnswers ? clearAnswerDefaults(paragraph) : paragraph
  }
  if (paragraph.kind !== 'description' || paragraph.variant !== 'survey_title_with_period') {
    return paragraph
  }
  const titleParagraph = paragraph as TitleWithPeriodParagraph
  return {
    ...titleParagraph,
    surveyTitle:
      displayName != null && displayName !== '' ? displayName : titleParagraph.surveyTitle || '설문 제목 입력',
    periodMode: 'custom',
    startAt: LECTURE_EVAL_MOCK_PERIOD.startAt,
    endAt: LECTURE_EVAL_MOCK_PERIOD.endAt,
    showWritingPeriodOnForm: true,
  }
}

function applyLectureEvalDraftTransforms(
  base: WritingFormDraft,
  templateId: string,
  options?: ResolveLectureEvalWritingDraftOptions
): WritingFormDraft {
  const clearAnswers = options?.clearAnswers ?? false
  const row = findWritingTemplateRowByDefinitionId(templateId)
  const displayName = (options?.templateName ?? row?.templateName)?.trim()

  return normalizeWritingFormDraft({
    ...base,
    paragraphs: base.paragraphs.map(paragraph =>
      applyLectureEvalTitleParagraph(paragraph, displayName, clearAnswers)
    ),
  })
}

/** 등록·응답·결과 집계 공통 — form-template remote draft 우선 */
export async function resolveLectureEvalWritingDraft(
  templateId: string,
  options?: ResolveLectureEvalWritingDraftOptions
): Promise<WritingFormDraft> {
  const base = await resolveSurveyWritingDraft(templateId, {
    templateName: options?.templateName,
    templateVersionId: options?.templateVersionId,
  })
  return applyLectureEvalDraftTransforms(base, templateId, options)
}

/** 캐시/시드 동기 경로 — hydrate 후 사용 */
export function resolveLectureEvalWritingDraftSync(
  templateId: string,
  options?: ResolveLectureEvalWritingDraftOptions
): WritingFormDraft {
  const base = resolveSurveyWritingDraftSync(templateId, {
    templateName: options?.templateName,
  })
  return applyLectureEvalDraftTransforms(base, templateId, options)
}

export async function buildLectureEvalFormDraft(
  templateId: string,
  templateVersionId?: number
): Promise<WritingFormDraft> {
  const versionId =
    templateVersionId != null && Number.isFinite(templateVersionId) && templateVersionId > 0
      ? Math.trunc(templateVersionId)
      : undefined
  return resolveLectureEvalWritingDraft(templateId, {
    clearAnswers: true,
    templateVersionId: versionId,
  })
}

export function buildLectureEvalFormDraftSync(templateId: string): WritingFormDraft {
  return resolveLectureEvalWritingDraftSync(templateId, { clearAnswers: true })
}

function getShortEssayText(paragraph: ShortEssayParagraph): string {
  if (paragraph.items != null && paragraph.items.length > 0) {
    return paragraph.items.map(item => item.bodyText.trim()).join('\n').trim()
  }
  return paragraph.bodyText.trim()
}

/** 객관식(MULTIPLE_CHOICE) 선택 옵션 value 목록 — 서버는 옵션 value 배열로 받는다(쉼표 문자열 금지). */
function getMultipleChoiceSelectedIds(paragraph: MultipleChoiceParagraph): string[] {
  const ids = paragraph.allowMultiple
    ? (paragraph.selectedPreviewMultipleIds ?? [])
    : [paragraph.selectedPreviewSingleId ?? '']
  return ids.map(id => id.trim()).filter(id => id !== '')
}

/**
 * 서버 응답의 객관식 값 → 옵션 value 목록.
 * 배열 답은 `answerValueJson`(JSON 배열 문자열)로 오고, 예전 단일 값은 문자열 하나로 온다.
 */
function parseMultipleChoiceAnswerValue(raw: string): string[] {
  const text = raw.trim()
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
          .map(item => String(item).trim())
          .filter(item => item !== '')
      }
    } catch {
      // JSON 배열이 아니면 단일 값으로 본다
    }
  }
  return text === '' ? [] : [text]
}

function collectUserInfoAnswers(paragraph: UserInfoParagraph): Record<string, string> {
  const next: Record<string, string> = {}
  for (const field of getUserInfoSelectedEntries(paragraph)) {
    const raw = paragraph.fieldAnswers?.[field.key]?.trim() ?? ''
    // 성별은 서버 값 MALE/FEMALE (예전 직접 입력 「남자」·「여」 등도 변환)
    const value = field.key === USER_INFO_GENDER_FIELD_KEY ? normalizeUserInfoGenderValue(raw) : raw
    if (value !== '') next[field.key] = value
  }
  return next
}

export function getLectureEvalPeriodEndAt(formDraft: WritingFormDraft | null | undefined): string | null {
  if (formDraft == null) return LECTURE_EVAL_MOCK_PERIOD.endAt
  const title = formDraft.paragraphs.find(
    p => p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title && p.kind === 'description'
  )
  if (title == null || title.variant !== 'survey_title_with_period') {
    return LECTURE_EVAL_MOCK_PERIOD.endAt
  }
  return title.endAt ?? LECTURE_EVAL_MOCK_PERIOD.endAt
}

const LECTURE_EVAL_MOCK_SHORT_ANSWERS: Partial<Record<string, string>> = {
  [DEFAULT_SURVEY_PARAGRAPH_IDS.subjective]:
    '강의 자료 배포 시기를 수업 전에 미리 공유해 주시면 좋겠습니다.',
  [DEFAULT_SURVEY_PARAGRAPH_IDS.subjective2]:
    '학생들의 참여도가 높았고, 실습 중심 진행이 인상적이었습니다.',
  [DEFAULT_SURVEY_PARAGRAPH_IDS.subjective3]:
    '진로·창업 연계 교육 콘텐츠를 추가로 도입하면 좋겠습니다.',
}

function fillLectureEvalMockAnswers(draft: WritingFormDraft): WritingFormDraft {
  return normalizeWritingFormDraft({
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') {
        return paragraph
      }
      const mockText = LECTURE_EVAL_MOCK_SHORT_ANSWERS[paragraph.id]
      if (mockText == null) return paragraph
      const items =
        paragraph.items?.map(item => ({ ...item, bodyText: mockText })) ?? paragraph.items
      return {
        ...paragraph,
        bodyText: mockText,
        items,
      } satisfies ShortEssayParagraph
    }),
  })
}

/** temp mock·제출 미리보기 — 시드 척도 + 주관식 샘플 답변 */
export function buildLectureEvalSubmittedPollResponse(
  templateId: string = LECTURE_EVAL_TEMPLATE_ID
): SurveyPollRawResponse {
  const draft = fillLectureEvalMockAnswers(resolveLectureEvalWritingDraftSync(templateId))
  return draftToLectureEvalPollResponse(draft)
}

export function draftToLectureEvalPollResponse(draft: WritingFormDraft): SurveyPollRawResponse {
  const answers: Record<string, string> = {}
  let respondentName = ''
  let addressRegion = ''

  for (const paragraph of draft.paragraphs) {
    if (paragraph.kind !== 'single_item') continue

    if (paragraph.variant === 'scale_type') {
      const selected = paragraph.selectedPreviewItemId
      if (selected != null && selected !== '') {
        answers[paragraph.id] = selected
      }
      continue
    }

    if (paragraph.variant === 'short_essay') {
      const text = getShortEssayText(paragraph)
      if (text !== '') {
        answers[paragraph.id] = text
      }
      continue
    }

    if (paragraph.variant === 'multiple_choice') {
      // 화면 행은 서버 표시값과 같게 JSON 배열 문자열로 둔다(제출 payload는 배열 — draftToLectureEvalSubmitAnswers)
      const ids = getMultipleChoiceSelectedIds(paragraph)
      if (ids.length > 0) answers[paragraph.id] = JSON.stringify(ids)
      continue
    }

    if (paragraph.variant === 'star_rate') {
      const stars = (paragraph as StarRateParagraph).selectedPreviewStars
      if (stars != null) answers[paragraph.id] = String(stars)
      continue
    }

    if (isUserInfoParagraph(paragraph)) {
      const fieldAnswers = collectUserInfoAnswers(paragraph)
      Object.assign(answers, fieldAnswers)
      respondentName = fieldAnswers.name ?? respondentName
      addressRegion = fieldAnswers.addressRegion ?? addressRegion
    }
  }

  return {
    respondentId: 'lecture-eval-admin',
    respondentName,
    addressRegion,
    answers,
  }
}

/**
 * 관리자 설문 제출(`POST /api/admin/form-responses/submit`·`PATCH …/{id}`) `answers`.
 * 서버는 최상위 키가 문항 키(단락 id)와 같아야 받는다 — 설문자 정보(USER_INFO)는 단락 id 아래
 * `{ name, gender, phone, … }` 객체로 묶는다(평면 키 금지, 백엔드 안내 2026-11-13). 값 없는 항목은 생략,
 * 설문자 정보 단락 키 자체는 항상 넣는다.
 */
export function draftToLectureEvalSubmitAnswers(draft: WritingFormDraft): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const userInfoFieldKeys = new Set<string>()
  for (const paragraph of draft.paragraphs) {
    if (!isUserInfoParagraph(paragraph)) continue
    out[paragraph.id] = collectUserInfoAnswers(paragraph)
    for (const field of getUserInfoSelectedEntries(paragraph)) userInfoFieldKeys.add(field.key)
  }
  // 객관식은 선택한 옵션 value 배열(1개여도 배열). 선택 없음이면 키를 생략한다 — 필수는 제출 전 검증에서 막는다.
  for (const paragraph of draft.paragraphs) {
    if (paragraph.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') continue
    const ids = getMultipleChoiceSelectedIds(paragraph)
    if (ids.length > 0) out[paragraph.id] = ids
  }
  for (const [key, value] of Object.entries(draftToLectureEvalPollResponse(draft).answers)) {
    // 설문자 정보 항목(name·gender…)은 위 객체에만 — 최상위 평면 키로 보내지 않는다
    if (userInfoFieldKeys.has(key) || key in out) continue
    out[key] = value
  }
  return out
}

/** 서버 응답의 설문자 정보 값 — 단락 id 아래 객체(JSON 문자열) 또는 예전 평면 키 */
function readUserInfoAnswerObject(
  answers: Record<string, string>,
  paragraphId: string
): Record<string, string> | null {
  const raw = answers[paragraphId]
  if (raw == null || raw.trim() === '') return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value == null) continue
      out[key] = String(value)
    }
    return out
  } catch {
    return null
  }
}

export function parseLectureEvalFormResponseId(
  responses: SurveyPollRawResponse[]
): number | null {
  for (const row of responses) {
    const n = Number(row.respondentId)
    if (Number.isSafeInteger(n) && n > 0) return n
  }
  return null
}

export function applyLectureEvalAnswersToDraft(
  draft: WritingFormDraft,
  answers: Record<string, string>
): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.kind !== 'single_item') return paragraph
      const value = answers[paragraph.id]
      if (value == null || value === '') return paragraph
      if (paragraph.variant === 'scale_type') {
        return { ...paragraph, selectedPreviewItemId: value }
      }
      if (paragraph.variant === 'short_essay') {
        const items =
          paragraph.items != null && paragraph.items.length > 0
            ? paragraph.items.map((item, index) =>
                index === 0 ? { ...item, bodyText: value } : item
              )
            : paragraph.items
        return { ...paragraph, bodyText: value, items }
      }
      if (paragraph.variant === 'multiple_choice') {
        const ids = parseMultipleChoiceAnswerValue(value)
        if (paragraph.allowMultiple) {
          return { ...paragraph, selectedPreviewMultipleIds: ids }
        }
        return { ...paragraph, selectedPreviewSingleId: ids[0] ?? null }
      }
      if (paragraph.variant === 'star_rate') {
        const stars = Number(value)
        return {
          ...paragraph,
          selectedPreviewStars: Number.isFinite(stars) ? stars : paragraph.selectedPreviewStars,
        }
      }
      if (isUserInfoParagraph(paragraph)) {
        const fieldAnswers = { ...(paragraph.fieldAnswers ?? {}) }
        const nested = readUserInfoAnswerObject(answers, paragraph.id)
        for (const field of getUserInfoSelectedEntries(paragraph)) {
          const fieldValue = nested?.[field.key] ?? answers[field.key]
          if (fieldValue != null) fieldAnswers[field.key] = fieldValue
        }
        return { ...paragraph, fieldAnswers }
      }
      return paragraph
    }),
  }
}

export function validateLectureEvalFormDraft(draft: WritingFormDraft): LectureEvalValidationResult {
  for (const paragraph of draft.paragraphs) {
    if (paragraph.kind !== 'single_item') continue

    if (paragraph.variant === 'scale_type' && paragraph.answerRequired !== false) {
      if (paragraph.selectedPreviewItemId == null || paragraph.selectedPreviewItemId === '') {
        const title = paragraph.paragraphTitle.trim() || '척도형 문항'
        return { valid: false, message: `${title}에 답변해 주세요.` }
      }
    }

    if (paragraph.variant === 'short_essay' && paragraph.answerRequired !== false) {
      if (getShortEssayText(paragraph) === '') {
        const title = paragraph.paragraphTitle.trim() || '주관식 문항'
        return { valid: false, message: `${title}에 답변을 입력해 주세요.` }
      }
    }

    if (paragraph.variant === 'multiple_choice' && paragraph.answerRequired !== false) {
      if (getMultipleChoiceSelectedIds(paragraph).length === 0) {
        const title = paragraph.paragraphTitle.trim() || '객관식 문항'
        return { valid: false, message: `${title}에 답변해 주세요.` }
      }
    }

    if (paragraph.variant === 'star_rate' && paragraph.answerRequired !== false) {
      if ((paragraph as StarRateParagraph).selectedPreviewStars == null) {
        const title = paragraph.paragraphTitle.trim() || '별점 문항'
        return { valid: false, message: `${title}에 답변해 주세요.` }
      }
    }

    // 설문자 정보는 강의평가 작성 화면에서 입력하지 않는다(「설문자 OO」 글자, 2026-11-14 요청) — 필수 검사 제외
  }

  return { valid: true }
}

/**
 * 결과 탭·전체 응답 — 강의평가가 끝난 뒤(FINISHED), 또는 마감 없는 강의평가는 진행 중에도 상시.
 * (마감 없음은 서버 진행 상태가 FINISHED가 되지 않으므로 결과를 막지 않는다.)
 */
export function isLectureEvalResultsTabAccessible(
  survey: Pick<RegisteredSurvey, 'status' | 'submissionOpenEnded'>
): boolean {
  if (survey.status === 'finished') return true
  return survey.status === 'in_progress' && survey.submissionOpenEnded === true
}

/**
 * 답변 수정 가능 여부 — 바인딩 `submissionEndAt` 전까지. 종료(FINISHED) 후에는 수정 UI를 숨긴다.
 * 마감일을 모르면 진행 중일 때만 허용하고 판정은 서버(409 LECTURE_EVALUATION_EDIT_PERIOD_ENDED)에 맡긴다.
 */
export function canEditLectureEvalResponse(
  survey: Pick<RegisteredSurvey, 'status' | 'submissionEndAt'>,
  now: Date = new Date()
): boolean {
  if (survey.status !== 'in_progress') return false
  const endAt = survey.submissionEndAt?.trim()
  if (endAt == null || endAt === '') return true
  const end = new Date(endAt)
  if (Number.isNaN(end.getTime())) return true
  return now.getTime() < end.getTime()
}

/** 제출 폼은 진행 중이고 내 응답이 없을 때만. 시작 전은 진행 전 안내, 종료 후는 종료 안내를 보인다. */
export function isLectureEvalFormPhase(
  survey: Pick<RegisteredSurvey, 'status'>,
  submitted: boolean
): boolean {
  if (submitted) return false
  return survey.status === 'in_progress'
}

/** 결과 다운로드 — 서버 바인딩 `resultDownloadable`(FINISHED + 호출자 FILE_DOWNLOAD)만 따른다. */
export function canDownloadLectureEvalResults(
  survey: Pick<RegisteredSurvey, 'resultDownloadable'> | null | undefined
): boolean {
  return survey?.resultDownloadable === true
}

/**
 * 응답 목록에서 로그인 관리자가 제출한 강의평가를 찾는다(첫 번째 응답을 쓰지 않는다).
 * 종료 후 목록에는 다른 담당자 응답도 있으므로 `submittedByAdminId`로만 고른다.
 * 로컬(remote 미사용) 응답은 제출자 id가 없어 관리자 id도 없을 때만 내 응답으로 본다.
 */
export function findOwnLectureEvalResponse<T extends Pick<SurveyPollRawResponse, 'submittedByAdminId'>>(
  responses: readonly T[],
  adminAccountId: number | null | undefined
): T | null {
  const me = adminAccountId ?? null
  return (
    responses.find(row => {
      const owner = row.submittedByAdminId ?? null
      return owner == null ? me == null : owner === me
    }) ?? null
  )
}

/** 내 응답의 formResponseId (수정 PATCH 대상) */
export function parseOwnLectureEvalFormResponseId(
  responses: readonly SurveyPollRawResponse[],
  adminAccountId: number | null | undefined
): number | null {
  const own = findOwnLectureEvalResponse(responses, adminAccountId)
  if (own == null) return null
  const n = Number(own.respondentId)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}
