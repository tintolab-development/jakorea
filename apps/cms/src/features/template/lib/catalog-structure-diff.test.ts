import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import {
  applyCatalogAllowedContent,
  applyUneditedCatalogContent,
  applyUneditedCatalogContentWithReport,
  catalogExtensionStructureChanged,
  catalogStructureChanged,
} from '@/features/template/lib/catalog-structure-diff'
import {
  isCatalogOriginalWritingTemplate,
  isProgramDedicatedWritingTemplate,
} from '@/features/template/lib/catalog-original-identity'
import {
  mergePublishedCatalogDefaults,
  resolveWizardCatalogDraft,
} from '@/features/template/lib/published-catalog-defaults'

type Row = {
  id: string
  kind: string
  requiredMark: boolean
  paragraphTitle: string
  paragraphDescription: string
  placeholder?: string
  bodyText?: string
  options?: Array<{ id: string; label: string }>
  fieldDataRows?: Array<Array<{ kind: string; value: string }>>
  dataRows?: string[][]
}

function form(paragraphs: Row[]) {
  return {
    schemaVersion: 1,
    paragraphs,
  }
}

const baseParagraph = (): Row => ({
  id: 'detail',
  kind: 'single_item',
  requiredMark: true,
  paragraphTitle: '상세 정보',
  paragraphDescription: '설명',
  placeholder: '입력',
  bodyText: '본문',
  options: [{ id: 'opt-1', label: '학생' }],
  fieldDataRows: [[{ kind: 'text', value: '기존' }]],
  dataRows: [['셀']],
})

describe('catalog original identity', () => {
  it('treats a fixed catalog code as the original when baseTemplateCode is itself', () => {
    expect(
      isCatalogOriginalWritingTemplate({
        templateCode: 'recruitment-participant-school',
        baseTemplateCode: 'recruitment-participant-school',
        systemTemplate: true,
      })
    ).toBe(true)
    expect(
      isProgramDedicatedWritingTemplate({
        templateCode: 'recruitment-participant-school-copy-1',
        baseTemplateCode: 'recruitment-participant-school',
        systemTemplate: false,
      })
    ).toBe(true)
    expect(
      isCatalogOriginalWritingTemplate({
        templateCode: 'agreement-crime',
        systemTemplate: true,
      })
    ).toBe(true)
  })
})

describe('catalog structure diff', () => {
  const before = form([baseParagraph(), { ...baseParagraph(), id: 'target', paragraphTitle: '교육 대상' }])

  it('allows description, placeholder, field value, and table cell changes', () => {
    const descriptionOnly = form([
      { ...baseParagraph(), paragraphDescription: '바뀐 설명' },
      before.paragraphs[1]!,
    ])
    const fieldValue = form([
      {
        ...baseParagraph(),
        fieldDataRows: [[{ kind: 'text', value: '중학생들만 가능' }]],
      },
      before.paragraphs[1]!,
    ])
    const cellValue = form([
      { ...baseParagraph(), dataRows: [['중학생들만 가능']] },
      before.paragraphs[1]!,
    ])
    const placeholder = form([
      { ...baseParagraph(), placeholder: '대상을 입력' },
      before.paragraphs[1]!,
    ])

    expect(catalogStructureChanged(before, descriptionOnly)).toBe(false)
    expect(catalogStructureChanged(before, fieldValue)).toBe(false)
    expect(catalogStructureChanged(before, cellValue)).toBe(false)
    expect(catalogStructureChanged(before, placeholder)).toBe(false)
    expect(applyCatalogAllowedContent(before, fieldValue).paragraphs[0]?.fieldDataRows?.[0]?.[0]?.value).toBe(
      '중학생들만 가능'
    )
  })

  it('blocks id, order, required, option structure, title, and mixed edits', () => {
    const idChanged = form([
      { ...baseParagraph(), id: 'detail-renamed' },
      before.paragraphs[1]!,
    ])
    const reordered = form([before.paragraphs[1]!, before.paragraphs[0]!])
    const requiredChanged = form([
      { ...baseParagraph(), requiredMark: false },
      before.paragraphs[1]!,
    ])
    const optionChanged = form([
      {
        ...baseParagraph(),
        options: [
          { id: 'opt-1', label: '학생' },
          { id: 'opt-2', label: '교사' },
        ],
      },
      before.paragraphs[1]!,
    ])
    const titleChanged = form([
      { ...baseParagraph(), paragraphTitle: '다른 제목' },
      before.paragraphs[1]!,
    ])
    const mixed = form([
      { ...baseParagraph(), paragraphDescription: '설명 수정', requiredMark: false },
      before.paragraphs[1]!,
    ])

    expect(catalogStructureChanged(before, idChanged)).toBe(true)
    expect(catalogStructureChanged(before, reordered)).toBe(true)
    expect(catalogStructureChanged(before, requiredChanged)).toBe(true)
    expect(catalogStructureChanged(before, optionChanged)).toBe(true)
    expect(catalogStructureChanged(before, titleChanged)).toBe(true)
    expect(catalogStructureChanged(before, mixed)).toBe(true)
    expect(applyCatalogAllowedContent(before, titleChanged).paragraphs[0]?.paragraphTitle).toBe('상세 정보')
  })

  it('ignores object key order', () => {
    const reorderedKeys = {
      paragraphs: [
        {
          paragraphDescription: '설명',
          id: 'detail',
          paragraphTitle: '상세 정보',
          kind: 'single_item',
          requiredMark: true,
        },
      ],
      schemaVersion: 1,
    }
    const original = {
      schemaVersion: 1,
      paragraphs: [
        {
          id: 'detail',
          kind: 'single_item',
          requiredMark: true,
          paragraphTitle: '상세 정보',
          paragraphDescription: '설명',
        },
      ],
    }
    expect(catalogStructureChanged(original, reorderedKeys)).toBe(false)
  })
})

describe('wizard published defaults', () => {
  const seed = form([baseParagraph()])
  const published = form([{ ...baseParagraph(), paragraphDescription: '중학생들만 가능' }])
  const individual = form([{ ...baseParagraph(), paragraphDescription: '개인 기본값' }])

  it('applies the published payload for a new wizard entry', () => {
    const next = resolveWizardCatalogDraft({ saved: null, seed, published })
    expect(next.paragraphs[0]?.paragraphDescription).toBe('중학생들만 가능')
  })

  it('uses the template payload for the selected form, not another type', () => {
    const school = resolveWizardCatalogDraft({ saved: null, seed, published })
    const person = resolveWizardCatalogDraft({ saved: null, seed, published: individual })
    expect(school.paragraphs[0]?.paragraphDescription).toBe('중학생들만 가능')
    expect(person.paragraphs[0]?.paragraphDescription).toBe('개인 기본값')
  })

  it('keeps a restored draft and an existing copy ahead of a later catalog change', () => {
    const saved = form([{ ...baseParagraph(), paragraphDescription: '임시저장 값' }])
    const copy = form([{ ...baseParagraph(), paragraphDescription: '프로그램 복사본' }])
    const later = form([{ ...baseParagraph(), paragraphDescription: '이후 원본' }])
    expect(resolveWizardCatalogDraft({ saved, seed, published: later })).toBe(saved)
    expect(resolveWizardCatalogDraft({ saved: copy, seed, published: later }).paragraphs[0]?.paragraphDescription).toBe(
      '프로그램 복사본'
    )
  })

  it('does not overwrite a field the user already edited', () => {
    const current = form([{ ...baseParagraph(), paragraphDescription: '사용자 입력' }])
    const next = applyUneditedCatalogContent(current, published, seed)
    expect(next.paragraphs[0]?.paragraphDescription).toBe('사용자 입력')
    expect(next.paragraphs[0]?.placeholder).toBe('입력')
  })
})

describe('C3 catalog original identity (BE 기준)', () => {
  it('decides by templateScope/sourceTemplateId when known', () => {
    expect(
      isCatalogOriginalWritingTemplate({
        templateCode: 'recruitment-participant-school-copy-1',
        templateScope: 'CATALOG',
        sourceTemplateId: null,
      })
    ).toBe(true)
    expect(
      isCatalogOriginalWritingTemplate({
        templateCode: 'recruitment-participant-school',
        templateScope: 'CATALOG',
        sourceTemplateId: 12,
      })
    ).toBe(false)
    expect(
      isProgramDedicatedWritingTemplate({
        templateCode: 'recruitment-participant-school',
        templateScope: 'PROGRAM',
        sourceTemplateId: 12,
      })
    ).toBe(true)
  })

  it('treats the four legacy trained-teacher seeds (use_yn=false) as originals', () => {
    for (const code of [
      'registration-trained-teacher',
      'recruitment-trained-teacher-organization',
      'application-trained-teacher-participant',
      'application-trained-teacher-organization',
    ]) {
      expect(isCatalogOriginalWritingTemplate({ templateCode: code, systemTemplate: true })).toBe(true)
    }
  })
})

describe('C4 semantic equivalence and allowed content', () => {
  const original = form([baseParagraph()])

  it('treats null/undefined/[]/{} and numeric strings as the same serialization', () => {
    const withNulls = {
      schemaVersion: 1,
      paragraphs: [{ ...baseParagraph(), helpText: null, extra: [], meta: {} }],
    }
    expect(catalogStructureChanged(original, withNulls)).toBe(false)
    const numeric = { schemaVersion: '1', paragraphs: [baseParagraph()] }
    expect(catalogStructureChanged(original, numeric)).toBe(false)
  })

  it('keeps allowed content keys that exist only in the editor', () => {
    const edited = form([
      { ...baseParagraph(), helpText: '도움말' } as Row & { helpText: string },
    ])
    expect(catalogStructureChanged(original, edited)).toBe(false)
    const merged = applyCatalogAllowedContent(original, edited) as {
      paragraphs: Array<Record<string, unknown>>
    }
    expect(merged.paragraphs[0]?.helpText).toBe('도움말')
  })
})

describe('C5 extensionJson structure guard', () => {
  const before = {
    overlay: { 'detail.target': '중학생', items: [{ id: 'a', label: '가' }] },
    editorState: { activeParagraphId: 'detail' },
  }

  it('allows content value changes inside overlay/editorState/uiState', () => {
    expect(
      catalogExtensionStructureChanged(before, {
        ...before,
        overlay: { ...before.overlay, 'detail.target': '고등학생' },
        uiState: { note: '메모' },
      })
    ).toBe(false)
  })

  it('blocks id, reorder, required and options changes inside extension sections', () => {
    expect(
      catalogExtensionStructureChanged(before, {
        ...before,
        overlay: { ...before.overlay, items: [{ id: 'b', label: '가' }] },
      })
    ).toBe(true)
    expect(
      catalogExtensionStructureChanged(before, {
        ...before,
        overlay: { ...before.overlay, required: true },
      })
    ).toBe(true)
    expect(
      catalogExtensionStructureChanged(before, {
        ...before,
        overlay: { ...before.overlay, items: [{ id: 'a', label: '가', options: ['x'] }] },
      })
    ).toBe(true)
  })

  it('blocks keys outside the content sections from changing', () => {
    expect(catalogExtensionStructureChanged(before, { ...before, bindings: { key: 'x' } })).toBe(true)
  })
})

describe('C6/C8 published defaults merge', () => {
  const seed = form([baseParagraph(), { ...baseParagraph(), id: 'target' }])

  it('reports a structure mismatch and keeps seed order and ids', () => {
    const published = form([
      { ...baseParagraph(), id: 'target', paragraphDescription: '게시 대상' },
      { ...baseParagraph(), paragraphDescription: '게시 상세' },
      { ...baseParagraph(), id: 'extra' },
    ])
    const { value, mismatches } = applyUneditedCatalogContentWithReport(seed, published, seed)
    expect(value.paragraphs.map(item => item.id)).toEqual(['detail', 'target'])
    expect(mismatches.length).toBeGreaterThan(0)
  })

  it('merges a late published response onto current user edits (async hydrate)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const published = form([
      { ...baseParagraph(), paragraphDescription: '게시 설명', placeholder: '게시 placeholder' },
      { ...baseParagraph(), id: 'target' },
    ])
    const current = form([
      { ...baseParagraph(), paragraphDescription: '사용자가 먼저 입력' },
      { ...baseParagraph(), id: 'target' },
    ])
    const next = mergePublishedCatalogDefaults({ current, seed, published, templateCode: 'x' })
    expect(next.paragraphs[0]?.paragraphDescription).toBe('사용자가 먼저 입력')
    expect(next.paragraphs[0]?.placeholder).toBe('게시 placeholder')
    const empty = mergePublishedCatalogDefaults({
      current: { schemaVersion: 1, paragraphs: [] as Row[] },
      seed,
      published,
    })
    expect(empty.paragraphs[0]?.paragraphDescription).toBe('게시 설명')
    warn.mockRestore()
  })
})
