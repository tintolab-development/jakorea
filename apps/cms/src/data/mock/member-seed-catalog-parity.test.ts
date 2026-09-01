/**
 * FE seed catalog ↔ handoff spec JSON numeric id parity (no network).
 */
import { describe, expect, it } from 'vitest'
import managementSpec from '../../../docs/api/members/member-management-seed-v1.spec.json'
import detailHistorySpec from '../../../docs/api/members/member-detail-history-seed-v1.spec.json'
import permissionSpec from '../../../docs/api/members/member-permission-management-seed-v1.spec.json'
import {
  MEMBER_MANAGEMENT_SEED_LABEL,
  MEMBER_DIRECTORY_SEED_CASES,
  INSTRUCTOR_ROLE_REQUEST_SEED_CASES,
  MOCK_TO_BE_DIRECTORY_MEMBER_ID,
  MOCK_TO_BE_PERMISSION_MEMBER_ID,
} from './member-management-seed-catalog'
import {
  MEMBER_DETAIL_HISTORY_SEED_LABEL,
  MEMBER_DETAIL_HISTORY_SEED_CASES,
  SCHOOL_ENROLLMENT_HISTORY_SEED_CASES,
  ADMIN_PROGRAM_ROLE_SEED_CASES,
} from './member-detail-history-seed-catalog'

describe('member seed catalog ↔ spec JSON parity', () => {
  it('management seed label matches spec', () => {
    expect(MEMBER_MANAGEMENT_SEED_LABEL).toBe(managementSpec.seedLabel)
  })

  it('detail history seed label matches spec', () => {
    expect(MEMBER_DETAIL_HISTORY_SEED_LABEL).toBe(detailHistorySpec.seedLabel)
  })

  it('directory showcase memberIds match spec allTab', () => {
    for (const row of managementSpec.memberDirectoryShowcase.allTab) {
      const catalog = MEMBER_DIRECTORY_SEED_CASES.allTab.find(c => c.caseId === row.caseId)
      expect(catalog, row.caseId).toBeDefined()
      if ('memberId' in row && row.memberId != null && 'memberId' in catalog!) {
        expect(catalog!.memberId).toBe(row.memberId)
      }
      if ('adminAccountId' in row && row.adminAccountId != null && 'adminAccountId' in catalog!) {
        expect(catalog!.adminAccountId).toBe(row.adminAccountId)
      }
    }
  })

  it('detail history memberIds match spec showcase', () => {
    for (const specRow of detailHistorySpec.memberDetailHistoryShowcase) {
      const catalog = MEMBER_DETAIL_HISTORY_SEED_CASES.find(c => c.caseId === specRow.caseId)
      expect(catalog, specRow.caseId).toBeDefined()
      expect(catalog!.memberId).toBe(specRow.memberId)
      expect(catalog!.mockFeUserId).toBe(specRow.mockFeUserId)
    }
  })

  it('permission IR showcase requestIds exist in catalog', () => {
    const pending = INSTRUCTOR_ROLE_REQUEST_SEED_CASES.find(c => c.caseId === 'IR-PENDING-PORTAL-FULL')
    expect(pending?.requestId).toBe(172001)
    expect(pending?.memberId).toBe(172101)
    const excluded = INSTRUCTOR_ROLE_REQUEST_SEED_CASES.find(c => c.caseId === 'IR-EXCLUDED-DUAL')
    expect(excluded?.requestId).toBe(172007)
    expect(excluded?.listIncluded).toBe(false)
  })

  it('directory vs permission memberId split documented in catalog', () => {
    expect(MOCK_TO_BE_DIRECTORY_MEMBER_ID['mock-instructor-jung-001']).toBe(171003)
    expect(MOCK_TO_BE_PERMISSION_MEMBER_ID['mock-instructor-jung-001']).toBe(172101)
    expect(MOCK_TO_BE_DIRECTORY_MEMBER_ID['mock-instructor-choi-001']).toBe(171004)
    expect(MOCK_TO_BE_PERMISSION_MEMBER_ID['mock-instructor-choi-001']).toBe(172107)
  })

  it('school enrollment historyRowId starts match spec', () => {
    const seoul = SCHOOL_ENROLLMENT_HISTORY_SEED_CASES.find(c => c.organizationId === 171501)
    expect(seoul?.historyRowIdStart).toBe(174001)
    const specSeoul = detailHistorySpec.schoolEnrollmentShowcase.find(c => c.organizationId === 171501)
    expect(specSeoul?.historyRowIds[0]).toBe(174001)
  })

  it('admin program role ids match spec', () => {
    const admin = ADMIN_PROGRAM_ROLE_SEED_CASES.find(c => c.adminAccountId === 171601)
    expect(admin?.programRoleIdStart).toBe(174501)
    const specAdmin = detailHistorySpec.adminProgramRoleShowcase[0]
    expect(specAdmin.adminAccountId).toBe(171601)
    expect(specAdmin.programRoleIds[0]).toBe(174501)
  })

  it('permission spec parent seed label cross-ref', () => {
    expect(permissionSpec.parentSeedLabel).toBe(managementSpec.seedLabel)
  })
})
