import { afterEach, describe, expect, it } from 'vitest'
import {
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay,
  registerRecruitDetailAdditionalContentHtml,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  getGeneralRecruitOverlayRecord,
  resetGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

describe('recruit-detail-info-additional-content-flush', () => {
  afterEach(() => {
    registerRecruitDetailAdditionalContentHtml('recruit.detailInfo.additionalContentHtml', null)
    registerRecruitDetailAdditionalContentHtml(
      'recruitVolunteer.detailInfo.additionalContentHtml',
      null
    )
    resetGeneralRecruitOverlay()
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
})
