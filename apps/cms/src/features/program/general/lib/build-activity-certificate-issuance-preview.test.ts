import { describe, expect, it } from 'vitest'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { Program } from '@/types/domain'
import {
  ACTIVITY_CERTIFICATE_DEFAULT_ISSUANCE_PURPOSE,
  buildActivityCertificateParticipantInfo,
  buildActivityCertificateParticipantInfoForVolunteer,
  buildActivityCertificateParticipantInfoLines,
} from './build-activity-certificate-issuance-preview'

describe('활동인증서 참여자 정보 6줄 (시안 5767:46959·5767:47403, CMS-FUNC-0631)', () => {
  it('성명·생년월일·소속·프로그램명·활동기간·발급목적 순서', () => {
    const lines = buildActivityCertificateParticipantInfo(
      {
        instructorName: '김강사',
        birthDate: '1990.01.01',
        affiliation: '○○초등학교',
      } as ParticipatingInstructorRow,
      { mainTitle: '경제교육 프로그램' } as Program,
      '기관 제출용'
    ).split('\n')
    expect(lines).toEqual([
      '김강사',
      '1990.01.01',
      '○○초등학교',
      '경제교육 프로그램',
      '-',
      '기관 제출용',
    ])
  })

  it('값이 없으면 임의 기본 문구 대신 - 를 쓴다', () => {
    const lines = buildActivityCertificateParticipantInfoForVolunteer('홍봉사', {
      program: null,
    }).split('\n')
    expect(lines).toEqual(['홍봉사', '-', '-', '-', '-', ACTIVITY_CERTIFICATE_DEFAULT_ISSUANCE_PURPOSE])
    expect(lines.join('\n')).not.toContain('JA Korea 경제교육 프로그램')
    expect(lines.join('\n')).not.toContain('2026.01.01 ~ 2026.12.31')
  })

  it('생년월일·소속·참여기간 값이 주어지면 그대로 쓴다(활동시수 줄은 없다)', () => {
    expect(
      buildActivityCertificateParticipantInfoLines({
        name: '김강사',
        birthDate: '1990. 01. 01',
        affiliation: 'JA고등학교',
        program: { title: '프로그램' } as Program,
        participationPeriod: '2026.11.12 ~ 2026.11.20',
        issuanceReasonLabel: '개인 보관용',
      }).split('\n')
    ).toEqual(['김강사', '1990.01.01', 'JA고등학교', '프로그램', '2026.11.12 ~ 2026.11.20', '개인 보관용'])
  })

  it('봉사자도 생년월일·소속을 넣는다', () => {
    expect(
      buildActivityCertificateParticipantInfoForVolunteer('홍봉사', {
        birthDate: '2001.03.04',
        affiliation: 'JA대학교',
      }).split('\n').slice(0, 3)
    ).toEqual(['홍봉사', '2001.03.04', 'JA대학교'])
  })

  it('봉사자도 고른 발급 사유를 발급목적에 쓴다', () => {
    expect(
      buildActivityCertificateParticipantInfoForVolunteer('홍봉사', {
        issuanceReasonLabel: '교육 이수 증빙용',
      }).split('\n')[5]
    ).toBe('교육 이수 증빙용')
  })
})
