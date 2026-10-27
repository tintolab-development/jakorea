import { describe, expect, it } from 'vitest'
import {
  buildTalentDonationMailLayoutHtml,
  ensureMailTemplateLayoutMarker,
  resolveMailTemplateBodyHtml,
  TALENT_DONATION_MAIL_DATA_VARIABLE_LABELS,
  TALENT_DONATION_MAIL_DETAIL_LINK_VARIABLE_LABEL,
  TALENT_DONATION_MAIL_LAYOUT_VERSION,
  TALENT_DONATION_MAIL_TEMPLATE_ID,
} from './talent-donation-layout'

describe('talent donation mail layout', () => {
  it('publishes the design sections as email-safe tables', () => {
    const html = buildTalentDonationMailLayoutHtml()

    expect(html).toContain(`ja-mail-layout:${TALENT_DONATION_MAIL_LAYOUT_VERSION}`)
    expect(html.match(/<table\b/gi)).toHaveLength(4)
    expect(html).toContain('<h3')
    expect(html).toContain('기본 정보')
    expect(html).toContain('추가 정보')
    expect(html).toContain('신규 접수된 재능기부 신청 건이 있습니다.')
    expect(html).toContain('JA Korea 드림.')
    expect(html).toContain('border-collapse:separate')
    expect(html).toContain('table-layout:fixed')
    expect(html).toContain('border:1px solid #e0e0e0')
    expect(html).toContain('border-radius:8px')
    expect(html).toContain('width:140px')
    expect(html).toContain('colwidth="140"')
    expect(html).toContain('white-space:nowrap')
    expect(html).toContain('padding:9px 10px')
    expect(html).toContain('padding:9px 12px')
    expect(html).toContain('vertical-align:top')
    expect(html).not.toContain('첨부파일')
    expect(html).toContain('font-size:12px')
    expect(html).toContain('background:linear-gradient(0deg,rgba(231,235,239,0.6) 0%,rgba(231,235,239,0.6) 100%),#fff')
    expect(html).toContain('height="52"')
    expect(html).toContain('height:52px')
    expect(html).toContain('background:#01a1af')
    expect(html).toContain('padding:8px 20px')
    expect(html).toContain('line-height:36px')
    expect(html).not.toContain('<colgroup')
    expect(html).toMatch(
      /기본 정보<\/h3>\s*<table[^>]*>.*?신청일시.*?처리 상태.*?개인정보 수집·이용 동의.*?<\/table>\s*<table[^>]*>.*?신청자명.*?재능기부 가능 기간.*?<\/table>\s*<h3[^>]*>추가 정보<\/h3>\s*<table[^>]*>.*?참여 동기.*?<\/table>/s
    )
    expect(html).toMatch(
      /<th colwidth="140"[^>]*>신청일시<\/th>\s*<td[^>]*>[\s\S]*?<\/td>\s*<td colwidth="140"[^>]*>&nbsp;<\/td>\s*<td[^>]*>&nbsp;<\/td>/
    )
    for (const label of TALENT_DONATION_MAIL_DATA_VARIABLE_LABELS) {
      expect(html).toContain(`data-mail-variable="${label}">#{${label}}</span>`)
    }
  })

  it('keeps the backend-resolved application detail destination as a token', () => {
    const html = buildTalentDonationMailLayoutHtml()

    expect(html).toContain(`href="#{${TALENT_DONATION_MAIL_DETAIL_LINK_VARIABLE_LABEL}}"`)
    expect(html).toContain('재능기부 신청 상세보기')
    expect(html).not.toContain('localhost')
    expect(html).not.toContain('예시값')
  })

  it('uses the main design only for the talent donation template', () => {
    const original = '<p>기존 본문</p>'

    expect(resolveMailTemplateBodyHtml(TALENT_DONATION_MAIL_TEMPLATE_ID, original)).toContain(
      `ja-mail-layout:${TALENT_DONATION_MAIL_LAYOUT_VERSION}`
    )
    expect(resolveMailTemplateBodyHtml('other-template', original)).toBe(original)
  })

  it('preserves an already applied main design', () => {
    const existing = buildTalentDonationMailLayoutHtml().replace(
      '재능기부 신청 상세보기',
      '재능기부 신청 상세보기 수정'
    )

    expect(resolveMailTemplateBodyHtml(TALENT_DONATION_MAIL_TEMPLATE_ID, existing)).toBe(existing)
  })

  it('replaces an older generated layout with the current main design', () => {
    const previous = buildTalentDonationMailLayoutHtml().replace(
      `ja-mail-layout:${TALENT_DONATION_MAIL_LAYOUT_VERSION}`,
      'ja-mail-layout:talent-donation-v1'
    )

    expect(resolveMailTemplateBodyHtml(TALENT_DONATION_MAIL_TEMPLATE_ID, previous)).toContain(
      `ja-mail-layout:${TALENT_DONATION_MAIL_LAYOUT_VERSION}`
    )
  })

  it('preserves the layout marker after an edited body is serialized', () => {
    const edited = '<p>수정된 본문</p>'

    expect(ensureMailTemplateLayoutMarker(TALENT_DONATION_MAIL_TEMPLATE_ID, edited)).toBe(
      `<!-- ja-mail-layout:${TALENT_DONATION_MAIL_LAYOUT_VERSION} -->\n${edited}`
    )
    expect(
      ensureMailTemplateLayoutMarker(
        TALENT_DONATION_MAIL_TEMPLATE_ID,
        buildTalentDonationMailLayoutHtml()
      )
    ).toBe(buildTalentDonationMailLayoutHtml())
    expect(ensureMailTemplateLayoutMarker('other-template', edited)).toBe(edited)
  })
})
