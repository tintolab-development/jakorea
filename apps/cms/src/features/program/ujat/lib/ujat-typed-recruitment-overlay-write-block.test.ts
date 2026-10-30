import { afterEach, describe, expect, it } from 'vitest'
import {
  filterUjatTypedRecruitmentOverlayPatch,
  isBlockedUjatTypedRecruitmentOverlayKey,
  setUjatTypedRecruitmentOverlayWritesBlocked,
} from '@/features/program/ujat/lib/ujat-typed-recruitment-overlay-write-block'
import {
  getRecruitDetailInfoRecord,
  patchRecruitDetailInfo,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-form-rhf'
import { resetAllOperationalOverlayStores } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import { applyLiveRecruitmentThumbnailOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import type { Program } from '@/types/domain'

describe('ujat typed recruitment overlay write block', () => {
  afterEach(() => {
    setUjatTypedRecruitmentOverlayWritesBlocked(false)
    resetAllOperationalOverlayStores()
  })

  it('detailInfo·ujat.recruit prefix를 막는다', () => {
    expect(isBlockedUjatTypedRecruitmentOverlayKey('ujatRecruit.detailInfo.thumbFileObjectId')).toBe(
      true
    )
    expect(
      isBlockedUjatTypedRecruitmentOverlayKey('recruitVolunteer.h1.detailInfo.thumbFileName')
    ).toBe(true)
    expect(isBlockedUjatTypedRecruitmentOverlayKey('ujat.recruit.volunteer.h1.publicTitle')).toBe(
      true
    )
    expect(isBlockedUjatTypedRecruitmentOverlayKey('recruit.detailInfo.thumbFileObjectId')).toBe(
      false
    )
  })

  it('위저드가 열려 있으면 상세정보 prefix patch를 버린다', () => {
    setUjatTypedRecruitmentOverlayWritesBlocked(true)
    patchRecruitDetailInfo({
      'ujatRecruit.detailInfo.thumbFileObjectId': 1,
      'recruitVolunteer.h1.detailInfo.thumbFileObjectId': 2,
      'recruit.detailInfo.thumbFileObjectId': 3,
    })
    const record = getRecruitDetailInfoRecord()
    expect(record['ujatRecruit.detailInfo.thumbFileObjectId']).toBeUndefined()
    expect(record['recruitVolunteer.h1.detailInfo.thumbFileObjectId']).toBeUndefined()
    expect(record['recruit.detailInfo.thumbFileObjectId']).toBe(3)
  })

  it('가드가 꺼져 있으면 그대로 쓴다', () => {
    expect(
      filterUjatTypedRecruitmentOverlayPatch({
        'ujatRecruit.detailInfo.thumbFileObjectId': 9,
      })
    ).toEqual({ 'ujatRecruit.detailInfo.thumbFileObjectId': 9 })
  })

  it('가드 중 섬네일 live overlay는 prefix를 만들지 않는다', () => {
    setUjatTypedRecruitmentOverlayWritesBlocked(true)
    applyLiveRecruitmentThumbnailOverlay(
      { id: 'ujat-registration-linked', backendProgramType: 'UJAT' } as Program,
      99,
      'a.png'
    )
    expect(getRecruitDetailInfoRecord()['ujatRecruit.detailInfo.thumbFileObjectId']).toBeUndefined()
  })
})
