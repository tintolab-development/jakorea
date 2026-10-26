/**
 * 관리자 권한 설정 — 5열 카테고리 UI (조회 전용, 체크박스 비활성)
 * 권한 매트릭스 API를 호출하지 않고, 화면 전용 정적 카탈로그만 표시한다.
 */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { CmsCheckbox } from '@/shared/ui'
import type {
  AdminPermissionFlags,
  AdminPermissionSettingsDisplayRole,
} from '@/types/admin-permission-settings-ui'
import { ADMIN_PERMISSION_SETTINGS_DISPLAY_ROLES } from '@/types/admin-permission-settings-ui'
import {
  ADMIN_PERMISSION_CATEGORIES,
  ADMIN_PERMISSION_SETTINGS_ROLE_LABELS,
  createInitialPermissionsByRole,
  deriveCategoryCheckboxState,
  resolveAdminPermissionSettingsRole,
} from './admin-permission-settings-ui-data'
import './permission-customization-page.css'

interface CategoryCardsProps {
  role: AdminPermissionSettingsDisplayRole
  flags: AdminPermissionFlags
}

function CategoryCards({ role, flags }: CategoryCardsProps) {
  const isItemChecked = (itemId: string) => flags[itemId] === true

  return (
    <div className="permission-customization-page__grid">
      {ADMIN_PERMISSION_CATEGORIES.map(category => {
        const values = category.items.map(item => isItemChecked(item.id))
        const headerState = deriveCategoryCheckboxState(values)
        return (
          <div
            key={`${role}-${category.id}`}
            className="permission-customization-page__category-card"
          >
            <div className="permission-customization-page__card-head">
              <CmsCheckbox
                className="permission-customization-page__card-head-checkbox"
                checked={headerState.checked}
                indeterminate={headerState.indeterminate}
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [permissionsByRole] = useState(createInitialPermissionsByRole)

  const activeRole = useMemo((): AdminPermissionSettingsDisplayRole => {
    return resolveAdminPermissionSettingsRole(searchParams.get('role')) ?? 'master'
  }, [searchParams])

  useEffect(() => {
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
  }, [searchParams, setSearchParams])

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

  return (
    <div className="permission-customization-page permission-customization-page--admin-settings">
      <CmsTextTabs
        className="permission-customization-page__tabs"
        variant="list"
        activeKey={activeRole}
        onChange={handleTabChange}
        items={ADMIN_PERMISSION_SETTINGS_DISPLAY_ROLES.map(tab => ({
          key: tab,
          label: ADMIN_PERMISSION_SETTINGS_ROLE_LABELS[tab],
        }))}
      />

      <CategoryCards role={activeRole} flags={permissionsByRole[activeRole]} />
    </div>
  )
}
