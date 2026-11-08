import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { AdminProgramSponsorAssignmentDto } from '@/features/program/general/api/programs-api-client'
import { mergeProgramSponsorAssignments } from '@/features/program/shared/lib/merge-program-sponsor-assignments'
import { sanitizeGeneralProgramServiceDetailPersistValue } from '@/features/program/general/lib/general-program-service-detail-json'

const BASE_PROGRAM = { id: '99300', sponsorId: '', generalCommonInfo: {} } as unknown as Program

const LINKED_ASSIGNMENT: AdminProgramSponsorAssignmentDto = {
  id: '99321',
  sponsorId: '99301',
  sponsorName: '링크 후원사',
  sponsorContactId: '99311',
  sponsorContactName: '모바일담당',
  sponsorContacts: [
    {
      sponsorContactId: '99311',
      sponsorContactName: '모바일담당',
      sponsorContactPosition: '팀장',
      displayOrder: 10,
      sponsorContactPhone: '010-1111-2222',
      sponsorContactEmail: 'mobile@example.test',
    },
  ],
  sponsorYear: 2026,
  contributionAmountSnapshot: 5000000,
  displayOrder: 1,
  sponsorHomepageUrl: 'https://sponsor.example.test',
  sponsorLogoFileObjectId: 99351,
  sponsorLogoFileName: 'logo.png',
}

describe('mergeProgramSponsorAssignments — 배정 응답 홈페이지·로고·담당자 연락처', () => {
  it('후원사 홈페이지·대표 로고와 담당자 직책·전화·이메일을 표시용 map으로 담는다', () => {
    const merged = mergeProgramSponsorAssignments(BASE_PROGRAM, [LINKED_ASSIGNMENT])
    const common = merged.generalCommonInfo

    expect(common?.sponsorAssignmentDetails).toEqual({
      '99301': {
        homepageUrl: 'https://sponsor.example.test',
        logoFileObjectId: 99351,
        logoFileName: 'logo.png',
      },
    })
    expect(common?.sponsorManagerContactDetails).toEqual({
      '99301::99311': {
        position: '팀장',
        phone: '010-1111-2222',
        email: 'mobile@example.test',
      },
    })
    // 기존 필드 회귀
    expect(common?.sponsorManagementIds).toEqual(['99301'])
    expect(common?.sponsorManagerContactIds).toEqual(['99301::99311'])
    expect(common?.sponsorManagerContactNames).toEqual({ '99301::99311': '모바일담당' })
    expect(common?.sponsorManagementNames).toEqual({ '99301': '링크 후원사' })
    expect(merged.managerName).toBe('모바일담당')
  })

  it('권한 없음(전화·이메일 null)·홈페이지·로고 없음은 null로 둔다 — 다른 API로 채우지 않는다', () => {
    const merged = mergeProgramSponsorAssignments(BASE_PROGRAM, [
      {
        ...LINKED_ASSIGNMENT,
        sponsorHomepageUrl: null,
        sponsorLogoFileObjectId: null,
        sponsorLogoFileName: null,
        sponsorContacts: [
          {
            ...LINKED_ASSIGNMENT.sponsorContacts![0]!,
            sponsorContactPhone: null,
            sponsorContactEmail: null,
          },
        ],
      },
    ])
    const common = merged.generalCommonInfo
    expect(common?.sponsorAssignmentDetails?.['99301']).toEqual({
      homepageUrl: null,
      logoFileObjectId: null,
      logoFileName: null,
    })
    expect(common?.sponsorManagerContactDetails?.['99301::99311']).toEqual({
      position: '팀장',
      phone: null,
      email: null,
    })
  })

  it('배정 해제(빈 배열)면 표시용 map도 비운다', () => {
    const withDetails = mergeProgramSponsorAssignments(BASE_PROGRAM, [LINKED_ASSIGNMENT])
    const cleared = mergeProgramSponsorAssignments(withDetails, [])
    expect(cleared.generalCommonInfo?.sponsorAssignmentDetails).toEqual({})
    expect(cleared.generalCommonInfo?.sponsorManagerContactDetails).toEqual({})
  })

  it('표시용 map은 serviceDetailJson 저장 값에 싣지 않는다', () => {
    const merged = mergeProgramSponsorAssignments(BASE_PROGRAM, [LINKED_ASSIGNMENT])
    const persisted = sanitizeGeneralProgramServiceDetailPersistValue({
      commonInfo: merged.generalCommonInfo,
    }) as { commonInfo: Record<string, unknown> }
    expect(persisted.commonInfo).not.toHaveProperty('sponsorAssignmentDetails')
    expect(persisted.commonInfo).not.toHaveProperty('sponsorManagerContactDetails')
    expect(persisted.commonInfo.sponsorManagementIds).toEqual(['99301'])
  })
})
