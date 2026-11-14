import { describe, expect, it } from 'vitest'
import { createApplicantRecruitFormInstitutionDraft } from '@/features/template/model/applicant-recruit-form-institution-draft'
import {
  createEducatorFacilitatorPledgeDraft,
  createNewSurveyDraft,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'
import type {
  FormTitleNumberingStyle,
  WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import {
  buildTemplateManagementNavLine,
  getFormNavDisplayLine,
  resolveNavTitleNumberingStyle,
} from '@/features/template/lib/form-title-numbering'
import { resolveEducatorPledgeNavLabel } from '@/features/template/ui/form-set/agreement-expense/nav-labels'

function navLines(draft: WritingFormDraft, isTemplateManagement: boolean): string[] {
  const style = resolveNavTitleNumberingStyle(
    draft.formSettings.titleNumbering,
    isTemplateManagement
  )
  return draft.paragraphs.map(p => getFormNavDisplayLine(draft.paragraphs, p, style))
}

describe('resolveNavTitleNumberingStyle', () => {
  it('템플릿 관리 화면에서 「미선택」이면 목록만 1, 2, 3 번호로 바꾼다', () => {
    expect(resolveNavTitleNumberingStyle('none', true)).toBe('numeric')
  })

  it('템플릿 관리 밖(프로그램 등록 등)에서는 「미선택」 그대로 둔다', () => {
    expect(resolveNavTitleNumberingStyle('none', false)).toBe('none')
  })

  it.each<FormTitleNumberingStyle>(['numeric', 'alpha', 'q_repeat', 'q123'])(
    '다른 번호 스타일(%s)은 화면과 관계없이 그대로 둔다',
    style => {
      expect(resolveNavTitleNumberingStyle(style, true)).toBe(style)
      expect(resolveNavTitleNumberingStyle(style, false)).toBe(style)
    }
  )

  it('「미선택」 모집 폼 목록: 템플릿 관리에서만 「1. 참여 기관 모집 정보」「2. 상세 정보」', () => {
    const draft = createApplicantRecruitFormInstitutionDraft()
    expect(draft.formSettings.titleNumbering).toBe('none')
    expect(navLines(draft, true)).toEqual(['1. 참여 기관 모집 정보', '2. 상세 정보'])
    expect(navLines(draft, false)).toEqual(['참여 기관 모집 정보', '상세 정보'])
  })

  it('「미선택」이어도 numeric 목록과 같은 줄을 만든다(번호 대상 아닌 제목형·마무리글은 번호 없음)', () => {
    const base = createNewSurveyDraft()
    const draft: WritingFormDraft = {
      ...base,
      formSettings: { ...base.formSettings, titleNumbering: 'none' },
    }
    const numericLines = draft.paragraphs.map(p =>
      buildTemplateManagementNavLine(draft.paragraphs, p, 'numeric', {
        titlePlaceholder: '설문 제목 입력',
        closingPlaceholder: true,
      })
    )
    const resolved = resolveNavTitleNumberingStyle(draft.formSettings.titleNumbering, true)
    const lines = draft.paragraphs.map(p =>
      buildTemplateManagementNavLine(draft.paragraphs, p, resolved, {
        titlePlaceholder: '설문 제목 입력',
        closingPlaceholder: true,
      })
    )
    expect(lines).toEqual(numericLines)
    draft.paragraphs.forEach((p, index) => {
      const line = lines[index]!.displayLine
      if (p.participatesInTitleNumbering) {
        expect(line).toMatch(/^\d+\. /)
      } else {
        expect(line).not.toMatch(/^\d+\. /)
      }
    })
    expect(draft.paragraphs.some(p => p.participatesInTitleNumbering)).toBe(true)
    expect(draft.paragraphs.some(p => !p.participatesInTitleNumbering)).toBe(true)
  })
})

describe('설문 목록 번호 (템플릿 관리)', () => {
  it('Q1·Q 번호여도 목록만 단락 순번 숫자, 템플릿 관리 밖은 그대로', () => {
    for (const style of ['q123', 'q_repeat', 'alpha', 'none', 'numeric'] as const) {
      expect(resolveNavTitleNumberingStyle(style, true, { survey: true })).toBe('numeric')
      expect(resolveNavTitleNumberingStyle(style, false, { survey: true })).toBe(style)
    }
  })

  it('기본 설문(q123): 목록 「1. …」 순번, 설문자 정보가 Q를 여러 개 써도 목록은 단락 순번', () => {
    const draft = createNewSurveyDraft()
    expect(draft.formSettings.titleNumbering).toBe('q123')
    const style = resolveNavTitleNumberingStyle(draft.formSettings.titleNumbering, true, {
      survey: true,
    })
    const numbered = draft.paragraphs
      .filter(p => p.participatesInTitleNumbering)
      .map(
        p =>
          buildTemplateManagementNavLine(draft.paragraphs, p, style, {
            titlePlaceholder: '설문 제목 입력',
            closingPlaceholder: true,
          }).displayLine
      )
    numbered.forEach((line, index) => {
      expect(line.startsWith(`${index + 1}. `)).toBe(true)
    })
  })
})

describe('교육진행자 서약서 목록 문구 (시안 12956:1678)', () => {
  const pledgeNavLines = (draft: WritingFormDraft) =>
    draft.paragraphs
      .filter(
        p =>
          p.id !== EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemDate &&
          p.id !== EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemSignature
      )
      .map(
        p =>
          buildTemplateManagementNavLine(draft.paragraphs, p, draft.formSettings.titleNumbering, {
            titlePlaceholder: '동의서 제목 입력',
            closingPlaceholder: false,
            proxyConfirmHost: p.id === EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing,
            navLabel: resolveEducatorPledgeNavLabel,
          }).displayLine
      )

  it('시드 그대로면 목록 줄 전부가 시안 문구', () => {
    expect(pledgeNavLines(createEducatorFacilitatorPledgeDraft())).toEqual([
      'JA Korea 교육진행자 서약서(안)',
      '타이틀을 입력해 주세요',
      '1. 아동·청소년 보호와 성범죄 예방',
      '2. 종교적 정치적 중립성 유지',
      '3. 개인정보 보호',
      '4. 품위 유지 및 성실한 교육 수행',
      '본 서약을 위반할 경우, 재단의 교육사업과 관련한 강사 자격이 제한되거나 향후 활동에 불이익이 있을 수 있음을 인지하고 이에 동의합니다.',
    ])
  })

  it('사용자가 카드 제목을 바꾼 단락은 사용자 제목을 보여 준다', () => {
    const base = createEducatorFacilitatorPledgeDraft()
    const draft: WritingFormDraft = {
      ...base,
      paragraphs: base.paragraphs.map(p =>
        p.id === EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause1
          ? { ...p, paragraphTitle: '사용자 조항 제목' }
          : p
      ),
    }
    expect(pledgeNavLines(draft)[2]).toBe('1. 사용자 조항 제목')
    expect(pledgeNavLines(draft)[3]).toBe('2. 종교적 정치적 중립성 유지')
  })

  it('목록 전용 문구는 카드 제목(getFormNavDisplayLine)을 바꾸지 않는다', () => {
    const draft = createEducatorFacilitatorPledgeDraft()
    const clause1 = draft.paragraphs.find(
      p => p.id === EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause1
    )!
    expect(getFormNavDisplayLine(draft.paragraphs, clause1, 'numeric')).toBe(
      '1. 아동·청소년 보호 및 법령 준수'
    )
  })
})
