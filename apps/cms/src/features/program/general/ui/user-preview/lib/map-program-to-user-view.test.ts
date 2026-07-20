import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID,
} from '@/features/program/general/lib/detail-common-info-display'
import { mapProgramToParticipantRecruitmentUserView } from './map-program-to-user-view'

describe('mapProgramToParticipantRecruitmentUserView', () => {
  it('maps JOB담 mock program to user preview fields', () => {
    const program = {
      id: GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID,
      title: '일반 프로그램 (기관)_커리큘럼형_단일 회차',
      businessArea: '진로취업',
      type: 'online',
      generalCommonInfo: {
        announcementTitle: '2026년 한국씨티은행-JA Korea 특별한 JOB담 모집 안내',
        sponsorDisplayName: '한국씨티은행',
        educationFormLabel: '온라인',
        participantRecruitmentInfo: {
          operationPeriodLabel: '2026. 04. 03(금) - 2026. 11. 20(금)',
          recruitmentPeriodLabel: '2025. 12. 08(월) - 2026. 01. 16(금)',
          finalAnnouncementLabel: '2026. 01. 26 (금) | 홈페이지 공지 및 담당교사 개별 안내',
          contactOrganizationName: 'JA Korea',
        },
      },
      applicationStartDate: '2025-12-08T00:00:00+09:00',
      applicationEndDate: '2026-01-16T23:59:59+09:00',
      contactPhone: '02-6085-6028',
      contactEmail: 'cc@jakorea.org',
    } as Program

    const viewModel = mapProgramToParticipantRecruitmentUserView(program, '한국씨티은행')

    expect(viewModel.title).toBe('2026년 한국씨티은행-JA Korea 특별한 JOB담 모집 안내')
    expect(viewModel.formatTag).toBe('온라인')
    expect(viewModel.introParagraphs).toHaveLength(2)
    expect(viewModel.detailSpecs.find(row => row.label === '후원사')?.value).toBe('한국씨티은행')
    expect(viewModel.scheduleSpecs).toHaveLength(4)
    expect(viewModel.attachmentFileNames.length).toBeGreaterThan(0)
  })
})
