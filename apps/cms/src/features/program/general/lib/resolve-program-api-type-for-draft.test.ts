import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { registrationPendingSnapshotId } from './registration-local-save'
import {
  resolveProgramApiTypeForDraft,
  resolveRegistrationProgramDraftProgramType,
} from './resolve-program-api-type-for-draft'

describe('resolveProgramApiTypeForDraft', () => {
  it('returns TRAINED_TEACHER for trained teacher registration local id', () => {
    const program = { id: 'trained-teachers-local-abc' } as Program
    expect(resolveProgramApiTypeForDraft(program)).toBe('TRAINED_TEACHER')
  })

  it('returns UJAT for ujat pending id', () => {
    const program = { id: 'ujat-pending-abc' } as Program
    expect(resolveProgramApiTypeForDraft(program)).toBe('UJAT')
  })

  it('returns GENERAL_INDIVIDUAL for individual general create body', () => {
    const program = {
      id: 'pending-abc',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    } as Program
    expect(resolveProgramApiTypeForDraft(program)).toBe('GENERAL_INDIVIDUAL')
  })
})

describe('resolveRegistrationProgramDraftProgramType', () => {
  it('1사1교 등록 스냅샷은 제목에 1사1교가 없어도 COMPANY_SCHOOL draft 키를 쓴다', () => {
    // 버그: id가 pending-registration이고 제목이 「디지털 리터러시 교실」이면
    // GENERAL draft가 COMPANY_SCHOOL create에 붙어 PROGRAM_DRAFT_TYPE_MISMATCH.
    const program = {
      id: registrationPendingSnapshotId('economy'),
      title: '디지털 리터러시 교실',
      mainTitle: '디지털 리터러시 교실',
    } as Program
    expect(resolveRegistrationProgramDraftProgramType(program)).toBe('COMPANY_SCHOOL')
    expect(resolveProgramApiTypeForDraft(program)).toBe('COMPANY_SCHOOL')
  })

  it('교육받은 교사 등록 스냅샷은 TRAINED_TEACHER draft 키를 쓴다', () => {
    const program = {
      id: registrationPendingSnapshotId('trainedTeachers'),
      title: '중학생 진로 설계 워크숍',
    } as Program
    expect(resolveRegistrationProgramDraftProgramType(program)).toBe('TRAINED_TEACHER')
  })

  it('uses coarse GENERAL for individual general program-draft key', () => {
    const program = {
      id: 'pending-abc',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    } as Program
    expect(resolveRegistrationProgramDraftProgramType(program)).toBe('GENERAL')
  })
})
