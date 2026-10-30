import { describe, expect, it } from 'vitest'
import {
  buildUjatTemporaryActionCopy,
  extraInstitutionCount,
  resolveUjatTemporaryAction,
} from './temporary-action-copy'

describe('UJAT 임시 처리 확인 모달 카피', () => {
  it('단건 임시 배정 문구와 N 계산을 맞춘다', () => {
    expect(resolveUjatTemporaryAction('temp_assign', ['JA초'])).toBe('temp_assign')
    expect(extraInstitutionCount(['JA초'])).toBe(0)
    expect(buildUjatTemporaryActionCopy('temp_assign', ['JA초'])).toMatchObject({
      title: '임시 배정 안내',
      lead: '[JA초]',
      leadSuffix: ' 기관을 임시 배정하시겠습니까?',
      confirmLabel: '임시 배정',
      confirmTone: 'primary',
    })
  })

  it('일괄 N은 첫 기관을 제외한 추가 선택 수이다', () => {
    expect(resolveUjatTemporaryAction('temp_assign', ['A초', 'B초', 'C초'])).toBe('bulk_temp_assign')
    expect(extraInstitutionCount(['A초', 'B초', 'C초'])).toBe(2)
    expect(buildUjatTemporaryActionCopy('temp_assign', ['A초', 'B초', 'C초'])).toMatchObject({
      title: '일괄 임시 배정 안내',
      lead: '[A초]',
      leadSuffix: ' 외 2개의 기관을 임시 배정하시겠습니까?',
    })
  })

  it('단건·일괄 임시 반려 문구를 구분한다', () => {
    expect(buildUjatTemporaryActionCopy('temp_reject', ['JA초']).title).toBe('임시 반려 안내')
    expect(buildUjatTemporaryActionCopy('temp_reject', ['JA초', 'B초'])).toMatchObject({
      title: '일괄 임시 반려 안내',
      leadSuffix: ' 외 1개의 기관을 임시 반려하시겠습니까?',
      confirmLabel: '임시 반려',
    })
  })

  it('임시 배정/반려 취소는 빨간 outline 버튼이다', () => {
    expect(buildUjatTemporaryActionCopy('temp_assign_cancel', ['JA초'])).toMatchObject({
      title: '임시 배정 취소 안내',
      leadSuffix: '의 임시 배정을 취소하시겠습니까?',
      confirmLabel: '임시 배정 취소',
      confirmTone: 'danger-outline',
    })
    expect(buildUjatTemporaryActionCopy('temp_reject_cancel', ['JA초'])).toMatchObject({
      title: '임시 반려 취소 안내',
      confirmLabel: '임시 반려 취소',
      confirmTone: 'danger-outline',
    })
  })
})
