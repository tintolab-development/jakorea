import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  createAgreementPortraitDraft,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
} from '@jakorea/form-schema/writing-form'
import { PlatformConsentFormBody } from '../src/features/mypage/instructor-apply/consent/platform-consent-form-body'
import typography from '../src/features/mypage/settings/ui/consent-document-preview-typography.module.css'
import { FormDocumentPreviewBody } from '../../cms/src/features/template/ui/document-preview/form-document-preview-body'
import { getAgreementPortraitA4ParagraphGap } from '../../cms/src/features/template/model/agreement-portrait-a4-preview'
import writeStyles from '../src/features/mypage/instructor-apply/consent/consent-form.module.css'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const css = read(
  '../src/features/mypage/settings/ui/consent-document-preview-typography.module.css'
)
function moduleCss(source: string, names: Record<string, string>) {
  let result = source
  while (result.includes(':global(')) {
    const start = result.indexOf(':global(')
    let end = start + 8
    let depth = 1
    for (; end < result.length && depth; end++) {
      if (result[end] === '(') depth++
      if (result[end] === ')') depth--
    }
    result = result.slice(0, start) + result.slice(start + 8, end - 1) + result.slice(end)
  }
  return result.replace(/\.([a-zA-Z][\w-]*)/g, (all, name: string) =>
    names[name] ? `.${names[name]}` : all
  )
}
// Source-level cascade check against the real SSR DOM. This is not browser layout measurement.
function rules(source: string) {
  const style = document.createElement('style')
  style.textContent = source
  document.head.append(style)
  const result = Array.from(style.sheet!.cssRules).filter(
    rule => 'selectorText' in rule
  ) as CSSStyleRule[]
  style.remove()
  return result
}
const runtime = read(
  '../../../packages/form-template-runtime/dist/renderer/vertical-table-preview.css'
)
const host = read('../../../packages/form-template-runtime/dist/host/form-template-host.css')
const allRules = () =>
  rules(
    host +
      runtime +
      moduleCss(
        read('../src/features/mypage/instructor-apply/consent/consent-form.module.css'),
        writeStyles
      ) +
      moduleCss(css, typography)
  )
function selectors(text: string) {
  let depth = 0
  let start = 0
  const result: string[] = []
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++
    if (text[i] === ')') depth--
    if (text[i] === ',' && depth === 0) {
      result.push(text.slice(start, i))
      start = i + 1
    }
  }
  result.push(text.slice(start))
  return result
}
function value(el: Element, property: string, ruleList = allRules()): string {
  let best = -1
  let result = ''
  for (const rule of ruleList)
    for (const selector of selectors(rule.selectorText)) {
      if (selector.includes('::') || !el.matches(selector)) continue
      const candidate = rule.style.getPropertyValue(property)
      if (!candidate) continue
      const specificity =
        (selector.match(/\.[\w-]+|\[[^\]]+\]|:[\w-]+/g) ?? []).length * 100 +
        (selector.match(/(?:^|[ >+~])(?:span|div|input|p)(?=$|[ .:#\[])/g) ?? []).length
      const rank =
        specificity + (rule.style.getPropertyPriority(property) === 'important' ? 1_000_000 : 0)
      if (rank >= best) {
        best = rank
        result = candidate.trim()
      }
    }
  if (result) return result
  return el.parentElement ? value(el.parentElement, property, ruleList) : ''
}
function render(preview = true, legacySnapshot = false, withSignatureImage = true) {
  const draft = createAgreementPortraitDraft()
  if (legacySnapshot) {
    const personal = draft.paragraphs.find(
      p => p.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable
    )!
    if (personal.kind === 'single_item' && personal.variant === 'vertical_table') {
      personal.rows[3].headers[0] = '보유 기간'
      personal.rows[3].cells[0] = '10년'
    }
  }
  const original = JSON.stringify(draft)
  const root = document.createElement('div')
  root.innerHTML = renderToStaticMarkup(
    <PlatformConsentFormBody
      draft={draft}
      hiddenParagraphIds={new Set([AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title])}
      onUpdateParagraph={() => {
        throw new Error('read-only preview changed the draft')
      }}
      documentPreview={preview}
      documentPreviewTemplateId="agreement-portrait"
      submittedDateLabel="2026년 11월 08일"
      signerName="테스트"
      signatureImageSrc={withSignatureImage ? 'data:image/png;base64,AA==' : undefined}
    />
  )
  expect(JSON.stringify(draft)).toBe(original)
  return root
}

function renderCms() {
  const draft = createAgreementPortraitDraft()
  const paragraphs = draft.paragraphs.filter(p => p.id !== AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title)
  const original = JSON.stringify(draft)
  const root = document.createElement('div')
  root.innerHTML = renderToStaticMarkup(
    <FormDocumentPreviewBody
      paragraphs={paragraphs}
      allParagraphs={paragraphs}
      titleNumbering={draft.formSettings.titleNumbering}
      editorKind="agreement"
      renderMode="contentOnly"
      paragraphGapPx={getAgreementPortraitA4ParagraphGap}
      paragraphBodyOptions={{
        documentPreviewClassName: 'form-document-preview-body--agreement-portrait',
        agreementSystemDisplayMode: 'document',
        paragraphInteractionMode: 'preview',
      }}
      agreementClosingFooter={{ showRecipient: false, showSubmitButton: false }}
    />
  )
  expect(JSON.stringify(draft)).toBe(original)
  return root
}
function cmsRules() {
  const files = [
    '../../cms/src/index.css',
    '../../cms/src/shared/ui/app-radio.css',
    '../../cms/src/features/template/ui/paragraph/table/vertical-table-paragraph-body.css',
    '../../cms/src/features/template/ui/paragraph/table/agreement-portrait-personal-consent-name-row.css',
    '../../cms/src/features/template/ui/paragraph/explanation/explanation-system.css',
    '../../cms/src/features/template/ui/document-preview/form-document-preview-body.css',
  ]
  return rules(
    files
      .map(read)
      .join('\n')
      .replace(/@import[^;]+;/g, '')
  )
}

describe('초상권 A4 document-only rendering', () => {
  it('renders the same seed through the actual CMS PDF body consumer without changing the schema', () => {
    const root = renderCms()
    expect(root.querySelectorAll('.form-editor-vertical-table')).toHaveLength(3)
    expect(root.textContent).toContain('동의일로부터 1년')
  })
  it('compares CMS PDF DOM consumers against Platform DOM consumers for all three tables', () => {
    const cms = renderCms()
    const platform = render()
    const referenceRules = cmsRules()
    const referenceTables = cms.querySelectorAll('.form-editor-vertical-table')
    const platformTables = platform.querySelectorAll('.form-template-vertical-table')
    for (let i = 0; i < 3; i++) {
      for (const [cmsSelector, platformSelector] of [
        ['.form-editor-vertical-table__th', '.form-template-vertical-table__th'],
        ['.form-editor-vertical-table__td', '.form-template-vertical-table__td'],
      ]) {
        const expectedCells = referenceTables[i].querySelectorAll(cmsSelector)
        const actualCells = platformTables[i].querySelectorAll(platformSelector)
        expect(actualCells).toHaveLength(expectedCells.length)
        for (let j = 0; j < expectedCells.length; j++) {
          const reference = expectedCells[j].querySelector('span') ?? expectedCells[j]
          const actual = actualCells[j].querySelector('span') ?? actualCells[j]
          for (const property of ['font-size', 'font-weight', 'line-height']) {
            expect(value(actual, property), `${i + 1} table, ${j} cell, ${property}`).toBe(
              value(reference, property, referenceRules)
            )
          }
        }
      }
    }
    const referenceRadios = cms.querySelectorAll(
      '.form-editor-table-bottom-consent .ant-radio-wrapper'
    )
    const actualRadios = platform.querySelectorAll(
      '.form-template-table-bottom-consent .ant-radio-wrapper'
    )
    expect(actualRadios).toHaveLength(referenceRadios.length)
    for (let i = 0; i < referenceRadios.length; i++)
      for (const property of ['font-size', 'font-weight', 'line-height']) {
        expect(value(actualRadios[i], property)).toBe(
          value(referenceRadios[i], property, referenceRules)
        )
      }
    const cmsBottoms = cms.querySelectorAll('.form-editor-vertical-table__bottom-static')
    const platformBottoms = platform.querySelectorAll(
      '.form-template-vertical-table__bottom-static'
    )
    expect(platformBottoms).toHaveLength(cmsBottoms.length)
    for (let i = 0; i < cmsBottoms.length; i++)
      for (const property of ['font-size', 'font-weight', 'line-height']) {
        expect(value(platformBottoms[i], property)).toBe(
          value(cmsBottoms[i], property, referenceRules)
        )
      }
  })
  it('compares CMS intro, section titles, closing, date and signature typography', () => {
    const cms = renderCms()
    const platform = render(true, false, false)
    const referenceRules = cmsRules()
    const pairs = [
      ['.form-document-preview-paragraph__title-text', typography.sectionTitle],
      [
        '.form-document-preview-paragraph__body-text--explanation-filled',
        typography.explanationText,
      ],
      [
        '.form-document-preview-paragraph--content-only-closing .form-document-preview-paragraph__body-text',
        typography.previewConfirm,
      ],
      ['.explanation-system--document-date .explanation-system-pill', typography.previewDate],
      ['.explanation-system-signature-document__label', typography.previewSignatureLabel],
      ['.explanation-system-signature-document__mark', typography.previewSignatureMark],
    ]
    for (const [cmsSelector, platformClass] of pairs) {
      const reference = cms.querySelector(cmsSelector)
      const actual = platform.querySelector(`.${platformClass}`)
      expect(reference, cmsSelector).not.toBeNull()
      expect(actual, platformClass).not.toBeNull()
      for (const property of ['font-size', 'font-weight', 'line-height']) {
        expect(value(actual!, property), `${cmsSelector}: ${property}`).toBe(
          value(reference!, property, referenceRules)
        )
      }
    }
  })
  it('renders all three schema tables once, with readonly document surfaces, not mobile write cards', () => {
    const root = render()
    expect(root.querySelectorAll('[role="grid"]')).toHaveLength(3)
    expect(root.querySelectorAll('.form-template-host[data-surface="cmsAdmin"]')).toHaveLength(3)
    expect(root.querySelectorAll('.form-template-host[data-surface="platformUser"]')).toHaveLength(
      0
    )
    expect(root.querySelectorAll('input:not([type="radio"]), textarea')).toHaveLength(0)
    expect(root.querySelectorAll('.form-template-table-bottom-consent')).toHaveLength(3)
    expect(root.querySelector('[data-portrait-retention]')).toBeNull()
    expect(root.textContent).toContain('동의일로부터 1년')
    expect(render(true, true).querySelector('[data-portrait-retention]')?.textContent).toBe('10년')
  })
  it('matches CMS table header/body/retention typography including the delegated and usage tables', () => {
    const root = render(true, true)
    for (const grid of root.querySelectorAll('[role="grid"]')) {
      for (const header of grid.querySelectorAll('[role="columnheader"]')) {
        const text = header.firstElementChild ?? header
        expect(value(text, 'font-size')).toBe('16px')
        expect(value(text, 'font-weight')).toBe('700')
        expect(value(text, 'line-height')).toBe('150%')
      }
      for (const cell of grid.querySelectorAll('[role="gridcell"]')) {
        const text = cell.firstElementChild ?? cell
        const retention = cell.hasAttribute('data-portrait-retention')
        expect(value(text, 'font-size')).toBe(retention ? '20px' : '16px')
        expect(value(text, 'font-weight')).toBe(retention ? '700' : '500')
        expect(value(text, 'line-height')).toBe('150%')
        expect(value(cell, 'padding-top')).toBe('8px')
      }
    }
  })
  it('matches actual bottom-static and radio consumers, rather than nonexistent bottom-text/PF selectors', () => {
    const root = render()
    for (const bottom of root.querySelectorAll('.form-template-vertical-table__bottom-static')) {
      expect(value(bottom, 'font-size')).toBe('14px')
      expect(value(bottom, 'font-weight')).toBe('500')
      expect(value(bottom, 'line-height')).toBe('150%')
    }
    for (const label of root.querySelectorAll('.ant-radio-wrapper')) {
      expect(value(label, 'font-size')).toBe('14px')
      expect(value(label, 'line-height')).toBe('125%')
    }
    for (const bottom of root.querySelectorAll('.form-template-vertical-table__bottom'))
      expect(value(bottom, 'gap')).toBe('8px')
  })
  it('keeps CMS section, confirmation/date/signature spacing and image limits', () => {
    const root = render()
    const confirm = root.querySelector('[data-consent-preview-rule="confirm"]')!
    expect(value(confirm, 'margin-bottom')).toBe('12px')
    expect(value(confirm.nextElementSibling!, 'margin-top')).toMatch(/^0(px)?$/)
    expect(value(root.querySelector(`.${typography.previewDate}`)!, 'margin-bottom')).toBe('6px')
    const image = root.querySelector('img[alt="전자서명"]')!
    expect(value(image, 'height')).toBe('auto')
    expect(value(image, 'max-height')).toBe('48px')
    expect(value(image, 'max-width')).toBe('160px')
    expect(value(root.querySelector(`.${typography.sectionTitle}`)!, 'font-size')).toBe('20px')
    expect(value(root.querySelector(`.${typography.explanationText}`)!, 'font-size')).toBe('20px')
  })
  it('leaves the interactive write screen on platformUser surfaces and its original controls', () => {
    const root = render(false)
    expect(root.querySelectorAll('.form-template-host[data-surface="platformUser"]')).toHaveLength(
      3
    )
    expect(root.querySelector('input:not([type="radio"])')).not.toBeNull()
    expect(root.querySelector('.form-template-host[data-surface="cmsAdmin"]')).toBeNull()
  })
  it('uses identical local Pretendard bytes and current runtime CSS, without rebuilding shared dist', () => {
    const bytes = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)))
    expect(bytes('../public/fonts/PretendardVariable.woff2')).toEqual(
      bytes('../../cms/public/fonts/PretendardVariable.woff2')
    )
    expect(runtime).toBe(
      read('../../../packages/form-template-runtime/src/renderer/vertical-table-preview.css')
    )
  })
})
