import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  fetchAdminPermissionsCatalogRemote,
  fetchAdminRolePermissionMatrixRemote,
  fetchAdminRolesRemote,
  updateAdminRolePermissionsRemote,
} from '@/features/user/api/members-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { isAdminPermissionsRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { AdminPermissionRoleTab } from '@/types/admin-permission-settings-ui'

/** UI role 탭 → API roleCode (백엔드 확인 전 임시 매핑) */
export const ADMIN_PERMISSION_ROLE_TAB_TO_CODE: Record<AdminPermissionRoleTab, string> = {
  master: 'MASTER',
  pm: 'PM',
  partner: 'PARTNER',
  viewer: 'VIEWER',
}

export function useAdminPermissionsCatalogQuery(enabled = true) {
  const remote = isAdminPermissionsRemoteEnabled()
  return useQuery({
    queryKey: memberQueryKeys.adminPermissions.catalog(),
    enabled: enabled && remote,
    queryFn: fetchAdminPermissionsCatalogRemote,
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '권한 목록을 불러오지 못했습니다.'),
    },
  })
}

export function useAdminRolesQuery(enabled = true) {
  const remote = isAdminPermissionsRemoteEnabled()
  return useQuery({
    queryKey: memberQueryKeys.adminPermissions.roles(),
    enabled: enabled && remote,
    queryFn: fetchAdminRolesRemote,
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '관리자 역할 목록을 불러오지 못했습니다.'),
    },
  })
}

export function useAdminRolePermissionMatrixQuery(
  roleTab: AdminPermissionRoleTab,
  enabled = true
) {
  const remote = isAdminPermissionsRemoteEnabled()
  const roleCode = ADMIN_PERMISSION_ROLE_TAB_TO_CODE[roleTab]

  return useQuery({
    queryKey: memberQueryKeys.adminPermissions.roleMatrix(roleCode),
    enabled: enabled && remote,
    queryFn: () => fetchAdminRolePermissionMatrixRemote(roleCode),
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '역할별 권한 설정을 불러오지 못했습니다.'),
    },
  })
}

export function useUpdateAdminRolePermissionsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      roleCode: string
      permissionCodes: string[]
      reason?: string
    }) => {
      await updateAdminRolePermissionsRemote(input.roleCode, {
        permissionCodes: input.permissionCodes,
        reason: input.reason ?? 'CMS 권한 설정 변경',
      })
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: memberQueryKeys.adminPermissions.roleMatrix(variables.roleCode),
      })
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '권한 설정 저장에 실패했습니다.'),
    },
  })
}
