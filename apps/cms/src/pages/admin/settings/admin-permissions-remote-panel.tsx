import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Spin } from 'antd'
import type { AdminPermissionResponse } from '@/shared/api/generated/members/schemas'
import type { AdminPermissionRoleTab } from '@/types/admin-permission-settings-ui'
import { CmsButton, CmsCheckbox } from '@/shared/ui'
import {
  ADMIN_PERMISSION_ROLE_TAB_TO_CODE,
  useAdminRolePermissionMatrixQuery,
  useUpdateAdminRolePermissionsMutation,
} from '@/features/user/api/hooks/use-admin-role-permissions-query'
import { handleError } from '@/shared/utils/error-handler'

function groupByDomain(permissions: AdminPermissionResponse[]): Map<string, AdminPermissionResponse[]> {
  const map = new Map<string, AdminPermissionResponse[]>()
  for (const p of permissions) {
    const domain = p.domain?.trim() || '기타'
    const list = map.get(domain) ?? []
    list.push(p)
    map.set(domain, list)
  }
  return map
}

export function AdminPermissionsRemotePanel({ activeRole }: { activeRole: AdminPermissionRoleTab }) {
  const matrixQuery = useAdminRolePermissionMatrixQuery(activeRole)
  const updateMutation = useUpdateAdminRolePermissionsMutation()
  const roleCode = ADMIN_PERMISSION_ROLE_TAB_TO_CODE[activeRole]

  const allPermissions = matrixQuery.data?.allPermissions ?? []
  const grantedCodes = useMemo(() => {
    const codes = (matrixQuery.data?.grantedPermissions ?? [])
      .map(p => p.code)
      .filter((code): code is string => Boolean(code?.trim()))
    return new Set(codes)
  }, [matrixQuery.data?.grantedPermissions])

  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelectedCodes(new Set(grantedCodes))
  }, [grantedCodes, activeRole, matrixQuery.dataUpdatedAt])

  const grouped = useMemo(() => groupByDomain(allPermissions), [allPermissions])

  const toggleCode = useCallback((code: string, checked: boolean) => {
    setSelectedCodes(prev => {
      const next = new Set(prev)
      if (checked) next.add(code)
      else next.delete(code)
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    try {
      await updateMutation.mutateAsync({
        roleCode,
        permissionCodes: [...selectedCodes],
      })
    } catch (error) {
      handleError(error, { defaultMessage: '권한 설정 저장에 실패했습니다.' })
    }
  }, [roleCode, selectedCodes, updateMutation])

  if (matrixQuery.isLoading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin />
      </div>
    )
  }

  if (matrixQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="역할별 권한 설정을 불러오지 못했습니다"
        description="roleCode 매핑 또는 백엔드 API를 확인해 주세요."
      />
    )
  }

  return (
    <div className="permission-customization-page">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="실 API 모드 — 관리자 역할 권한"
        description="프로그램 역할(PM/Partner 등) 커스터마이징은 API 미제공으로 mock UI를 사용하지 않습니다. 역할 탭별 permission code를 저장합니다."
      />
      <div className="permission-customization-page__grid">
        {[...grouped.entries()].map(([domain, items]) => (
          <div key={`${activeRole}-${domain}`} className="permission-customization-page__category-card">
            <div className="permission-customization-page__card-head">
              <span className="permission-customization-page__card-head-title">{domain}</span>
            </div>
            <div className="permission-customization-page__card-body">
              {items.map(item => {
                const code = item.code ?? ''
                if (!code) return null
                return (
                  <div key={code} className="permission-customization-page__item-row">
                    <CmsCheckbox
                      className="permission-customization-page__item-checkbox"
                      checked={selectedCodes.has(code)}
                      onChange={e => toggleCode(code, e.target.checked)}
                    >
                      {item.name ?? code}
                    </CmsCheckbox>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <CmsButton
          variant="primary"
          size="medium"
          loading={updateMutation.isPending}
          onClick={() => {
            void handleSave()
          }}
        >
          저장
        </CmsButton>
      </div>
    </div>
  )
}
