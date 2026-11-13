import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT,
  CERTIFICATE_VARIABLE_CHIP_ISSUE_DATE,
  COMPLETION_CERTIFICATE_PARTICIPANT_LAYOUT,
  PARTICIPATION_CERTIFICATE_PARTICIPANT_LAYOUT,
  resolveCertificateVariableChips,
  DEFAULT_CERTIFICATE_PARTICIPANT_LAYOUT,
  normalizeParticipantRowVisibility,
  resolveCertificateParticipantLayout,
} from '@/features/template/lib/certificate-participant-layout'

describe('resolveCertificateParticipantLayout', () => {
  it('강사·봉사자 활동인증서는 시안대로 6줄(「활동기간」) + 줄 고정', () => {
    for (const code of ['document-4', 'document-5']) {
      const layout = resolveCertificateParticipantLayout(code)
      expect(layout).toBe(ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT)
      expect(layout.rowLabels).toEqual([
        '성명',
        '생년월일',
        '소속',
        '프로그램명',
        '활동기간',
        '발급목적',
      ])
      expect(layout.rowVisibilityLocked).toBe(true)
    }
  })

  it('수료증은 시안 5767:47724대로 「프로그램 기간」', () => {
    const layout = resolveCertificateParticipantLayout('document-3')
    expect(layout).toBe(COMPLETION_CERTIFICATE_PARTICIPANT_LAYOUT)
    expect(layout.rowLabels).toEqual([
      '성명',
      '생년월일',
      '소속',
      '프로그램명',
      '프로그램 기간',
      '발급목적',
    ])
    expect(layout.rowVisibilityLocked).toBe(false)
  })

  it('참가인증서는 시안 5767:46804대로 「참여기간」', () => {
    const layout = resolveCertificateParticipantLayout('document-participation-certificate')
    expect(layout).toBe(PARTICIPATION_CERTIFICATE_PARTICIPANT_LAYOUT)
    expect(layout.rowLabels).toEqual([
      '성명',
      '생년월일',
      '소속',
      '프로그램명',
      '참여기간',
      '발급목적',
    ])
    expect(layout.rowVisibilityLocked).toBe(false)
  })

  it('템플릿 코드를 모르면 기본 줄 구성', () => {
    for (const code of ['document-2', undefined, null]) {
      expect(resolveCertificateParticipantLayout(code)).toBe(DEFAULT_CERTIFICATE_PARTICIPANT_LAYOUT)
    }
  })

  it('모든 증명서가 같은 라벨 없는 기본 배경을 쓴다(라벨은 HTML로 그림)', () => {
    const backgrounds = new Set(
      [
        DEFAULT_CERTIFICATE_PARTICIPANT_LAYOUT,
        COMPLETION_CERTIFICATE_PARTICIPANT_LAYOUT,
        PARTICIPATION_CERTIFICATE_PARTICIPANT_LAYOUT,
        ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT,
      ].map(layout => layout.defaultBackgroundSrc)
    )
    expect(backgrounds.size).toBe(1)
  })
})

describe('normalizeParticipantRowVisibility', () => {
  it('저장값이 없으면 줄 수만큼 모두 표시', () => {
    expect(normalizeParticipantRowVisibility(undefined, ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT)).toEqual(
      Array.from({ length: 6 }, () => true)
    )
  })

  it('활동인증서는 저장된 표시 여부와 상관없이 6줄 모두 표시(줄 고정)', () => {
    expect(
      normalizeParticipantRowVisibility([true, false, false, false, true, false], ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT)
    ).toEqual(Array.from({ length: 6 }, () => true))
    expect(
      normalizeParticipantRowVisibility([true, false, true, true, false], ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT)
    ).toEqual(Array.from({ length: 6 }, () => true))
  })

  it('수료증 등은 길이가 맞으면 그대로, 맞지 않으면 모두 표시', () => {
    expect(
      normalizeParticipantRowVisibility([true, false, true, true, false, true], DEFAULT_CERTIFICATE_PARTICIPANT_LAYOUT)
    ).toEqual([true, false, true, true, false, true])
    expect(normalizeParticipantRowVisibility([false, false], DEFAULT_CERTIFICATE_PARTICIPANT_LAYOUT)).toEqual(
      Array.from({ length: 6 }, () => true)
    )
  })
})

describe('resolveCertificateVariableChips', () => {
  it('시안 변수 칩 6줄 + 발급일자 — 수료증만 기간 칩이 「시작일」', () => {
    const participation = resolveCertificateVariableChips('document-participation-certificate')
    expect(participation.participantRows.map(chip => chip.text)).toEqual([
      '@성명',
      '@생년월일',
      '@소속처',
      '@프로그램명',
      '@프로그램 참여일 ~ @프로그램 종료일',
      '기관 및 학교 제출용',
    ])
    expect(participation.participantRows[4]?.fullWidth).toBe(true)
    expect(participation.issueDate).toBe(CERTIFICATE_VARIABLE_CHIP_ISSUE_DATE)
    expect(resolveCertificateVariableChips('document-3').participantRows[4]?.text).toBe(
      '@프로그램 시작일 ~ @프로그램 종료일'
    )
  })
})
