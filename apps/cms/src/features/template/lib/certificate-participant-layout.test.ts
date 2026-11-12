import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT,
  DEFAULT_CERTIFICATE_PARTICIPANT_LAYOUT,
  normalizeParticipantRowVisibility,
  resolveCertificateParticipantLayout,
} from '@/features/template/lib/certificate-participant-layout'

describe('resolveCertificateParticipantLayout', () => {
  it('강사·봉사자 활동인증서는 5줄 + 라벨 없는 기본 배경', () => {
    for (const code of ['document-4', 'document-5']) {
      const layout = resolveCertificateParticipantLayout(code)
      expect(layout).toBe(ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT)
      expect(layout.rowLabels).toEqual(['성명', '프로그램명', '참여기간', '활동시수', '발급목적'])
      expect(layout.defaultBackgroundHasParticipantLabels).toBe(false)
      expect(layout.rowVisibilityLocked).toBe(true)
    }
  })

  it('수료증·참가인증서 등 그 밖의 증명서는 기존 6줄 + 라벨 합성 배경 그대로', () => {
    for (const code of ['document-3', 'document-participation-certificate', undefined, null]) {
      const layout = resolveCertificateParticipantLayout(code)
      expect(layout).toBe(DEFAULT_CERTIFICATE_PARTICIPANT_LAYOUT)
      expect(layout.rowLabels).toEqual([
        '성명',
        '생년월일',
        '소속',
        '프로그램명',
        '활동기간',
        '발급목적',
      ])
      expect(layout.defaultBackgroundHasParticipantLabels).toBe(true)
    }
  })
})

describe('normalizeParticipantRowVisibility', () => {
  it('저장값이 없으면 줄 수만큼 모두 표시', () => {
    expect(normalizeParticipantRowVisibility(undefined, ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT)).toEqual([
      true,
      true,
      true,
      true,
      true,
    ])
  })

  it('활동인증서는 저장된 표시 여부와 상관없이 5줄 모두 표시(줄 고정)', () => {
    expect(
      normalizeParticipantRowVisibility([true, false, false, false, true, false], ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT)
    ).toEqual([true, true, true, true, true])
    expect(
      normalizeParticipantRowVisibility([true, false, true, true, false], ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT)
    ).toEqual([true, true, true, true, true])
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
