import { describe, expect, it } from 'vitest'
import { resolveMailTemplateBodyHtml } from './resolve-body'
import {
  buildCareersMailLayoutHtml,
  CAREERS_MAIL_DATA_VARIABLE_LABELS,
  CAREERS_MAIL_DETAIL_LINK_VARIABLE_LABEL,
  CAREERS_MAIL_LAYOUT_VERSION,
  CAREERS_MAIL_TEMPLATE_ID,
  ensureCareersMailTemplateLayoutMarker,
  resolveCareersMailTemplateBodyHtml,
} from './careers-layout'

describe('careers mail layout', () => {
  it('publishes the design sections as email-safe tables', () => {
    const html = buildCareersMailLayoutHtml()

    expect(html).toContain(`ja-mail-layout:${CAREERS_MAIL_LAYOUT_VERSION}`)
    expect(html.match(/<table\b/gi)).toHaveLength(5)
    expect(html).toContain('기본 정보')
    expect(html).toContain('학력 정보')
    expect(html).toContain('경력 정보')
    expect(html).toContain('신규 접수된 인재채용 건이 있습니다.')
    expect(html).toContain('지원 내용을 확인해 주세요.')
    expect(html).toContain('인재채용 지원 상세보기')
    expect(html).toContain('width:140px')
    expect(html).toContain('colwidth="140"')
    expect(html).toContain('border-radius:8px')
    expect(html).toContain('vertical-align:top')
    expect(html).toMatch(
      /기본 정보<\/h3>\s*<table[^>]*>.*?신청일시.*?처리 상태.*?개인정보 수집·이용 동의.*?<\/table>\s*<table[^>]*>.*?지원자명.*?관심 직무.*?자택 주소.*?<\/table>\s*<h3[^>]*>학력 정보<\/h3>\s*<table[^>]*>.*?최종학력.*?학력정보.*?<\/table>\s*<h3[^>]*>경력 정보<\/h3>\s*<table[^>]*>.*?경력\/경험\/자격정보.*?<\/table>/s
    )
    expect(html).toMatch(
      /<th colwidth="140"[^>]*>신청일시<\/th>\s*<td[^>]*>[\s\S]*?<\/td>\s*<td colwidth="140"[^>]*>&nbsp;<\/td>\s*<td[^>]*>&nbsp;<\/td>/
    )
    for (const label of CAREERS_MAIL_DATA_VARIABLE_LABELS) {
      expect(html).toContain(`data-mail-variable="${label}">#{${label}}</span>`)
    }
  })

  it('keeps the backend-resolved application detail destination as a token', () => {
    const html = buildCareersMailLayoutHtml()

    expect(html).toContain(`href="#{${CAREERS_MAIL_DETAIL_LINK_VARIABLE_LABEL}}"`)
    expect(html).not.toContain('localhost')
    expect(html).not.toContain('예시값')
  })

  it('uses the careers design only for template 236', () => {
    const original = '<p>기존 본문</p>'

    expect(resolveCareersMailTemplateBodyHtml(CAREERS_MAIL_TEMPLATE_ID, original)).toContain(
      `ja-mail-layout:${CAREERS_MAIL_LAYOUT_VERSION}`
    )
    expect(resolveMailTemplateBodyHtml(CAREERS_MAIL_TEMPLATE_ID, original)).toContain(
      `ja-mail-layout:${CAREERS_MAIL_LAYOUT_VERSION}`
    )
    expect(resolveMailTemplateBodyHtml('237', original)).not.toContain(
      `ja-mail-layout:${CAREERS_MAIL_LAYOUT_VERSION}`
    )
    expect(resolveCareersMailTemplateBodyHtml('other-template', original)).toBe(original)
  })

  it('preserves an already applied careers design', () => {
    const existing = buildCareersMailLayoutHtml().replace(
      '인재채용 지원 상세보기',
      '인재채용 지원 상세보기 수정'
    )

    expect(resolveCareersMailTemplateBodyHtml(CAREERS_MAIL_TEMPLATE_ID, existing)).toBe(existing)
  })

  it('preserves the layout marker after an edited body is serialized', () => {
    const edited = '<p>수정된 본문</p>'

    expect(ensureCareersMailTemplateLayoutMarker(CAREERS_MAIL_TEMPLATE_ID, edited)).toBe(
      `<!-- ja-mail-layout:${CAREERS_MAIL_LAYOUT_VERSION} -->\n${edited}`
    )
    expect(ensureCareersMailTemplateLayoutMarker('other-template', edited)).toBe(edited)
  })
})
