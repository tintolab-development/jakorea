import { describe, expect, it } from 'vitest'
import {
  clearGeneralProgramDetailQueryParams,
  GENERAL_PROGRAM_DETAIL_QUERY_PARAMS,
  GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_ACTIVE,
  GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_PARAM,
  isParticipantRecruitmentPreviewOpen,
  patchGeneralProgramDetailLnbTab,
  preserveGeneralProgramDetailProgramId,
  readGeneralProgramDetailRoute,
} from './general-program-detail-route'

describe('general-program-detail-route', () => {
  it('reads lnb/tab from search params', () => {
    const params = new URLSearchParams('programId=general-prog-1&lnb=info&tab=recruitment')
    expect(readGeneralProgramDetailRoute(params)).toEqual({
      lnb: 'info',
      tab: 'recruitment',
    })
  })

  it('patches lnb/tab while preserving list filters', () => {
    const source = new URLSearchParams(
      'status=scheduled&programId=general-prog-1&lnb=info&tab=info&viewMode=list'
    )
    const next = patchGeneralProgramDetailLnbTab(source, {
      programId: 'general-prog-1',
      lnb: 'progress',
      tab: 'progress_instructors',
    })

    expect(next.get('status')).toBe('scheduled')
    expect(next.get('viewMode')).toBe('list')
    expect(next.get('lnb')).toBe('progress')
    expect(next.get('tab')).toBe('progress_instructors')
    expect(next.get('edit')).toBeNull()
  })

  it('preserveGeneralProgramDetailProgramId keeps programId only when prev already has it', () => {
    const withProgram = new URLSearchParams('status=scheduled&programId=general-prog-1&tab=info')
    const withoutProgram = new URLSearchParams('status=scheduled&tab=info')

    const kept = new URLSearchParams(withProgram)
    preserveGeneralProgramDetailProgramId(withProgram, kept)
    expect(kept.get('programId')).toBe('general-prog-1')

    const cleared = new URLSearchParams(withoutProgram)
    preserveGeneralProgramDetailProgramId(withoutProgram, cleared)
    cleared.set('tab', 'recruitment')
    expect(cleared.get('programId')).toBeNull()
    expect(cleared.get('tab')).toBe('recruitment')
  })

  it('clears detail query params while preserving list filters', () => {
    const source = new URLSearchParams(
      [
        'status=scheduled',
        'title=test',
        'programId=general-prog-1',
        'lnb=info',
        'tab=recruitment',
        'subTab=institutions',
        `${GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_PARAM}=${GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_ACTIVE}`,
        'schoolId=s1',
        'applicantId=a1',
      ].join('&')
    )
    const next = clearGeneralProgramDetailQueryParams(source)

    expect(next.get('status')).toBe('scheduled')
    expect(next.get('title')).toBe('test')
    expect(next.get('programId')).toBeNull()
    expect(next.get('lnb')).toBeNull()
    expect(next.get('tab')).toBeNull()
    expect(next.get('subTab')).toBeNull()
    expect(next.get(GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_PARAM)).toBeNull()
    expect(next.get('schoolId')).toBeNull()
    expect(next.get('applicantId')).toBeNull()
  })

  it('exposes a complete detail query sweep list', () => {
    expect(GENERAL_PROGRAM_DETAIL_QUERY_PARAMS).toContain('programId')
    expect(GENERAL_PROGRAM_DETAIL_QUERY_PARAMS).toContain('subTab')
    expect(GENERAL_PROGRAM_DETAIL_QUERY_PARAMS).toContain('participantView')
  })

  it('detects participant recruitment preview from search params', () => {
    const open = new URLSearchParams(
      `${GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_PARAM}=${GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_ACTIVE}`
    )
    const closed = new URLSearchParams()

    expect(isParticipantRecruitmentPreviewOpen(open)).toBe(true)
    expect(isParticipantRecruitmentPreviewOpen(closed)).toBe(false)
  })
})
