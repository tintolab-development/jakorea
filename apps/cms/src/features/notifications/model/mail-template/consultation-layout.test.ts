import { describe, expect, it } from 'vitest'
import { resolveMailTemplateBodyHtml } from './resolve-body'
import {
  buildConsultationMailLayoutHtml,
  CONSULTATION_MAIL_DATA_VARIABLE_LABELS,
  CONSULTATION_MAIL_DETAIL_LINK_VARIABLE_LABEL,
  CONSULTATION_MAIL_LAYOUT_VERSION,
  CONSULTATION_MAIL_TEMPLATE_ID,
  ensureConsultationMailTemplateLayoutMarker,
  resolveConsultationMailTemplateBodyHtml,
} from './consultation-layout'

describe('consultation mail layout', () => {
  it('publishes the design sections as email-safe tables', () => {
    const html = buildConsultationMailLayoutHtml()

    expect(html).toContain(`ja-mail-layout:${CONSULTATION_MAIL_LAYOUT_VERSION}`)
    expect(html.match(/<table\b/gi)).toHaveLength(4)
    expect(html).toContain('신청 정보')
    expect(html).toContain('상담 정보')
    expect(html).toContain('신규 접수된 기업 후원 상담 신청 건이 있습니다.')
    expect(html).toContain('후원 상담 신청 상세보기')
    expect(html).toContain('width:140px')
    expect(html).toContain('colwidth="140"')
    expect(html).toContain('border-radius:8px')
    expect(html).toContain('vertical-align:top')
    expect(html).toMatch(
      /신청 정보<\/h3>\s*<table[^>]*>.*?신청일시.*?처리 상태.*?개인정보 수집·이용 동의.*?<\/table>\s*<table[^>]*>.*?기업명.*?담당자명.*?부서\/직함명.*?담당자 연락처.*?<\/table>\s*<h3[^>]*>상담 정보<\/h3>\s*<table[^>]*>.*?상담 내용.*?링크 삽입.*?첨부파일.*?<\/table>/s
    )
    expect(html).toMatch(
      /<th colwidth="140"[^>]*>신청일시<\/th>\s*<td[^>]*>[\s\S]*?<\/td>\s*<td colwidth="140"[^>]*>&nbsp;<\/td>\s*<td[^>]*>&nbsp;<\/td>/
    )
    for (const label of CONSULTATION_MAIL_DATA_VARIABLE_LABELS) {
      expect(html).toContain(`data-mail-variable="${label}">#{${label}}</span>`)
    }
  })

  it('keeps the backend-resolved application detail destination as a token', () => {
    const html = buildConsultationMailLayoutHtml()

    expect(html).toContain(`href="#{${CONSULTATION_MAIL_DETAIL_LINK_VARIABLE_LABEL}}"`)
    expect(html).not.toContain('localhost')
    expect(html).not.toContain('예시값')
  })

  it('uses the consultation design only for template 233', () => {
    const original = '<p>기존 본문</p>'

    expect(resolveConsultationMailTemplateBodyHtml(CONSULTATION_MAIL_TEMPLATE_ID, original)).toContain(
      `ja-mail-layout:${CONSULTATION_MAIL_LAYOUT_VERSION}`
    )
    expect(resolveMailTemplateBodyHtml(CONSULTATION_MAIL_TEMPLATE_ID, original)).toContain(
      `ja-mail-layout:${CONSULTATION_MAIL_LAYOUT_VERSION}`
    )
    expect(resolveMailTemplateBodyHtml('237', original)).not.toContain(
      `ja-mail-layout:${CONSULTATION_MAIL_LAYOUT_VERSION}`
    )
    expect(resolveConsultationMailTemplateBodyHtml('other-template', original)).toBe(original)
  })

  it('preserves an already applied consultation design', () => {
    const existing = buildConsultationMailLayoutHtml().replace(
      '후원 상담 신청 상세보기',
      '후원 상담 신청 상세보기 수정'
    )

    expect(resolveConsultationMailTemplateBodyHtml(CONSULTATION_MAIL_TEMPLATE_ID, existing)).toBe(
      existing
    )
  })

  it('preserves the layout marker after an edited body is serialized', () => {
    const edited = '<p>수정된 본문</p>'

    expect(ensureConsultationMailTemplateLayoutMarker(CONSULTATION_MAIL_TEMPLATE_ID, edited)).toBe(
      `<!-- ja-mail-layout:${CONSULTATION_MAIL_LAYOUT_VERSION} -->\n${edited}`
    )
    expect(ensureConsultationMailTemplateLayoutMarker('other-template', edited)).toBe(edited)
  })
})
