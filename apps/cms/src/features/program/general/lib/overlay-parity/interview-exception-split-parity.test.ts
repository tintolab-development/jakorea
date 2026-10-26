/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { mapVolunteerInterviewExceptionsFromOverlay } from '@/features/program/shared/lib/volunteer-interview-exception-overlay'
// --- 대상 import (분리 커밋: sync 모듈 → 새 순수 모듈 경로. 스냅샷은 그대로) ---
import {
  listFilledVolunteerInterviewExceptionBlockIds,
  listVolunteerInterviewExceptionBlockIds,
  readVolunteerInterviewExceptionOverlayBlocks,
  reconcileVolunteerInterviewExceptionBlockKeys,
} from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-exception-overlay-blocks'
// --- 끝 ---

/**
 * Part4 8단계 추가(봉사 면접 예외 블록 순수 함수 분리) parity — aabe2c97a에서 만든 스냅샷.
 * 예외 블록 목록·읽기·id 맞추기를 sync 모듈 밖으로 옮겨도 결과가 같아야 한다.
 */

const SLOT_A = `${Date.UTC(2026, 10, 3, 1, 0)}-${Date.UTC(2026, 10, 3, 1, 30)}`
const SLOT_B = `${Date.UTC(2026, 10, 3, 2, 0)}-${Date.UTC(2026, 10, 3, 2, 30)}`

function recruitRecord(): Record<string, unknown> {
  return {
    'recruit.volunteer.interview.range.start': '2026-11-01T00:00:00.000Z',
    'recruit.volunteer.interview.exception.1730000000001.exceptionDate': '2026-11-03T00:00:00.000Z',
    'recruit.volunteer.interview.exception.1730000000001.selectedSlotKeys': [SLOT_A, SLOT_B],
    'recruit.volunteer.interview.exception.1730000000001.timeUnit': 30,
    'recruit.volunteer.interview.exception.1730000000002.exceptionDate': null,
    'recruit.volunteer.interview.exception.1730000000002.selectedSlotKeys': [],
    'recruit.volunteer.interview.exception.1730000000003.interviewTime': '14:00',
    'recruit.volunteer.interview.exception.1730000000003.interviewTimeRange': ['14:00', '15:00'],
    'recruit.volunteer.interview.exception.1730000000003.exclusionState': { weekend: true },
    'recruit.volunteer.interview.exception.1730000000003.appliedUnavailableDates': ['2026-11-07'],
    'recruit.volunteer.interview.exception.1730000000001.interviewTime': '',
    'recruit.volunteer.interview.exception.abc.exceptionDate': '2026-11-09',
    'application.volunteer.interview.exception.9.exceptionDate': '2026-11-10T00:00:00.000Z',
  }
}

function namespacedRecord(): Record<string, unknown> {
  return {
    'ujat.h1.interview.exception.5.exceptionDate': '2026-04-02T00:00:00.000Z',
    'ujat.h1.interview.exception.5.selectedSlotKeys': [SLOT_A],
    'ujat.h1.interview.exception.6.exceptionDate': '',
    'ujat.h2.interview.exception.7.interviewTime': '10:00',
  }
}

describe('part4-8 봉사 면접 예외 블록 순수 함수 parity', () => {
  it('list / listFilled / read — recruit 기본 prefix', () => {
    const record = recruitRecord()
    expect({
      ids: listVolunteerInterviewExceptionBlockIds(record, 'recruit'),
      filled: listFilledVolunteerInterviewExceptionBlockIds(record, 'recruit'),
      blocks: readVolunteerInterviewExceptionOverlayBlocks(record, 'recruit'),
      applicationIds: listVolunteerInterviewExceptionBlockIds(record, 'application'),
      applicationBlocks: readVolunteerInterviewExceptionOverlayBlocks(record, 'application'),
    }).toMatchSnapshot()
  })

  it('list / listFilled / read — namespace', () => {
    const record = namespacedRecord()
    expect({
      h1Ids: listVolunteerInterviewExceptionBlockIds(record, 'recruit', 'ujat.h1.interview'),
      h1Filled: listFilledVolunteerInterviewExceptionBlockIds(
        record,
        'recruit',
        ' ujat.h1.interview '
      ),
      h1Blocks: readVolunteerInterviewExceptionOverlayBlocks(
        record,
        'recruit',
        'ujat.h1.interview'
      ),
      h2Filled: listFilledVolunteerInterviewExceptionBlockIds(
        record,
        'application',
        'ujat.h2.interview'
      ),
      empty: readVolunteerInterviewExceptionOverlayBlocks({}, 'recruit'),
    }).toMatchSnapshot()
  })

  it('reconcile — 새 id 발급이 없는 경우', () => {
    const cases = [
      { previous: [], saved: [], count: 0 },
      { previous: [], saved: [11, 12], count: 1 },
      { previous: [], saved: [11, 12], count: 2 },
      { previous: [11, 12, 13], saved: [11, 12, 13], count: 2 },
      { previous: [21, 22, 23], saved: [11], count: 2 },
      { previous: [21], saved: [11, 12], count: 3 },
      { previous: [21, 22], saved: [11], count: 2 },
    ]
    expect(cases.map(args => reconcileVolunteerInterviewExceptionBlockKeys(args))).toMatchSnapshot()
  })

  it('reconcile — 새 id 발급 시 개수·기존 id 보존', () => {
    const minted = reconcileVolunteerInterviewExceptionBlockKeys({
      previous: [],
      saved: [11],
      count: 3,
    })
    expect(minted.length).toBe(3)
    expect(minted[0]).toBe(11)
    expect(new Set(minted).size).toBe(3)
    const fresh = reconcileVolunteerInterviewExceptionBlockKeys({
      previous: [],
      saved: [],
      count: 2,
    })
    expect(fresh.length).toBe(2)
    expect(fresh[0]).not.toBe(fresh[1])
  })

  it('map — 프로그램 저장·표시용 예외 일정', () => {
    expect({
      recruit: mapVolunteerInterviewExceptionsFromOverlay(recruitRecord()),
      application: mapVolunteerInterviewExceptionsFromOverlay(recruitRecord(), 'application'),
      namespaced: mapVolunteerInterviewExceptionsFromOverlay(
        namespacedRecord(),
        'recruit',
        'ujat.h1.interview'
      ),
    }).toMatchSnapshot()
  })
})
