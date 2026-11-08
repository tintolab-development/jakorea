/**
 * 동의서 시안 반영 — 서버(CMS) 저장 양식 보존 · 제출본 스냅샷 회귀.
 * CMS가 저장한 schemaJson(문구 수정본)이 Platform 작성 정규화를 거쳐도 seed로 덮이지 않는지 확인한다.
 */
import { describe, expect, it } from 'vitest'
import {
  listMemberConsentIncompleteRequiredFields,
  normalizeMemberConsentWriteDraft,
} from '@jakorea/form-schema/consent'
import {
  AGREEMENT_NOTICE_CONFIRMATION_TEXT,
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createEducatorFacilitatorPledgeDraft,
  ensureAgreementNoticeConfirmationClosing,
  ensureAgreementNoticeInstitutionPurposeParagraphs,
  normalizeWritingFormDraft,
  overlayAgreementNoticeSeedHorizontalTable,
  resolveHorizontalTableCellPlainText,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import {
  PAYMENT_STATEMENT_PRE_CONSENT_IDS,
  createPaymentStatementPreConsentDraft,
  overlayPaymentStatementPreConsentSeedHorizontalTables,
} from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import {
  RECEIPT_PRE_CONSENT_IDS,
  createReceiptPreConsentDraft,
} from '@jakorea/form-schema/paragraph-ids/receipt-pre-consent-draft'
import { resolveConsentPreviewDraft } from '../src/features/mypage/settings/lib/parse-consent-document-draft'
import type { PortalConsentDocumentDetail } from '../src/features/mypage/settings/api/consents'

const EDITED = 'TEST-수정됨'

/** CMS 저장 → API → Platform: JSON 왕복 후 CMS 정규화·Platform 작성 정규화 */
function cmsToPlatform(draft: WritingFormDraft, templateId: string): WritingFormDraft {
  const fromServer = JSON.parse(JSON.stringify(draft)) as WritingFormDraft
  return normalizeMemberConsentWriteDraft(normalizeWritingFormDraft(fromServer), templateId)
}

function byId(draft: WritingFormDraft, id: string): WritingFormParagraph {
  const found = draft.paragraphs.find(p => p.id === id)
  if (!found) throw new Error(`missing paragraph ${id}`)
  return found
}

function patch(
  draft: WritingFormDraft,
  id: string,
  fn: (p: WritingFormParagraph) => WritingFormParagraph,
): WritingFormDraft {
  return { ...draft, paragraphs: draft.paragraphs.map(p => (p.id === id ? fn(p) : p)) }
}

function editHorizontalTable(p: WritingFormParagraph): WritingFormParagraph {
  if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') throw new Error('not table')
  return {
    ...p,
    paragraphTitle: `${EDITED} 제목`,
    bottomText: `${EDITED} 하단`,
    dataRows: p.dataRows.map((row, i) => (i === 0 ? row.map((c, j) => (j === 1 ? EDITED : c)) : row)),
    fieldDataRows: p.fieldDataRows.map((row, i) =>
      i === 0 ? row.map((c, j) => (j === 1 ? ({ ...c, value: EDITED } as typeof c) : c)) : row,
    ),
  }
}

function tableOf(p: WritingFormParagraph) {
  if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') throw new Error('not table')
  return p
}

describe('지급조서·영수증 — 서버 표 문구 보존', () => {
  it.each([
    ['agreement-third-party', createPaymentStatementPreConsentDraft, PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection],
    ['agreement-third-party', createPaymentStatementPreConsentDraft, PAYMENT_STATEMENT_PRE_CONSENT_IDS.p3ThirdParty],
    ['agreement-receipt-pre-consent', createReceiptPreConsentDraft, RECEIPT_PRE_CONSENT_IDS.p1Collection],
    ['agreement-receipt-pre-consent', createReceiptPreConsentDraft, RECEIPT_PRE_CONSENT_IDS.p2ThirdParty],
  ] as const)('%s %s', (templateId, create, tableId) => {
    const saved = patch(create(), tableId, editHorizontalTable)
    const out = tableOf(byId(cmsToPlatform(saved, templateId), tableId))
    expect(out.paragraphTitle).toBe(`${EDITED} 제목`)
    expect(out.bottomText).toBe(`${EDITED} 하단`)
    expect(resolveHorizontalTableCellPlainText(out, 0, 1)).toBe(EDITED)
  })

  it('구조가 깨진 표(빈 행)는 seed로 복구한다', () => {
    const tableId = PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection
    const seed = tableOf(byId(createPaymentStatementPreConsentDraft(), tableId))
    const broken = patch(createPaymentStatementPreConsentDraft(), tableId, p => ({
      ...tableOf(p),
      dataRows: [],
      fieldDataRows: [],
    }))
    const out = tableOf(byId(cmsToPlatform(broken, 'agreement-third-party'), tableId))
    expect(out.fieldDataRows.length).toBe(seed.fieldDataRows.length)
    expect(resolveHorizontalTableCellPlainText(out, 0, 0)).toBe(
      resolveHorizontalTableCellPlainText(seed, 0, 0),
    )
  })

  it('시안 문구: 지급조서 p1 항목·p2 법령 수집(동의 라디오 없음)', () => {
    const draft = cmsToPlatform(createPaymentStatementPreConsentDraft(), 'agreement-third-party')
    const p1 = tableOf(byId(draft, PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection))
    expect(resolveHorizontalTableCellPlainText(p1, 0, 0)).toContain('영문 성명')
    const p2 = tableOf(byId(draft, PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection))
    expect(p2.showBottomConsent).toBe(false)
    expect(p2.requiredMark).toBe(false)
    const fields = listMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-third-party' })
    expect(fields.some(f => f.paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection)).toBe(false)
    expect(fields.some(f => f.paragraphId === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty)).toBe(false)
  })
})

describe('초상권 — 서버 문구 보존 / 빈 값만 seed', () => {
  it('저장된 서문은 유지, 빈 서문은 seed로 채움', () => {
    const id = AGREEMENT_PORTRAIT_PARAGRAPH_IDS.intro
    const edited = patch(createAgreementPortraitDraft(), id, p =>
      p.kind === 'single_item' && p.variant === 'agreement_explanation_text' ? { ...p, bodyText: EDITED } : p,
    )
    const keep = byId(cmsToPlatform(edited, 'agreement-portrait'), id)
    expect(keep.kind === 'single_item' && keep.variant === 'agreement_explanation_text' && keep.bodyText).toBe(EDITED)

    const empty = patch(createAgreementPortraitDraft(), id, p =>
      p.kind === 'single_item' && p.variant === 'agreement_explanation_text' ? { ...p, bodyText: '' } : p,
    )
    const filled = byId(cmsToPlatform(empty, 'agreement-portrait'), id)
    expect(
      filled.kind === 'single_item' && filled.variant === 'agreement_explanation_text' && filled.bodyText,
    ).toContain('JA Korea에 부여합니다')
  })

  it('초상권 3번: 미선택은 미작성, 「동의하지 않음」은 허용 (§3.3)', () => {
    const id = AGREEMENT_PORTRAIT_PARAGRAPH_IDS.portraitUsageTable
    const draft = cmsToPlatform(createAgreementPortraitDraft(), 'agreement-portrait')
    const unanswered = listMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-portrait' })
    expect(unanswered.some(f => f.paragraphId === id)).toBe(true)
    const disagreed = patch(draft, id, p =>
      p.kind === 'single_item' && p.variant === 'vertical_table' ? { ...p, bottomConsent: 'disagree' } : p,
    )
    const fields = listMemberConsentIncompleteRequiredFields(disagreed, { templateId: 'agreement-portrait' })
    expect(fields.some(f => f.paragraphId === id)).toBe(false)
  })
})

describe('서약서 — 서버 문구 보존', () => {
  it('제목·조항 제목 수정본 유지', () => {
    let draft = createEducatorFacilitatorPledgeDraft()
    draft = patch(draft, EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title, p =>
      p.kind === 'description' && p.variant === 'survey_title_with_period' ? { ...p, surveyTitle: EDITED } : p,
    )
    draft = patch(draft, EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause1, p => ({
      ...p,
      paragraphTitle: `${EDITED} 조항`,
    }))
    const out = cmsToPlatform(draft, 'agreement-expense')
    const title = byId(out, EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title)
    expect(title.kind === 'description' && title.variant === 'survey_title_with_period' && title.surveyTitle).toBe(EDITED)
    expect(byId(out, EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause1).paragraphTitle).toBe(`${EDITED} 조항`)
  })

  it('seed: 제목 (안) 없음, 마무리 둘째 줄 유효기간 안내', () => {
    const out = cmsToPlatform(createEducatorFacilitatorPledgeDraft(), 'agreement-expense')
    const title = byId(out, EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title)
    expect(title.kind === 'description' && title.variant === 'survey_title_with_period' && title.surveyTitle).toBe(
      'JA Korea 교육진행자 서약서',
    )
    const closing = byId(out, EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing)
    expect(closing.kind === 'description' && closing.variant === 'closing' && closing.body).toContain(
      '\n본 서약은 서약일로부터 1년간 유효',
    )
  })
})

describe('행정정보 — 서버 문구 보존·누락 단락 보강', () => {
  it('표 하단·이용기관 수정본 유지', () => {
    let draft = createAgreementNoticeDraft()
    draft = patch(draft, AGREEMENT_NOTICE_PARAGRAPH_IDS.table, p => ({ ...tableOf(p), bottomText: EDITED }))
    draft = patch(draft, AGREEMENT_NOTICE_PARAGRAPH_IDS.institution, p =>
      p.kind === 'single_item' && p.variant === 'agreement_explanation_text' ? { ...p, bodyText: EDITED } : p,
    )
    const out = cmsToPlatform(draft, 'agreement-notice')
    expect(tableOf(byId(out, AGREEMENT_NOTICE_PARAGRAPH_IDS.table)).bottomText).toBe(EDITED)
    const inst = byId(out, AGREEMENT_NOTICE_PARAGRAPH_IDS.institution)
    expect(inst.kind === 'single_item' && inst.variant === 'agreement_explanation_text' && inst.bodyText).toBe(EDITED)
  })

  it('구 저장본(안내 단락 없음·확인 문구 빈 값) → 안내 단락 삽입, 확인 문구 seed', () => {
    const base = createAgreementNoticeDraft()
    const old: WritingFormDraft = {
      ...base,
      paragraphs: base.paragraphs
        .filter(p => p.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.subjectNote)
        .map(p =>
          p.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing &&
          p.kind === 'description' &&
          p.variant === 'closing'
            ? { ...p, body: '' }
            : p,
        ),
    }
    const out = cmsToPlatform(old, 'agreement-notice')
    const ids = out.paragraphs.map(p => p.id)
    expect(ids.indexOf(AGREEMENT_NOTICE_PARAGRAPH_IDS.subjectNote)).toBe(
      ids.indexOf(AGREEMENT_NOTICE_PARAGRAPH_IDS.subject) + 1,
    )
    const closing = byId(out, AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing)
    expect(closing.kind === 'description' && closing.variant === 'closing' && closing.body).toBe(
      AGREEMENT_NOTICE_CONFIRMATION_TEXT,
    )
  })

  it('저장된 확인 문구는 유지', () => {
    const draft = patch(createAgreementNoticeDraft(), AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing, p =>
      p.kind === 'description' && p.variant === 'closing' ? { ...p, body: EDITED } : p,
    )
    const closing = byId(cmsToPlatform(draft, 'agreement-notice'), AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing)
    expect(closing.kind === 'description' && closing.variant === 'closing' && closing.body).toBe(EDITED)
  })
})

describe('제출본 스냅샷 — 최신 양식으로 재렌더하지 않음', () => {
  it('v1 제출본(filledDocument)과 v2 최신 양식이 다르면 v1을 보여 준다', () => {
    const v1 = patch(createPaymentStatementPreConsentDraft(), PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection, p => ({
      ...tableOf(p),
      bottomText: 'v1 제출 당시 문구',
    }))
    const v2 = patch(createPaymentStatementPreConsentDraft(), PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection, p => ({
      ...tableOf(p),
      bottomText: 'v2 최신 문구',
    }))
    const detail = {
      documentId: 1,
      filledDocument: { templateVersionId: 1, templateCode: 'agreement-third-party', schemaJson: v1 },
      formTemplateVersion: { templateVersionId: 2, templateCode: 'agreement-third-party', schemaJson: v2 },
    } as unknown as PortalConsentDocumentDetail
    const preview = resolveConsentPreviewDraft(detail, 'agreement-third-party')
    expect(preview).not.toBeNull()
    expect(tableOf(byId(preview!, PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection)).bottomText).toBe(
      'v1 제출 당시 문구',
    )
  })
})

describe('사용자 저장표 보존 vs 구조 복구 (custom table fixture)', () => {
  /**
   * 관리자가 열 1개·행 1개를 추가하고 1행 마지막(원래) 열을 비운 표.
   * (행정정보 1행 좌측 연번·행정정보명은 빈 값이면 seed로 채우는 기존 규칙 — HEAD는 항상 덮어씀)
   */
  function customize(p: WritingFormParagraph): WritingFormParagraph {
    const t = tableOf(p)
    const blankCol = t.columnHeaders.length - 1
    const width = t.columnHeaders.length + 1
    return {
      ...t,
      columnHeaders: [...t.columnHeaders, '사용자 추가 열'],
      columnFields: [...t.columnFields, { kind: 'text', placeholder: '' } as (typeof t.columnFields)[number]],
      dataRows: [
        ...t.dataRows.map((row, ri) => [...row.map((c, ci) => (ri === 0 && ci === blankCol ? '' : c)), `추가셀${ri}`]),
        Array.from({ length: width }, (_, i) => (i === 0 ? '사용자 추가 행' : '')),
      ],
      fieldDataRows: [
        ...t.fieldDataRows.map((row, ri) => [
          ...row.map((c, ci) => (ri === 0 && ci === blankCol ? ({ ...c, value: '' } as typeof c) : c)),
          { kind: 'text', value: `추가셀${ri}` } as (typeof row)[number],
        ]),
        Array.from({ length: width }, (_, i) => ({ kind: 'text', value: i === 0 ? '사용자 추가 행' : '' }) as (typeof t.fieldDataRows)[number][number]),
      ],
    }
  }

  it.each([
    ['agreement-third-party', createPaymentStatementPreConsentDraft, PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection],
    ['agreement-third-party', createPaymentStatementPreConsentDraft, PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty],
    ['agreement-receipt-pre-consent', createReceiptPreConsentDraft, RECEIPT_PRE_CONSENT_IDS.p2ThirdParty],
    ['agreement-notice', createAgreementNoticeDraft, AGREEMENT_NOTICE_PARAGRAPH_IDS.table],
  ] as const)('%s %s — 열·행 추가·일부 빈칸은 그대로', (templateId, create, tableId) => {
    const saved = patch(create(), tableId, customize)
    const expected = tableOf(byId(saved, tableId))
    const out = tableOf(byId(cmsToPlatform(saved, templateId), tableId))
    expect(out.columnHeaders).toEqual(expected.columnHeaders)
    expect(out.columnHeaders.at(-1)).toBe('사용자 추가 열')
    const rows = Math.max(expected.dataRows.length, expected.fieldDataRows.length)
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < expected.columnHeaders.length; c += 1) {
        expect(resolveHorizontalTableCellPlainText(out, r, c)).toBe(resolveHorizontalTableCellPlainText(expected, r, c))
      }
    }
    expect(resolveHorizontalTableCellPlainText(out, 0, expected.columnHeaders.length - 2)).toBe('')
  })

  it('본문 셀 전부 빈 표만 복구 — 표 구조만 seed, 필수·동의 노출·제목은 저장값 유지', () => {
    const tableId = PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection
    const seedTable = tableOf(byId(createPaymentStatementPreConsentDraft(), tableId))
    /** 구 서버 양식: p2가 필수 동의(라디오) — 깨진 표 복구로 필수 해제되면 안 됨 */
    const saved = patch(createPaymentStatementPreConsentDraft(), tableId, p => {
      const t = tableOf(p)
      return {
        ...t,
        paragraphTitle: `${EDITED} 제목`,
        requiredMark: true,
        answerRequired: true,
        showBottomConsent: true,
        bottomConsent: undefined,
        dataRows: t.dataRows.map(row => row.map(() => '')),
        fieldDataRows: t.fieldDataRows.map(row => row.map(c => ({ ...c, value: '' }) as typeof c)),
      } as WritingFormParagraph
    })
    const draft = cmsToPlatform(saved, 'agreement-third-party')
    const out = tableOf(byId(draft, tableId))
    expect(resolveHorizontalTableCellPlainText(out, 0, 0)).toBe(resolveHorizontalTableCellPlainText(seedTable, 0, 0))
    expect(out.paragraphTitle).toBe(`${EDITED} 제목`)
    expect(out.requiredMark).toBe(true)
    expect(out.showBottomConsent).toBe(true)
    const fields = listMemberConsentIncompleteRequiredFields(draft, { templateId: 'agreement-third-party' })
    expect(fields.some(f => f.paragraphId === tableId)).toBe(true)
  })

  it('p2/p4: 저장 양식이 동의 라디오 노출(true)이면 여전히 필수, false일 때만 면제', () => {
    const ids = [PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection, PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty]
    let legacy = createPaymentStatementPreConsentDraft()
    for (const id of ids) {
      legacy = patch(legacy, id, p => ({ ...tableOf(p), requiredMark: true, answerRequired: true, showBottomConsent: true, bottomConsent: undefined }) as WritingFormParagraph)
    }
    const legacyFields = listMemberConsentIncompleteRequiredFields(cmsToPlatform(legacy, 'agreement-third-party'), {
      templateId: 'agreement-third-party',
    })
    for (const id of ids) expect(legacyFields.some(f => f.paragraphId === id)).toBe(true)
  })
})

describe('기존 제출본 조회 경로 — 내용·입력값 불변', () => {
  /** 조회 경로가 쓰는 공통 정규화(작성 진입 전용 빈값 채움은 제외) */
  function viewNormalize(draft: WritingFormDraft): WritingFormDraft {
    const fromServer = JSON.parse(JSON.stringify(draft)) as WritingFormDraft
    return overlayAgreementNoticeSeedHorizontalTable(
      ensureAgreementNoticeInstitutionPurposeParagraphs(
        ensureAgreementNoticeConfirmationClosing(normalizeWritingFormDraft(fromServer)),
      ),
    )
  }

  it('구 행정정보 제출본: 안내 단락 미삽입, 빈 확인 문구·빈 이용기관은 빈 값 그대로, 주민번호 입력 유지', () => {
    const base = createAgreementNoticeDraft()
    const submitted: WritingFormDraft = {
      ...base,
      paragraphs: base.paragraphs
        .filter(p => p.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.subjectNote)
        .map(p => {
          if (p.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing && p.kind === 'description' && p.variant === 'closing') {
            return { ...p, body: '' }
          }
          if (p.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.institution && p.kind === 'single_item' && p.variant === 'agreement_explanation_text') {
            return { ...p, bodyText: '' }
          }
          if (p.kind === 'single_item' && p.variant === 'horizontal_table' && p.idTypeWithInput) {
            return { ...p, idTypeWithInput: { ...p.idTypeWithInput, inputValue: '9001011234567' } }
          }
          return p
        }),
    }
    const out = viewNormalize(submitted)
    expect(out.paragraphs.map(p => p.id)).toEqual(submitted.paragraphs.map(p => p.id))
    const closing = byId(out, AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing)
    expect(closing.kind === 'description' && closing.variant === 'closing' && closing.body).toBe('')
    const inst = byId(out, AGREEMENT_NOTICE_PARAGRAPH_IDS.institution)
    expect(inst.kind === 'single_item' && inst.variant === 'agreement_explanation_text' && inst.bodyText).toBe('')
    const withId = out.paragraphs.find(p => p.kind === 'single_item' && p.variant === 'horizontal_table' && p.idTypeWithInput)
    expect(withId && withId.kind === 'single_item' && withId.variant === 'horizontal_table' && withId.idTypeWithInput?.inputValue).toBe(
      '9001011234567',
    )
  })

  it('지급조서 제출본(구 문구·동의 응답): 조회 정규화 후 표·응답 동일', () => {
    let submitted = createPaymentStatementPreConsentDraft()
    for (const id of Object.values(PAYMENT_STATEMENT_PRE_CONSENT_IDS)) {
      submitted = patch(submitted, id, p =>
        p.kind === 'single_item' && p.variant === 'horizontal_table'
          ? ({ ...editHorizontalTable(p), showBottomConsent: true, requiredMark: true, bottomConsent: 'disagree' } as WritingFormParagraph)
          : p,
      )
    }
    const out = overlayPaymentStatementPreConsentSeedHorizontalTables(normalizeWritingFormDraft(JSON.parse(JSON.stringify(submitted))))
    for (const p of submitted.paragraphs) {
      if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') continue
      const o = tableOf(byId(out, p.id))
      expect(o.paragraphTitle).toBe(p.paragraphTitle)
      expect(o.bottomText).toBe(p.bottomText)
      expect(o.bottomConsent).toBe('disagree')
      expect(o.requiredMark).toBe(true)
      expect(resolveHorizontalTableCellPlainText(o, 0, 1)).toBe(EDITED)
    }
  })
})
