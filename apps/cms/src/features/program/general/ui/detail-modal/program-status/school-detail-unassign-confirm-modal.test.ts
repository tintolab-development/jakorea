import { describe, expect, it } from 'vitest'
import {
  buildInstitutionDetailUnassignMessage,
  buildInstructorAssignmentUnassignMessage,
  resolveInstitutionDetailUnassignTitle,
} from './school-detail-unassign-confirm-modal'

describe('일반 기관형 강사 배정 취소 안내 (시안 12-1·12-2)', () => {
  it('단건/일괄 제목', () => {
    expect(resolveInstitutionDetailUnassignTitle(1)).toBe('강사 배정 취소 안내')
    expect(resolveInstitutionDetailUnassignTitle(3)).toBe('강사 일괄 배정 취소 안내')
  })

  it('알림 발송 전 본문', () => {
    expect(buildInstitutionDetailUnassignMessage(['김제이'], 'JA초등학교', false)).toBe(
      '[**김제이**] 님의 배정을 취소하시겠습니까?\n취소 시 발송 예정인 배정 알림이 있는 경우 자동으로 취소되며,\n[**JA초등학교**]의 강사 배정 현황 목록에서도 제외됩니다.'
    )
  })

  it('알림 발송 후 일괄 본문', () => {
    expect(buildInstitutionDetailUnassignMessage(['김제이', '곽도규'], 'JA초등학교', true)).toBe(
      '[**김제이**] 님 외 1명의 배정을 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, [**JA초등학교**]의 강사 배정 현황 목록에서도 제외됩니다.'
    )
  })

  it('기본(default) 문구는 그대로다', () => {
    expect(buildInstructorAssignmentUnassignMessage(['김제이'], ['JA초등학교'])).toContain(
      '강사님의 [**JA초등학교**] 배정을 취소하시겠습니까?'
    )
  })
})
