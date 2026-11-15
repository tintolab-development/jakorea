import { PLATFORM_REQUIRED_NOT_FILLED_TITLE } from './platform-alert-copy.ts'

/**
 * 필수 입력 누락 안내 팝업 (Figma 14550-2349).
 * - field: 입력 항목(이름·휴대폰 번호 등) — 「입력하지 않은 필수 항목이 있어요.」
 * - question: 설문 문항 — 「답변하지 않은 필수 문항이 있어요.」
 * 누락이 1개면 설명 한 줄, 여러 개면 목록 + 안내 문구.
 */
export type RequiredMissingKind = 'field' | 'question'

export type RequiredMissing = {
  kind: RequiredMissingKind
  /** 화면에 보이는 항목명·문항 제목 (빈 제목은 넣지 않는다) */
  labels: string[]
}

export type RequiredMissingAlertCopy = {
  title: string
  /** 누락 1개 */
  description?: string
  /** 누락 여러 개 */
  list?: { items: string[]; guide: string }
}

export const REQUIRED_QUESTION_NOT_ANSWERED_TITLE = '답변하지 않은 필수 문항이 있어요.'

/** 문항 제목이 없을 때 — 기존 공통 문구 */
const REQUIRED_QUESTION_FALLBACK_DESCRIPTION = '필수 문항에 답변해 주세요.'

export function buildRequiredMissingAlertCopy(missing: RequiredMissing): RequiredMissingAlertCopy {
  const labels = missing.labels.map(label => label.trim()).filter(Boolean)

  if (missing.kind === 'field') {
    if (labels.length > 1) {
      return {
        title: PLATFORM_REQUIRED_NOT_FILLED_TITLE,
        list: { items: labels, guide: '위 항목을 모두 입력해 주세요.' },
      }
    }
    return {
      title: PLATFORM_REQUIRED_NOT_FILLED_TITLE,
      description: labels[0] ? `‘${labels[0]}’ 항목을 입력해 주세요.` : undefined,
    }
  }

  if (labels.length > 1) {
    return {
      title: REQUIRED_QUESTION_NOT_ANSWERED_TITLE,
      list: { items: labels, guide: '위 문항에 모두 답변해 주세요.' },
    }
  }
  return {
    title: REQUIRED_QUESTION_NOT_ANSWERED_TITLE,
    description: labels[0]
      ? `‘${labels[0]}’\n문항에 답변해 주세요.`
      : REQUIRED_QUESTION_FALLBACK_DESCRIPTION,
  }
}

/** 팝업을 못 띄우는 곳(인라인 문구)용 한 줄 요약 */
export function summarizeRequiredMissingAlertCopy(copy: RequiredMissingAlertCopy): string {
  if (copy.description) return copy.description.replace(/\n/g, ' ')
  return copy.title
}
