import { LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'

/** 강의보고서 교육 내용·운영 — 항목별 타이틀 힌트(스크린샷 SSOT) */
export const LECTURE_REPORT_SESSION_ITEM_TITLE_SEED: Record<
  string,
  { label: string; titleHint?: string }
> = {
  [`${LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationContent}-item-1`]: {
    label: 'Q1. 주요 학습 내용 및 핵심 개념은 무엇이었나요?',
  },
  [`${LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationContent}-item-2`]: {
    label: 'Q2. 강의 진행 내용',
    titleHint: 'ex) 교육/활동 내용, 교구재 활용 방식 등',
  },
  [`${LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationOperation}-item-1`]: {
    label: 'Q1. 전반적인 학생들의 교육 참여도는 어떠했나요?',
    titleHint: 'ex) 전반적인 참여도, 다양한 상황 기반(수업 중 에피소드, 교구재활용 등)',
  },
  [`${LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationOperation}-item-2`]: {
    label: 'Q2. 교육 콘텐츠 난이도 적합성은 어떠했나요?',
    titleHint: '(쉬움/적절/어려움+이유)',
  },
  [`${LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationOperation}-item-3`]: {
    label: 'Q3. 강의 진행 중 이슈 및 불편사항이 있었나요?',
    titleHint: 'ex) 강의 준비, 운영진/학교/강사단과의 소통, 강의 환경 등',
  },
}

/**
 * 저장된 구 시드(titleHint 없음·label에 힌트 포함·특이사항 문구)를
 * 스크린샷 기준 label + titleHint로 보정.
 */
export function resolveLectureReportSessionItemTitle(item: {
  id: string
  label?: string
  titleHint?: string
}): { label: string; titleHint?: string } {
  const seed = LECTURE_REPORT_SESSION_ITEM_TITLE_SEED[item.id]
  if (seed == null) {
    const hint = item.titleHint?.trim()
    return {
      label: item.label ?? '',
      ...(hint ? { titleHint: hint } : {}),
    }
  }

  const rawLabel = item.label?.trim() ?? ''
  const rawHint = item.titleHint?.trim() ?? ''
  const legacyLabelHasHint =
    /\(ex\s*[:：]/i.test(rawLabel) ||
    /\sex\)/i.test(rawLabel) ||
    rawLabel.includes('(쉬움/적절') ||
    rawLabel.includes('특이사항')

  return {
    label: legacyLabelHasHint || rawLabel === '' ? seed.label : rawLabel,
    titleHint: rawHint || seed.titleHint,
  }
}
