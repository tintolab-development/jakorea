import { describe, expect, it } from 'vitest'
import { mapMemberAdminProgramToProgram, mapMemberAdminPrograms } from './map-member-admin-program'

describe('mapMemberAdminProgramToProgram', () => {
  it('maps OpenAPI 기본 필드를 Program id·title·startDate에 반영한다', () => {
    const program = mapMemberAdminProgramToProgram({
      assignmentId: 10,
      programId: 42,
      programName: '경제 교육',
      assignmentRole: 'OWNER',
      assignedAt: '2026-03-01T00:00:00Z',
    })

    expect(program.id).toBe('42')
    expect(program.title).toBe('경제 교육')
    expect(program.description).toBe('OWNER')
    expect(program.startDate).toBe('2026-03-01T00:00:00Z')
    expect(program.lifecycleStatus).toBeUndefined()
  })

  it('확장 필드 lifecycleStatus·targetLevel·모집 인원을 매핑한다', () => {
    const program = mapMemberAdminProgramToProgram({
      programId: 7,
      programName: 'UJAT',
      programStartDate: '2025-09-01',
      lifecycleStatus: 'EDUCATION_IN_PROGRESS',
      participantType: 'volunteer',
      targetLevel: 'middle',
      approvedStudentCount: 12,
      recruitmentCapacity: 20,
    } as Parameters<typeof mapMemberAdminProgramToProgram>[0])

    expect(program.lifecycleStatus).toBe('education_in_progress')
    expect(program.targetLevel).toBe('middle')
    expect(program.approvedStudentCount).toBe(12)
    expect(program.rounds[0]?.capacity).toBe(20)
    expect(program.startDate).toBe('2025-09-01')
  })

  it('mapMemberAdminPrograms — 빈·undefined 입력은 빈 배열', () => {
    expect(mapMemberAdminPrograms(undefined)).toEqual([])
    expect(mapMemberAdminPrograms([])).toEqual([])
  })
})
