/**
 * 수동 회귀 (CMS 일반 신규 등록 기본). 깨지면 활성 getRecord 잔여.
 * - 신규 leftover: registrationDraft=fresh 위저드. 모집 첫 탭이 이전 프로그램 값으로 안 채워짐.
 * - 신규 복사본: 모집에서 복사본 선택. 단락 + 상세(프로그램 설명·모집 안내 WYSIWYG)가 그 양식 내용.
 * - 탭 전환: 모집 상세를 조금 수정 → 공통정보/신청 갔다가 복귀. 방금 수정한 상세가 유지.
 * - 임시저장: 공통정보에서 채워 임시저장 후 재진입. 모집 문의처·상세가 남아 있음.
 * - 신규 등록 양식 매핑: 복사본 선택 후 등록 완료. 요청/상세의 모집 양식 코드가 복사본, recruit.*·상세 HTML이 비지 않음.
 * - 상세 조회: 등록 완료 프로그램 상세. 방금 등록한 모집·상세가 보임.
 * - 수정: 상세에서 모집 수정 저장. 위저드 leftover와 섞이지 않음.
 * - 자동입력(DEV): 공통정보에서 자동입력 후 모집 탭. 모집 필드가 채워짐.
 * 1사1교·교육받은 교사·UJAT는 복사본 선택 + 상세 WYSIWYG만 스모크. Gemini는 이번 변경 밖.
 */
import { afterEach, describe, expect, it } from 'vitest'
import {
  beginRecruitDetailContentReset,
  consumeWizardContentResetPending,
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay,
  flushRecruitDetailRichTextIntoGeneralRecruitOverlay,
  isRecruitDetailContentPersistSuppressed,
  peekWizardContentResetPending,
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
    registerRecruitDetailRichTextHtml('recruit.detailInfo.programDescription', null)
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

  it('peeks template-change pending without lifting flush suppression', () => {
    registerRecruitDetailRichTextHtml(
      'recruit.detailInfo.programDescription',
      () => '<p>변경 전 프로그램 설명</p>'
    )
    beginRecruitDetailContentReset()
    expect(peekWizardContentResetPending()).toBe(true)
    expect(isRecruitDetailContentPersistSuppressed()).toBe(true)
    flushRecruitDetailRichTextIntoGeneralRecruitOverlay()
    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.programDescription']).toBeUndefined()
    expect(peekWizardContentResetPending()).toBe(true)
    expect(consumeWizardContentResetPending()).toBe(true)
    expect(peekWizardContentResetPending()).toBe(false)
    expect(isRecruitDetailContentPersistSuppressed()).toBe(false)
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
