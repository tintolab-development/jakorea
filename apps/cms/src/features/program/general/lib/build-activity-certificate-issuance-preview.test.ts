import { describe, expect, it } from 'vitest'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { Program } from '@/types/domain'
import {
  ACTIVITY_CERTIFICATE_DEFAULT_ISSUANCE_PURPOSE,
  buildActivityCertificateParticipantInfo,
  buildActivityCertificateParticipantInfoForVolunteer,
  buildActivityCertificateParticipantInfoLines,
} from './build-activity-certificate-issuance-preview'

describe('활동인증서 참여자 정보 5줄 (CMS-FUNC-0265·0631)', () => {
  it('성명·프로그램명·참여기간·활동시수·발급목적 순서, 생년월일·소속은 넣지 않는다', () => {
    const lines = buildActivityCertificateParticipantInfo(
      {
        instructorName: '김강사',
        birthDate: '1990.01.01',
        schoolName: '○○초등학교',
      } as ParticipatingInstructorRow,
      { mainTitle: '경제교육 프로그램' } as Program,
      '기관 제출용'
    ).split('\n')
    expect(lines).toEqual(['김강사', '경제교육 프로그램', '-', '-', '기관 제출용'])
  })

  it('값이 없으면 임의 기본 문구 대신 - 를 쓴다', () => {
    const lines = buildActivityCertificateParticipantInfoForVolunteer('홍봉사', {
      program: null,
    }).split('\n')
    expect(lines).toEqual(['홍봉사', '-', '-', '-', ACTIVITY_CERTIFICATE_DEFAULT_ISSUANCE_PURPOSE])
    expect(lines.join('\n')).not.toContain('JA Korea 경제교육 프로그램')
    expect(lines.join('\n')).not.toContain('2026.01.01 ~ 2026.12.31')
  })

  it('참여기간·활동시수 값이 주어지면 그대로 쓴다(서버 값 연동 자리)', () => {
    expect(
      buildActivityCertificateParticipantInfoLines({
        name: '김강사',
        program: { title: '프로그램' } as Program,
        participationPeriod: '2026.11.12 ~ 2026.11.20',
        activityHours: '총 2시간',
        issuanceReasonLabel: '개인 보관용',
      }).split('\n')
    ).toEqual(['김강사', '프로그램', '2026.11.12 ~ 2026.11.20', '총 2시간', '개인 보관용'])
  })

  it('봉사자도 고른 발급 사유를 발급목적에 쓴다', () => {
    expect(
      buildActivityCertificateParticipantInfoForVolunteer('홍봉사', {
        issuanceReasonLabel: '교육 이수 증빙용',
      }).split('\n')[4]
    ).toBe('교육 이수 증빙용')
  })
})
