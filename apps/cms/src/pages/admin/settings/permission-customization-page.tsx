/**
 * 관리자 권한 설정 — 스크린샷 기준 5열 카테고리 UI (조회 전용, 체크박스 비활성)
 * API 카탈로그 정합 전까지 로컬 카탈로그/역할별 체크 상태를 사용한다.
 */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert } from 'antd'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { isMasterAdmin } from '@/shared/utils/permissions'
import { CmsCheckbox } from '@/shared/ui'
import type {
  AdminPermissionFlags,
  AdminPermissionRoleTab,
} from '@/types/admin-permission-settings-ui'
import { ADMIN_PERMISSION_ROLE_TABS } from '@/types/admin-permission-settings-ui'
import {
  ADMIN_PERMISSION_CATEGORIES,
  ADMIN_PERMISSION_ROLE_LABELS,
  PARTNER_UNCHECKED_PERMISSION_IDS,
  PM_UNCHECKED_PERMISSION_IDS,
  createInitialPermissionsByRole,
  isValidRoleTab,
} from './admin-permission-settings-ui-data'
import { isAdminPermissionsRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { AdminPermissionsRemotePanel } from './admin-permissions-remote-panel'
import './permission-customization-page.css'

interface CategoryCardsProps {
  role: AdminPermissionRoleTab
  flags: AdminPermissionFlags
}

function CategoryCards({ role, flags }: CategoryCardsProps) {
  const isMasterRole = role === 'master'
  const isPmRole = role === 'pm'
  const isPartnerRole = role === 'partner'
  const pmUncheckedSet = new Set<string>(PM_UNCHECKED_PERMISSION_IDS)
  const partnerUncheckedSet = new Set<string>(PARTNER_UNCHECKED_PERMISSION_IDS)

  const isItemChecked = (itemId: string) => {
    if (isMasterRole) return true
    if (isPmRole) return !pmUncheckedSet.has(itemId)
    if (isPartnerRole) return !partnerUncheckedSet.has(itemId)
    return flags[itemId] ?? false
  }

  return (
    <div className="permission-customization-page__grid">
      {ADMIN_PERMISSION_CATEGORIES.map(category => {
        const values = category.items.map(item => isItemChecked(item.id))
        const allChecked = values.length > 0 && values.every(Boolean)
        const noneChecked = values.every(v => !v)
        const indeterminate = !allChecked && !noneChecked
        return (
          <div
            key={`${role}-${category.id}`}
            className="permission-customization-page__category-card"
          >
            <div className="permission-customization-page__card-head">
              <CmsCheckbox
                className="permission-customization-page__card-head-checkbox"
                checked={allChecked}
                indeterminate={indeterminate}
                disabled
              />
              <span className="permission-customization-page__card-head-title">
                {category.title}
              </span>
            </div>
            <div className="permission-customization-page__card-body">
              {category.items.map(item => (
                <div key={item.id} className="permission-customization-page__item-row">
                  <CmsCheckbox
                    className="permission-customization-page__item-checkbox"
                    checked={isItemChecked(item.id)}
                    disabled
                  >
                    {item.label}
                  </CmsCheckbox>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function PermissionCustomizationPage() {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [permissionsByRole] = useState(createInitialPermissionsByRole)

  const activeRole = useMemo((): AdminPermissionRoleTab => {
    const r = searchParams.get('role')
    return isValidRoleTab(r) ? r : 'master'
  }, [searchParams])

  const isMaster = Boolean(user && isMasterAdmin(user))
  const adminPermissionsRemote = isAdminPermissionsRemoteEnabled()

  useEffect(() => {
    if (!isMaster) return
    if (!searchParams.get('role')) {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('role', 'master')
          return next
        },
        { replace: true }
      )
    }
  }, [isMaster, searchParams, setSearchParams])

  const handleTabChange = (key: string) => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.set('role', key)
        return next
      },
      { replace: true }
    )
  }

  if (!user || !isMasterAdmin(user)) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          description="이 페이지는 마스터 관리자만 접근할 수 있습니다."
          type="error"
          showIcon
        />
      </div>
    )
  }

  return (
    <div className="permission-customization-page">
      <CmsTextTabs
        className="permission-customization-page__tabs"
        variant="list"
        activeKey={activeRole}
        onChange={handleTabChange}
        items={ADMIN_PERMISSION_ROLE_TABS.map(tab => ({
          key: tab,
          label: ADMIN_PERMISSION_ROLE_LABELS[tab],
        }))}
      />

      {adminPermissionsRemote ? (
        <AdminPermissionsRemotePanel activeRole={activeRole} />
      ) : (
        <CategoryCards role={activeRole} flags={permissionsByRole[activeRole]} />
      )}
    </div>
  )
}
