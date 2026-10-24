import { describe, expect, it } from 'vitest'
import type { AdminProgramRoleOptionResponse } from '@/shared/api/generated/members/schemas/adminProgramRoleOptionResponse'
import {
  PROGRAM_MANAGER_ASSIGNMENT_ROLE_BY_TAB,
  PROGRAM_MANAGER_PERMISSION_CAPABILITY_MAP_AVAILABLE,
  PROGRAM_ROLE_PUT_SAFE_SNAPSHOT_AVAILABLE,
  findProgramRoleOptionForTab,
  isProgramManagerAssignmentRoleCode,
  keepCatalogFlagsIndependentOfCapabilities,
  listProgramManagerAssignmentRoleCodes,
} from './program-manager-permission-api-contract'
import { createInitialProgramManagerPermissionsByRole } from './program-manager-permission-settings-ui-data'

const CONFLICTING_OPTIONS: AdminProgramRoleOptionResponse[] = [
  { code: 'PM', label: 'Program Owner', capabilities: [] },
  { code: 'PARTNER', label: 'Program Assistant', capabilities: ['PROGRAM_VIEW'] },
  {
    code: 'VIEWER',
    label: 'Program Viewer',
    capabilities: ['PROGRAM_VIEW', 'FILE_DOWNLOAD', 'SENSITIVE_PII_READ'],
  },
]

describe('program-manager-permission-api-contract', () => {
  it('탭 → 배정 역할 코드는 Owner=PM, Assistant=PARTNER, Viewer=VIEWER', () => {
    expect(PROGRAM_MANAGER_ASSIGNMENT_ROLE_BY_TAB).toEqual({
      owner: 'PM',
      assistant: 'PARTNER',
      viewer: 'VIEWER',
    })
    expect(listProgramManagerAssignmentRoleCodes()).toEqual(['PM', 'PARTNER', 'VIEWER'])
    expect(isProgramManagerAssignmentRoleCode('pm')).toBe(true)
    expect(isProgramManagerAssignmentRoleCode('MASTER')).toBe(false)
  })

  it('역할 옵션은 code로만 찾고 label은 추측하지 않는다', () => {
    expect(findProgramRoleOptionForTab(CONFLICTING_OPTIONS, 'owner')?.code).toBe('PM')
    expect(findProgramRoleOptionForTab(CONFLICTING_OPTIONS, 'assistant')?.code).toBe('PARTNER')
    expect(findProgramRoleOptionForTab(CONFLICTING_OPTIONS, 'viewer')?.code).toBe('VIEWER')
    expect(
      findProgramRoleOptionForTab([{ code: 'OWNER', label: 'Program Owner' }], 'owner')
    ).toBeUndefined()
  })

  it('BE capabilities가 시안과 충돌해도 체크 상태는 카탈로그 정본을 유지한다', () => {
    expect(PROGRAM_MANAGER_PERMISSION_CAPABILITY_MAP_AVAILABLE).toBe(false)
    const catalog = createInitialProgramManagerPermissionsByRole()
    const merged = keepCatalogFlagsIndependentOfCapabilities(catalog, CONFLICTING_OPTIONS)

    expect(merged).toBe(catalog)
    expect(merged.owner.pii_rrn).toBe(true)
    expect(merged.assistant.pii_rrn).toBe(false)
    expect(merged.assistant.sp_program_manager).toBe(false)
    expect(merged.viewer.crud_program_edit).toBe(false)
    expect(merged.viewer.sv_program_info).toBe(true)
    expect(merged.viewer.fd_participant_application).toBe(false)
    expect(merged.viewer.pii_rrn).toBe(false)
  })

  it('이력 목록으로는 PUT 전체 치환 스냅샷을 구성하지 않는다', () => {
    expect(PROGRAM_ROLE_PUT_SAFE_SNAPSHOT_AVAILABLE).toBe(false)
  })
})
