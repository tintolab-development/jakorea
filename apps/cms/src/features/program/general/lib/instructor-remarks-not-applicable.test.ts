import { describe, expect, it } from 'vitest'
import type { Program, ProgramRecruitmentWindow } from '@/types/domain'
import { applyRecruitmentDetailInfoFields } from '@/features/program/shared/lib/apply-recruitment-additional-content-html'
import { buildProgramRecruitmentRowSaveRequest } from '@/features/program/shared/lib/persist-recruitment-row-save'
import { toProgramRecruitmentWindows } from '@/features/program/shared/lib/program-edit-window'
import { programToRecruitmentTabEditValues } from './general-program-recruitment-edit-seed'
import { resolveGeneralProgramInstructorRecruitmentDisplay } from './instructor-recruitment-display'
import { resolveInstructorRowRemarksNotApplicable } from './instructor-remarks-not-applicable'
import { isGeneralRecruitmentRowProgram } from './is-general-recruitment-row-program'

function instructorRow(overrides: Record<string, unknown> = {}): ProgramRecruitmentWindow {
  const [row] =
    toProgramRecruitmentWindows([
      {
        id: 186604,
        recruitmentType: 'INSTRUCTOR',
        applicationType: 'INSTRUCTOR',
        startAt: '2026-10-16T15:00:00.000Z',
        endAt: '2026-11-22T14:59:59.999Z',
        remarks: '저장된 비고',
        ...overrides,
      },
    ]) ?? []
  return row!
}

function orgProgram(row: ProgramRecruitmentWindow): Program {
  return {
    id: '186251',
    title: '기관 프로그램',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    sponsorId: 's1',
    status: 'pending',
    lifecycleStatus: 'recruiting_instructors',
    backendProgramType: 'GENERAL_ORGANIZATION',
    rounds: [],
    startDate: '2026-11-18',
    endDate: '2026-12-31',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    programRecruitments: [
      {
        id: 186603,
        recruitmentType: 'PARTICIPANT',
        applicationType: 'ORGANIZATION',
        startAt: '2026-10-17',
        endAt: '2026-11-22',
      },
      row,
    ],
  }
}

/** 저장 훅(`useProgramDetailInfoSave`)과 같은 순서로 강사 모집 비고 patch → 행 저장 body */
function saveInstructorRemarks(
  program: Program,
  values: ReturnType<typeof programToRecruitmentTabEditValues>
) {
  const writesRowFields = isGeneralRecruitmentRowProgram(program)
  const rowRemarksNotApplicable = resolveInstructorRowRemarksNotApplicable(
    values,
    'instructor',
    writesRowFields
  )
  const patch = applyRecruitmentDetailInfoFields({}, program, 'instructor', {
    remarks: values.instructorRecruitmentRemarks,
    notesNotApplicable: values.instructorRecruitmentNotesNotApplicable === 'not_applicable',
    ...(rowRemarksNotApplicable !== undefined ? { rowRemarksNotApplicable } : {}),
  })
  return buildProgramRecruitmentRowSaveRequest({
    baseline: program,
    draft: { ...program, ...patch },
    patch,
    audience: 'instructor',
  })
}

describe('일반 프로그램 강사 모집 비고 「해당 없음」 — 행 remarksNotApplicable round-trip', () => {
  it('GET 행 remarksNotApplicable=true → 폼 해당 없음·비고 빈 값, 조회는 `-`', () => {
    const program = orgProgram(instructorRow({ remarksNotApplicable: true }))
    const values = programToRecruitmentTabEditValues(program, 'instructor')
    expect(values.instructorRecruitmentNotesNotApplicable).toBe('not_applicable')
    expect(values.instructorRecruitmentRemarks).toBe('')
    expect(resolveGeneralProgramInstructorRecruitmentDisplay(program).notes).toBe('-')
  })

  it('해당 없음 체크 저장 → 행 body remarksNotApplicable=true, 비고 비움', () => {
    const program = orgProgram(instructorRow({ remarksNotApplicable: false }))
    const seeded = programToRecruitmentTabEditValues(program, 'instructor')
    expect(seeded.instructorRecruitmentNotesNotApplicable).toBe('applicable')
    const body = saveInstructorRemarks(program, {
      ...seeded,
      instructorRecruitmentNotesNotApplicable: 'not_applicable',
      instructorRecruitmentRemarks: '',
    })
    expect(body?.remarksNotApplicable).toBe(true)
    // 비고는 비운다(BE clear) — 빈 문자열 또는 미전송
    expect(body?.remarks || null).toBeNull()
  })

  it('해당 없음 해제 + 비고 입력 저장 → remarksNotApplicable=false, 비고 저장', () => {
    const program = orgProgram(instructorRow({ remarksNotApplicable: true, remarks: null }))
    const seeded = programToRecruitmentTabEditValues(program, 'instructor')
    const body = saveInstructorRemarks(program, {
      ...seeded,
      instructorRecruitmentNotesNotApplicable: 'applicable',
      instructorRecruitmentRemarks: '새 비고',
    })
    expect(body?.remarksNotApplicable).toBe(false)
    expect(body?.remarks).toBe('새 비고')
  })

  it('행 값이 null이면 시드하지 않고 저장 body에도 넣지 않는다', () => {
    const program = orgProgram(instructorRow())
    const seeded = programToRecruitmentTabEditValues(program, 'instructor')
    expect(seeded.instructorRecruitmentNotesNotApplicable).toBeUndefined()
    const body = saveInstructorRemarks(program, seeded)
    expect(body).not.toHaveProperty('remarksNotApplicable')
  })

  it('1사1교 등 일반 모집 행 프로그램이 아니면 값을 내지 않는다', () => {
    expect(
      resolveInstructorRowRemarksNotApplicable(
        { instructorRecruitmentNotesNotApplicable: 'not_applicable' },
        'instructor',
        false
      )
    ).toBeUndefined()
    expect(
      resolveInstructorRowRemarksNotApplicable(
        { instructorRecruitmentNotesNotApplicable: 'not_applicable' },
        'volunteer',
        true
      )
    ).toBeUndefined()
  })
})
