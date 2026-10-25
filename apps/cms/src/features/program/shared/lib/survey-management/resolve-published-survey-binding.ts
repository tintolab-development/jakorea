import dayjs from 'dayjs'
import { schemaJsonToWritingFormDraft } from '@/features/template/api/adapters/form-template-draft-adapters'
import { resolveFormTemplateCatalogIds } from '@/features/template/api/admin-form-templates-service'
import {
  fetchFormTemplateVersionRemote,
  fetchFormTemplateVersionsRemote,
} from '@/features/template/api/form-templates-api-client'
import {
  isTitleWithPeriodParagraph,
  resolveTitleEndPeriodMode,
  resolveTitleStartPeriodMode,
} from '@/features/template/lib/title-with-period-settings'

export type SurveySubmissionPeriod = {
  submissionStartAt?: string
  submissionEndAt?: string
}

export type PublishedSurveyBindingResolution =
  | ({ ok: true; templateId: number; templateVersionId: number } & SurveySubmissionPeriod)
  | { ok: false; reason: 'not_found' | 'not_published' }

function toCustomPeriodIso(
  mode: string,
  value: string | null | undefined,
  presetLabel: string | null | undefined
): string | undefined {
  if (mode !== 'custom' || presetLabel?.trim() || !value) return undefined
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.toISOString() : undefined
}

/**
 * 양식 제목 단락 「작성 기간」(직접 지정 날짜만) → binding 기간.
 * 「바로 시작」·「마감 없음」·활동일 상대 프리셋은 절대 시각이 없어 보내지 않는다.
 */
/** 양식 제목형 단락 `surveyTitle` — 설문조사 탭·목록 표시명 */
export function readSurveyTitleFromSchema(
  schemaJson: string | Record<string, unknown> | null | undefined
): string | undefined {
  const draft = schemaJsonToWritingFormDraft(schemaJson)
  const titleParagraph = draft?.paragraphs.find(isTitleWithPeriodParagraph)
  const trimmed = titleParagraph?.surveyTitle?.trim()
  return trimmed !== '' ? trimmed : undefined
}

export function readSurveySubmissionPeriodFromSchema(
  schemaJson: string | Record<string, unknown> | null | undefined
): SurveySubmissionPeriod {
  const draft = schemaJsonToWritingFormDraft(schemaJson)
  const title = draft?.paragraphs.find(isTitleWithPeriodParagraph)
  if (title == null || title.showWritingPeriodOnForm !== true) return {}

  const submissionStartAt = toCustomPeriodIso(
    resolveTitleStartPeriodMode(title),
    title.startAt,
    title.startPeriodPresetLabel
  )
  const submissionEndAt = toCustomPeriodIso(
    resolveTitleEndPeriodMode(title),
    title.endAt,
    title.endPeriodPresetLabel
  )
  return {
    ...(submissionStartAt != null ? { submissionStartAt } : {}),
    ...(submissionEndAt != null ? { submissionEndAt } : {}),
  }
}

async function fetchSubmissionPeriod(templateVersionId: number): Promise<SurveySubmissionPeriod> {
  const version = await fetchFormTemplateVersionRemote(templateVersionId)
  return readSurveySubmissionPeriodFromSchema(version.schemaJson)
}

/**
 * 설문·만족도·강의평가 등록은 양식 관리에서 고른 템플릿 자체의 version에 바인딩한다(카탈로그 복제 없음).
 * 최신 PUBLISHED version에만 바인딩한다. 프로그램 흐름에서 공용 템플릿을 게시하지 않는다
 * (게시하면 기존 PUBLISHED가 ARCHIVED되어 다른 프로그램 설문이 Platform에서 사라질 수 있다).
 */
export async function resolvePublishedSurveyBinding(
  templateCode: string
): Promise<PublishedSurveyBindingResolution> {
  const code = templateCode.trim()
  if (code === '') return { ok: false, reason: 'not_found' }

  const resolved = await resolveFormTemplateCatalogIds(code)
  if (resolved == null) return { ok: false, reason: 'not_found' }

  const versions = (await fetchFormTemplateVersionsRemote(resolved.templateId))
    .filter(version => version.templateVersionId != null)
    .sort((left, right) => (right.versionNo ?? 0) - (left.versionNo ?? 0))

  const latestPublished = versions.find(version => version.versionStatus === 'PUBLISHED')

  // 공용 데이터 보호(2026-10-25): 프로그램 흐름에서는 카탈로그 설문 버전을 게시(publish)하지 않는다.
  // DRAFT만 있으면 양식 관리에서 게시한 뒤 바인딩하도록 not_published를 돌려준다.
  const templateVersionId: number | undefined = latestPublished?.templateVersionId
  if (templateVersionId == null) return { ok: false, reason: 'not_published' }

  return {
    ok: true,
    templateId: resolved.templateId,
    templateVersionId,
    ...(await fetchSubmissionPeriod(templateVersionId)),
  }
}

export function surveyBindingResolutionAlert(
  reason: Exclude<PublishedSurveyBindingResolution, { ok: true }>['reason']
): string {
  if (reason === 'not_published') {
    return '선택한 양식에 등록 가능한 버전이 없습니다. 양식 관리에서 양식을 저장한 뒤 다시 등록해 주세요.'
  }
  return '선택한 템플릿의 서버 ID를 찾지 못했습니다. 양식 관리에서 템플릿을 동기화한 뒤 다시 시도해 주세요.'
}
