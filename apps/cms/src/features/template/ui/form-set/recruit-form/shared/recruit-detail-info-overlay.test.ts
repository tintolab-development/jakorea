import { describe, expect, it, beforeEach } from 'vitest'
import {
  patchApplicantRecruitInstitutionOverlay,
  resetApplicantRecruitInstitutionOverlay,
  getApplicantRecruitInstitutionOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  resetGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { collectOperationalOverlayForCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  mergeRecruitDetailInfoFromGeneralStore,
  pickOverlayKeysByPrefix,
  restoreRecruitDetailInfoIntoGeneralStore,
} from './recruit-detail-info-overlay'

describe('recruit detail info overlay persist', () => {
  beforeEach(() => {
    resetApplicantRecruitInstitutionOverlay()
    resetGeneralRecruitOverlay()
  })

  it('picks only the detailInfo prefix', () => {
    expect(
      pickOverlayKeysByPrefix(
        {
          'recruit.inquiryContact': '문의',
          'recruit.detailInfo.programDescription': '설명',
          'recruit.detailInfo.additionalContentHtml': '<p>본문</p>',
          'recruitInstructor.detailInfo.programDescription': '강사',
        },
        'recruit.detailInfo'
      )
    ).toEqual({
      'recruit.detailInfo.programDescription': '설명',
      'recruit.detailInfo.additionalContentHtml': '<p>본문</p>',
    })
  })

  it('기관 모집 overlay에 상세 정보 키를 합친다', () => {
    patchGeneralRecruitOverlay({
      'recruit.detailInfo.programDescription': '프로그램 설명',
      'recruit.detailInfo.additionalContentHtml': '<p>추가 내용</p>',
    })
    patchApplicantRecruitInstitutionOverlay({ 'recruit.inquiryContact': '담당자' })

    expect(collectOperationalOverlayForCatalogId('recruitment-participant-school')).toMatchObject({
      'recruit.inquiryContact': '담당자',
      'recruit.detailInfo.programDescription': '프로그램 설명',
      'recruit.detailInfo.additionalContentHtml': '<p>추가 내용</p>',
    })
  })

  it('저장된 상세 정보 키를 general-recruit 스토어로 되돌린다', () => {
    restoreRecruitDetailInfoIntoGeneralStore(
      {
        'recruit.inquiryContact': '담당자',
        'recruit.detailInfo.learningSupportContent': '학습지원',
      },
      'recruit.detailInfo'
    )
    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.learningSupportContent']).toBe(
      '학습지원'
    )
    expect(getApplicantRecruitInstitutionOverlayRecord()['recruit.inquiryContact']).toBeUndefined()
  })

  it('merge는 전용 overlay 값을 우선한다', () => {
    patchGeneralRecruitOverlay({ 'recruit.detailInfo.programDescription': '스토어' })
    expect(
      mergeRecruitDetailInfoFromGeneralStore(
        { 'recruit.detailInfo.programDescription': '저장본' },
        'recruit.detailInfo'
      )['recruit.detailInfo.programDescription']
    ).toBe('저장본')
  })
})
