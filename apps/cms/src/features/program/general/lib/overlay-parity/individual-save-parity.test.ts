// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyOperationalOverlayForCatalogId,
  collectOperationalOverlayForCatalogId,
  resetOperationalOverlayForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  resetAllOperationalOverlayStores,
  setOperationalOverlayScope,
} from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  peekGeneralRecruitOverlayRecord,
  updateGeneralRecruitOverlayKey,
  useGeneralRecruitOverlayKv,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  getGeneralApplicationOverlayRecord,
  patchGeneralApplicationOverlay,
  useGeneralApplicationOverlayKv,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'

/**
 * Part3 2단계(일반 개인) 저장 결과 고정 — 80e73b1a0(스토어)에서 스냅샷 생성,
 * RHF 필드 폼 전환 뒤에도 같아야 한다(양식 extensionJson overlay = collect 결과).
 */
const RECRUIT = 'recruitment-participant-individual'
const APPLICATION = 'application-participant-individual'

function sorted(record: Record<string, unknown> | null | undefined) {
  if (record == null) return record
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))
}

const RECRUIT_OVERLAY = {
  'recruit.individual.announcementPublished': 'published',
  'recruit.individual.programRangeSeal': { start: '2026-12-01', end: '2026-12-31' },
  'recruit.individual.programAnchorIso': '2026-12-01',
  'recruit.individual.recruitRangeSeal': { start: '2026-11-01', end: '2026-11-20' },
  'recruit.individual.targetLevels': ['adult'],
  'recruit.individual.targetLevelDetail': '성인',
  'recruit.individual.inquiryContact': '담당',
  'recruit.individual.inquiryTel': '02-0000-0000',
  'recruit.individual.inquiryEmail': 'a@b.c',
  'recruit.individual.notesNotApplicable': false,
  'recruit.individual.notes': null,
  'recruit.detailInfo.programDescription': '설명',
  'recruit.detailInfo.thumbFileName': 'x.png',
}

const APPLICATION_OVERLAY = {
  'application.individual.teamInfo.teamName': '팀',
  'application.individual.teamInfo.memberCountSelect': 'custom',
  'application.individual.teamInfo.customMemberCount': '7',
  'application.individual.teamInfo.teamRole': 'member',
  'application.individual.fixedScheduleSelected': ['a'],
}

describe('일반 개인 overlay save parity (part3 step2)', () => {
  beforeEach(() => {
    resetAllOperationalOverlayStores()
  })

  it('모집: 양식 불러오기 → collect', () => {
    applyOperationalOverlayForCatalogId(RECRUIT, RECRUIT_OVERLAY)
    expect(sorted(collectOperationalOverlayForCatalogId(RECRUIT))).toMatchSnapshot('recruit-apply')
    expect(sorted(peekGeneralRecruitOverlayRecord(RECRUIT))).toMatchSnapshot('recruit-peek')
  })

  it('모집: 단락 입력(patch·updateKey·훅) → collect·활성 레코드', () => {
    setOperationalOverlayScope(RECRUIT)
    patchGeneralRecruitOverlay({
      'recruit.individual.notes': '비고',
      'recruit.individual.targetLevels': ['adult', 'senior'],
      'recruit.detailInfo.programDescription': '설명2',
    })
    updateGeneralRecruitOverlayKey<string[]>('recruit.individual.targetLevels', prev => [
      ...(prev ?? []),
      'youth',
    ])
    const { result } = renderHook(() =>
      useGeneralRecruitOverlayKv<string>('recruit.individual.inquiryTel', '')
    )
    act(() => result.current[1]('010-1111-2222'))
    expect(result.current[0]).toBe('010-1111-2222')
    expect(sorted(collectOperationalOverlayForCatalogId(RECRUIT))).toMatchSnapshot('recruit-input')
    expect(sorted(getGeneralRecruitOverlayRecord())).toMatchSnapshot('recruit-active')
  })

  it('모집: 불러오기 후 reset(시드 억제) → collect 비움', () => {
    applyOperationalOverlayForCatalogId(RECRUIT, RECRUIT_OVERLAY)
    resetOperationalOverlayForCatalogId(RECRUIT)
    expect(sorted(collectOperationalOverlayForCatalogId(RECRUIT))).toMatchSnapshot('recruit-reset')
    setOperationalOverlayScope(RECRUIT)
    const { result } = renderHook(() =>
      useGeneralRecruitOverlayKv<string>('recruit.individual.announcementPublished', 'published')
    )
    expect(result.current[0]).toMatchSnapshot('recruit-reset-default')
  })

  it('모집: 다른 양식 스코프와 섞이지 않는다', () => {
    applyOperationalOverlayForCatalogId(RECRUIT, RECRUIT_OVERLAY)
    applyOperationalOverlayForCatalogId('recruitment-instructor', {
      'recruit.instructor.notes': '강사',
    })
    expect(sorted(collectOperationalOverlayForCatalogId('recruitment-instructor'))).toMatchSnapshot(
      'instructor-collect'
    )
    expect(sorted(collectOperationalOverlayForCatalogId(RECRUIT))).toMatchSnapshot(
      'recruit-collect-after-other'
    )
  })

  it('신청: 불러오기·입력 → collect', () => {
    applyOperationalOverlayForCatalogId(APPLICATION, APPLICATION_OVERLAY)
    expect(sorted(collectOperationalOverlayForCatalogId(APPLICATION))).toMatchSnapshot(
      'application-apply'
    )
    setOperationalOverlayScope(APPLICATION)
    patchGeneralApplicationOverlay({ 'application.individual.teamInfo.teamName': '새 팀' })
    const { result } = renderHook(() =>
      useGeneralApplicationOverlayKv<string>('application.individual.teamInfo.teamRole', 'leader')
    )
    act(() => result.current[1]('leader'))
    expect(sorted(collectOperationalOverlayForCatalogId(APPLICATION))).toMatchSnapshot(
      'application-input'
    )
    expect(sorted(getGeneralApplicationOverlayRecord())).toMatchSnapshot('application-active')
    resetOperationalOverlayForCatalogId(APPLICATION)
    expect(sorted(collectOperationalOverlayForCatalogId(APPLICATION))).toMatchSnapshot(
      'application-reset'
    )
  })
})
