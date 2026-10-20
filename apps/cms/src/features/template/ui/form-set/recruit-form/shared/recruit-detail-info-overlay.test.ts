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
import { setOperationalOverlayScope } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  mergeRecruitDetailInfoFromGeneralStore,
  overlayEntriesAbsentFromLive,
  pickOverlayKeysByPrefix,
  recruitDetailInfoOverlayPrefixForCatalogId,
  replaceRecruitDetailInfoIntoGeneralStore,
  replaceUjatVolunteerRecruitGeneralStoreSidecar,
  restoreRecruitDetailInfoIntoGeneralStore,
  restoreUjatVolunteerRecruitGeneralStoreSidecar,
} from './recruit-detail-info-overlay'

describe('recruit detail info overlay persist', () => {
  beforeEach(() => {
    resetApplicantRecruitInstitutionOverlay()
    resetGeneralRecruitOverlay()
    setOperationalOverlayScope('recruitment-participant-school')
  })

  it('resolves detail prefix for copied catalog codes', () => {
    expect(recruitDetailInfoOverlayPrefixForCatalogId('recruitment-participant-school-custom-2')).toBe(
      'recruit.detailInfo'
    )
    expect(recruitDetailInfoOverlayPrefixForCatalogId('recruitment-economy-copy-1')).toBe(
      'economyRecruit.detailInfo'
    )
    expect(
      recruitDetailInfoOverlayPrefixForCatalogId('recruitment-gemini-visiting-training-custom-2')
    ).toBe('geminiRecruit.detailInfo')
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

  it('merge는 편집 중인 general-recruit 값을 우선한다', () => {
    patchGeneralRecruitOverlay({
      'recruit.detailInfo.programDescription': '스토어',
      'recruit.detailInfo.attachmentFileNames': ['방금첨부.pdf'],
    })
    expect(
      mergeRecruitDetailInfoFromGeneralStore(
        {
          'recruit.detailInfo.programDescription': '저장본',
          'recruit.detailInfo.attachmentFileNames': ['이전.pdf'],
          'recruit.inquiryContact': '담당자',
        },
        'recruit.detailInfo'
      )
    ).toMatchObject({
      'recruit.inquiryContact': '담당자',
      'recruit.detailInfo.programDescription': '스토어',
      'recruit.detailInfo.attachmentFileNames': ['방금첨부.pdf'],
    })
  })

  it('merge는 general-recruit에 없는 상세 키는 전용 overlay 값을 유지한다', () => {
    expect(
      mergeRecruitDetailInfoFromGeneralStore(
        { 'recruit.detailInfo.programDescription': '저장본' },
        'recruit.detailInfo'
      )['recruit.detailInfo.programDescription']
    ).toBe('저장본')
  })

  it('다른 단계 스냅샷은 이미 있는 첨부 키를 덮지 않는다', () => {
    const live = {
      'recruit.detailInfo.attachmentFileNames': ['기관모집.pdf'],
      'economyRecruit.detailInfo.attachmentFileNames': ['1사1교.pdf'],
      'recruitInstructor.detailInfo.thumbFileName': '강사썸네일.png',
      'recruitVolunteer.h1.detailInfo.attachmentFileNames': ['상반기.pdf'],
    }
    expect(
      overlayEntriesAbsentFromLive(
        {
          'recruit.detailInfo.attachmentFileNames': [],
          'economyRecruit.detailInfo.attachmentFileNames': ['이전.pdf'],
          'recruitInstructor.detailInfo.thumbFileName': null,
          'recruitVolunteer.h1.detailInfo.attachmentFileNames': [],
          'recruitVolunteer.h2.detailInfo.attachmentFileNames': ['하반기.pdf'],
          'application.volunteer.previousProgram.fileNames': ['증빙.pdf'],
        },
        live
      )
    ).toEqual({
      'recruitVolunteer.h2.detailInfo.attachmentFileNames': ['하반기.pdf'],
      'application.volunteer.previousProgram.fileNames': ['증빙.pdf'],
    })
  })

  it('UJAT 봉사자 sidecar replace는 live 빈 값을 저장본으로 덮는다', () => {
    patchGeneralRecruitOverlay({
      'recruitVolunteer.h1.detailInfo.attachmentFileNames': [],
      'recruitVolunteer.h2.detailInfo.attachmentFileNames': [],
      'recruit.inquiryContact': '유지',
    })
    replaceUjatVolunteerRecruitGeneralStoreSidecar({
      'recruitVolunteer.h1.detailInfo.attachmentFileNames': ['상반기.pdf'],
      'recruitVolunteer.h2.detailInfo.attachmentFileNames': ['하반기.pdf'],
    })
    expect(getGeneralRecruitOverlayRecord()).toMatchObject({
      'recruit.inquiryContact': '유지',
      'recruitVolunteer.h1.detailInfo.attachmentFileNames': ['상반기.pdf'],
      'recruitVolunteer.h2.detailInfo.attachmentFileNames': ['하반기.pdf'],
    })
  })

  it('UJAT 봉사자 sidecar는 live가 비면 저장본을 강제 복원한다', () => {
    restoreUjatVolunteerRecruitGeneralStoreSidecar(
      {
        'recruitVolunteer.h1.detailInfo.additionalContentHtml': '<p>상반기 상세</p>',
        'recruit.volunteer.h1.interview.slots': [{ id: 'slot-1' }],
      },
      { forceEmptyLive: true }
    )
    expect(getGeneralRecruitOverlayRecord()['recruitVolunteer.h1.detailInfo.additionalContentHtml']).toBe(
      '<p>상반기 상세</p>'
    )
    expect(getGeneralRecruitOverlayRecord()['recruit.volunteer.h1.interview.slots']).toEqual([
      { id: 'slot-1' },
    ])
  })

  it('UJAT 봉사자 반기 첨부 복원은 편집 중인 파일명을 유지한다', () => {
    patchGeneralRecruitOverlay({
      'recruitVolunteer.h1.detailInfo.attachmentFileNames': ['상반기-유지.pdf'],
    })
    restoreUjatVolunteerRecruitGeneralStoreSidecar({
      'recruitVolunteer.h1.detailInfo.attachmentFileNames': [],
      'recruitVolunteer.h2.detailInfo.attachmentFileNames': ['하반기.pdf'],
    })
    expect(
      getGeneralRecruitOverlayRecord()['recruitVolunteer.h1.detailInfo.attachmentFileNames']
    ).toEqual(['상반기-유지.pdf'])
    expect(
      getGeneralRecruitOverlayRecord()['recruitVolunteer.h2.detailInfo.attachmentFileNames']
    ).toEqual(['하반기.pdf'])
  })

  it('replace는 live에 남아 있는 빈 상세 키를 저장본으로 덮는다', () => {
    patchGeneralRecruitOverlay({
      'recruit.detailInfo.programDescription': '',
      'recruit.detailInfo.additionalContentHtml': '',
      'recruit.inquiryContact': '문의는 유지',
    })
    replaceRecruitDetailInfoIntoGeneralStore(
      {
        'recruit.detailInfo.programDescription': '저장본 설명',
        'recruit.detailInfo.additionalContentHtml': '<p>저장본 본문</p>',
      },
      'recruit.detailInfo'
    )
    expect(getGeneralRecruitOverlayRecord()).toMatchObject({
      'recruit.inquiryContact': '문의는 유지',
      'recruit.detailInfo.programDescription': '저장본 설명',
      'recruit.detailInfo.additionalContentHtml': '<p>저장본 본문</p>',
    })
  })

  it('복원은 이미 편집 중인 첨부 파일명을 덮지 않는다', () => {
    patchGeneralRecruitOverlay({
      'trainedTeachersRecruit.detailInfo.attachmentFileNames': ['유지.pdf'],
    })
    restoreRecruitDetailInfoIntoGeneralStore(
      {
        'trainedTeachersRecruit.detailInfo.attachmentFileNames': [],
        'trainedTeachersRecruit.detailInfo.learningSupportContent': '학습지원',
      },
      'trainedTeachersRecruit.detailInfo'
    )
    expect(
      getGeneralRecruitOverlayRecord()['trainedTeachersRecruit.detailInfo.attachmentFileNames']
    ).toEqual(['유지.pdf'])
    expect(
      getGeneralRecruitOverlayRecord()['trainedTeachersRecruit.detailInfo.learningSupportContent']
    ).toBe('학습지원')
  })
})
