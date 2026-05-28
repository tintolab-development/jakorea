import {
  createUjatEducationJournalIssuanceDraft,
  createUjatEducationPlanIssuanceDraft,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS,
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS,
  type SessionPlanShortEssayParagraph,
  type UjatJournalEducationInfoParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { UjatDocumentViewerTarget } from './ujat-document-viewer-types'

/** 차시별 mock 내용 (도입/전개/마무리) */
const SESSION_MOCK_CONTENT: Array<{ intro: string; body: string; outro: string }> = [
  {
    intro:
      '오늘 수업의 목표와 경제 개념을 간단히 소개하는 아이스브레이킹 활동을 진행했습니다. 학생들이 흥미를 가질 수 있도록 일상 속 경제 사례(용돈 관리, 저축)를 이야기 나누며 수업에 대한 기대감을 높였습니다.',
    body:
      '경제의 기본 개념인 수요와 공급, 가격 결정 원리를 설명했습니다. 학생들이 직접 시장 상황을 체험할 수 있는 모의 경제 게임을 실시하여 이론을 실습으로 연결했으며, 소그룹 토론을 통해 각자의 생각을 발표하는 시간을 가졌습니다.',
    outro:
      '오늘 배운 내용을 정리하고 핵심 개념을 복습했습니다. 학생들의 질의응답 시간을 가진 후, 다음 차시 예고와 함께 일상 속에서 경제 개념을 찾아보는 과제를 안내했습니다.',
  },
  {
    intro:
      '지난 차시 복습을 통해 학습 연속성을 확보하고, 이번 차시 주제인 저축과 투자의 차이를 소개했습니다. 학생들의 흥미를 유발하기 위해 실제 금융 기관 사진과 그래프를 활용했습니다.',
    body:
      '저축의 종류와 이자율의 개념을 학습하고, 간단한 복리 계산 실습을 진행했습니다. 투자의 위험성과 수익성을 비교 분석하는 그룹 활동을 통해 학생들이 스스로 의사결정하는 경험을 제공했습니다.',
    outro:
      '저축과 투자의 장단점을 비교 정리했습니다. 학생들이 배운 내용을 바탕으로 본인만의 저축 계획을 세워보는 활동지를 배포하고 마무리했습니다.',
  },
  {
    intro:
      '소비자 권리와 책임에 대한 주제로 시작했습니다. 실제 소비 과정에서 발생할 수 있는 문제 사례를 제시하여 학생들이 비판적으로 생각할 수 있도록 유도했습니다.',
    body:
      '합리적인 소비의 기준과 의사결정 과정을 배웠습니다. 다양한 광고 분석 활동을 통해 마케팅 전략을 파악하고, 현명한 소비자가 되기 위한 체크리스트를 직접 작성해 보았습니다.',
    outro:
      '오늘 학습 내용을 토대로 학생들이 가정에서 실천할 수 있는 합리적 소비 방법을 공유했습니다. 수업 소감 발표와 함께 차시 예고로 마무리했습니다.',
  },
  {
    intro:
      '기업가 정신과 창업에 대한 개념을 소개하며 수업을 시작했습니다. 성공한 청년 창업가의 사례를 들어 학생들에게 동기를 부여했습니다.',
    body:
      '창업 아이디어 발굴 방법과 사업 계획서 작성법을 학습했습니다. 팀을 이루어 간단한 사업 아이디어를 기획하고 발표하는 미니 피칭 활동을 진행했습니다.',
    outro:
      '각 팀의 발표에 대해 건설적인 피드백을 나누었습니다. 학기 전체 학습 내용을 정리하고 학생들의 성장을 격려하며 수업을 마무리했습니다.',
  },
]

function fillSessionParagraph(
  paragraph: WritingFormParagraph,
  sessionIndex: number
): WritingFormParagraph {
  if (
    paragraph.kind !== 'single_item' ||
    paragraph.variant !== 'session_plan_short_essay'
  ) {
    return paragraph
  }
  const p = paragraph as SessionPlanShortEssayParagraph
  const content = SESSION_MOCK_CONTENT[sessionIndex] ?? SESSION_MOCK_CONTENT[0]
  const updatedItems = (p.items ?? []).map((item, i) => {
    if (i === 0) return { ...item, bodyText: content.intro }
    if (i === 1) return { ...item, bodyText: content.body }
    return { ...item, bodyText: content.outro }
  })
  return { ...p, items: updatedItems, bodyText: content.intro }
}

function fillJournalEducationInfoParagraph(
  paragraph: WritingFormParagraph,
  target: UjatDocumentViewerTarget
): WritingFormParagraph {
  if (
    paragraph.kind !== 'single_item' ||
    paragraph.variant !== 'ujat_journal_education_info'
  ) {
    return paragraph
  }
  const p = paragraph as UjatJournalEducationInfoParagraph
  const classParts = target.assignedClass.match(/(\d+)학년\s*(\d+)반/)
  return {
    ...p,
    schoolDisplayFallback: target.institutionName,
    grade: classParts ? classParts[1] : '3',
    classSection: classParts ? classParts[2] : '1',
    prepDate: '2026-04-01',
    sessionDate: '2026-04-03',
  }
}

function fillShortEssayParagraph(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') return paragraph
  const p = paragraph as Extract<WritingFormParagraph, { variant: 'short_essay' }>
  const updatedItems = (p.items ?? []).map(item => ({
    ...item,
    bodyText: item.bodyText || '학생들이 수업에 매우 적극적으로 참여했습니다. 경제 개념을 실생활과 연계한 사례 중심 설명이 효과적이었으며, 그룹 활동을 통해 협동심도 기를 수 있었습니다. 다음에는 시각 자료를 더 다양하게 활용하면 좋을 것 같습니다.',
  }))
  return { ...p, items: updatedItems }
}

function fillParagraphs(
  paragraphs: WritingFormParagraph[],
  target: UjatDocumentViewerTarget,
  sessionIdMap: Record<string, number>
): WritingFormParagraph[] {
  return paragraphs.map(p => {
    const sessionIdx = sessionIdMap[p.id]
    if (sessionIdx !== undefined) {
      return fillSessionParagraph(p, sessionIdx)
    }
    if (p.kind === 'single_item' && p.variant === 'ujat_journal_education_info') {
      return fillJournalEducationInfoParagraph(p, target)
    }
    if (p.kind === 'single_item' && p.variant === 'short_essay') {
      return fillShortEssayParagraph(p)
    }
    return p
  })
}

const PLAN_SESSION_ID_MAP: Record<string, number> = {
  [UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.session1]: 0,
  [UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.session2]: 1,
  [UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.session3]: 2,
  [UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.session4]: 3,
}

const JOURNAL_SESSION_ID_MAP: Record<string, number> = {
  [UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.session1]: 0,
  [UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.session2]: 1,
  [UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.session3]: 2,
  [UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.session4]: 3,
}

export function createVolunteerFilledPlanDraft(target: UjatDocumentViewerTarget): WritingFormDraft {
  const base = createUjatEducationPlanIssuanceDraft()
  return {
    ...base,
    paragraphs: fillParagraphs(base.paragraphs, target, PLAN_SESSION_ID_MAP),
  }
}

export function createVolunteerFilledJournalDraft(
  target: UjatDocumentViewerTarget
): WritingFormDraft {
  const base = createUjatEducationJournalIssuanceDraft()
  return {
    ...base,
    paragraphs: fillParagraphs(base.paragraphs, target, JOURNAL_SESSION_ID_MAP),
  }
}

export function createVolunteerFilledDraft(target: UjatDocumentViewerTarget): WritingFormDraft {
  return target.docType === 'plan'
    ? createVolunteerFilledPlanDraft(target)
    : createVolunteerFilledJournalDraft(target)
}
