import { afterEach, describe, expect, it } from 'vitest'
import {
  beginRecruitDetailContentReset,
  consumeWizardContentResetPending,
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay,
  flushRecruitDetailRichTextIntoGeneralRecruitOverlay,
  registerRecruitDetailAdditionalContentHtml,
  registerRecruitDetailRichTextHtml,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  resetGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

describe('recruit-detail-info-additional-content-flush', () => {
  afterEach(() => {
    registerRecruitDetailAdditionalContentHtml('recruit.detailInfo.additionalContentHtml', null)
    registerRecruitDetailRichTextHtml('recruit.detailInfo.recruitmentGuide', null)
    registerRecruitDetailAdditionalContentHtml(
      'recruitVolunteer.detailInfo.additionalContentHtml',
      null
    )
    resetGeneralRecruitOverlay()
    consumeWizardContentResetPending()
  })

  it('does not flush previous editor HTML during a template-change reset', () => {
    registerRecruitDetailRichTextHtml(
      'recruit.detailInfo.recruitmentGuide',
      () => '<p>이전 모집 안내</p>'
    )
    beginRecruitDetailContentReset()
    flushRecruitDetailRichTextIntoGeneralRecruitOverlay()
    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.recruitmentGuide']).toBeUndefined()
  })

  it('flushes registered editor HTML into general recruit overlay', () => {
    registerRecruitDetailAdditionalContentHtml(
      'recruit.detailInfo.additionalContentHtml',
      () => '<p>기관 추가</p>'
    )
    registerRecruitDetailAdditionalContentHtml(
      'recruitVolunteer.detailInfo.additionalContentHtml',
      () => '<p>봉사자 추가</p>'
    )

    flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()

    const overlay = getGeneralRecruitOverlayRecord()
    expect(overlay['recruit.detailInfo.additionalContentHtml']).toBe('<p>기관 추가</p>')
    expect(overlay['recruitVolunteer.detailInfo.additionalContentHtml']).toBe('<p>봉사자 추가</p>')
  })

  it('flushes non-additional rich text fields into general recruit overlay', () => {
    registerRecruitDetailRichTextHtml(
      'recruit.detailInfo.recruitmentGuide',
      () => '<p>모집 안내</p>'
    )

    flushRecruitDetailRichTextIntoGeneralRecruitOverlay()

    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.recruitmentGuide']).toBe(
      '<p>모집 안내</p>'
    )
  })

  it('skips getters that return null so unedited empty editors do not wipe saved overlay HTML', () => {
    patchGeneralRecruitOverlay({
      'recruit.detailInfo.recruitmentGuide': '<p><strong>모집 안내11</strong></p>',
    })
    registerRecruitDetailRichTextHtml('recruit.detailInfo.recruitmentGuide', () => null)

    flushRecruitDetailRichTextIntoGeneralRecruitOverlay()

    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.recruitmentGuide']).toBe(
      '<p><strong>모집 안내11</strong></p>'
    )
  })
})
