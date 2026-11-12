import { describe, expect, it } from 'vitest'
import { toParticipatingParticipantCertificateStudent } from '@/features/program/general/lib/participating-individual-participant-certificate'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'

const row = (birthDate?: string) =>
  ({
    id: 'p-1',
    no: 1,
    applicantName: '가상 참여자',
    detail: { gender: '**', birthDate },
  }) as unknown as ParticipatingIndividualParticipantRow

describe('toParticipatingParticipantCertificateStudent (CMS-39)', () => {
  it('목록 마스킹 생년월일은 증명서에 쓰지 않고 성별 **도 추정하지 않는다', () => {
    const student = toParticipatingParticipantCertificateStudent(row('2008-**-**'))
    expect(student.birthDate).toBeUndefined()
    expect(student.gender).toBeUndefined()
  })

  it('발급 직전 원문 해제로 받은 날짜는 그대로 쓴다', () => {
    expect(toParticipatingParticipantCertificateStudent(row('2008-03-15')).birthDate).toBe('2008. 03. 15.')
  })
})
