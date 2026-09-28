import { describe, expect, it } from 'vitest'
import { buildProgramApplicationRejectCopy } from './program-application-reject-copy'

describe('buildProgramApplicationRejectCopy', () => {
  it('기관 단건', () => {
    expect(
      buildProgramApplicationRejectCopy({
        audience: 'institution',
        variant: 'single',
        subjectName: 'JA초등학교',
      })
    ).toEqual({
      title: '프로그램 신청 반려 안내',
      message:
        '**[JA초등학교]**의 프로그램 신청을 반려하시겠습니까?\n반려 시 입력하신 사유가 담당 교사에게 반려 사유로 안내되며, 알림이 발송됩니다.',
    })
  })

  it('회원 단건', () => {
    expect(
      buildProgramApplicationRejectCopy({
        audience: 'member',
        variant: 'single',
        subjectName: '김제이',
      })
    ).toEqual({
      title: '프로그램 신청 반려 안내',
      message:
        '**[김제이]** 님의 프로그램 신청을 반려하시겠습니까?\n반려 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.',
    })
  })

  it('기관 다건 — 대표 외 나머지 수', () => {
    expect(
      buildProgramApplicationRejectCopy({
        audience: 'institution',
        variant: 'bulk',
        subjectName: 'JA초등학교',
        selectionCount: 2,
      })
    ).toEqual({
      title: '프로그램 신청 일괄 반려 안내',
      message:
        '**[JA초등학교] 외 1개**의 프로그램 신청을 반려하시겠습니까?\n반려 시 입력하신 사유가 담당 교사에게 반려 사유로 안내되며, 알림이 발송됩니다.',
    })
  })

  it('회원 다건 — 대표 외 나머지 수', () => {
    expect(
      buildProgramApplicationRejectCopy({
        audience: 'member',
        variant: 'bulk',
        subjectName: '김제이',
        selectionCount: 2,
      })
    ).toEqual({
      title: '프로그램 신청 일괄 반려 안내',
      message:
        '**[김제이] 님 외 1명**의 프로그램 신청을 반려하시겠습니까?\n반려 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.',
    })
  })
})
