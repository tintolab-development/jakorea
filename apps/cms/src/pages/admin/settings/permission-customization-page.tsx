/**
 * 관리자 권한 설정 (UI 미리보기 — 로컬 state만, 저장/API 없음)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, Checkbox, Tabs } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { isMasterAdmin } from '@/shared/utils/permissions'
import type {
  AdminPermissionCategoryDef,
  AdminPermissionFlags,
  AdminPermissionRoleTab,
} from '@/types/admin-permission-settings-ui'
import { ADMIN_PERMISSION_ROLE_TABS } from '@/types/admin-permission-settings-ui'
import {
  ADMIN_PERMISSION_CATEGORIES,
  ADMIN_PERMISSION_ROLE_LABELS,
  createInitialPermissionsByRole,
  isValidRoleTab,
} from './admin-permission-settings-ui-data'
import './permission-customization-page.css'
import { AppButton } from '@/shared/ui/app-button'

function categoryCheckboxState(category: AdminPermissionCategoryDef, flags: AdminPermissionFlags) {
  const ids = category.items.map(i => i.id)
  const values = ids.map(id => flags[id] ?? false)
  const allChecked = values.length > 0 && values.every(Boolean)
  const noneChecked = values.every(v => !v)
  const indeterminate = !allChecked && !noneChecked
  return { allChecked, indeterminate }
}

interface CategoryCardsProps {
  role: AdminPermissionRoleTab
  flags: AdminPermissionFlags
  onItemChange: (itemId: string, checked: boolean) => void
  onCategorySelectAll: (category: AdminPermissionCategoryDef, checked: boolean) => void
}

function CategoryCards({ role, flags, onItemChange, onCategorySelectAll }: CategoryCardsProps) {
  return (
    <div className="permission-customization-page__grid">
      {ADMIN_PERMISSION_CATEGORIES.map(category => {
        const { allChecked, indeterminate } = categoryCheckboxState(category, flags)
        return (
          <div
            key={`${role}-${category.id}`}
            className="permission-customization-page__category-card"
          >
            <div className="permission-customization-page__card-head">
              <Checkbox
                className="permission-customization-page__card-head-checkbox"
                checked={allChecked}
                indeterminate={indeterminate}
                onChange={e => onCategorySelectAll(category, e.target.checked)}
              />
              <span className="permission-customization-page__card-head-title">
                {category.title}
              </span>
            </div>
            <div className="permission-customization-page__card-body">
              {category.items.map(item => (
                <div key={item.id} className="permission-customization-page__item-row">
                  <Checkbox
                    className="permission-customization-page__item-checkbox"
                    checked={flags[item.id] ?? false}
                    onChange={e => onItemChange(item.id, e.target.checked)}
                  >
                    {item.label}
                  </Checkbox>
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
  const [permissionsByRole, setPermissionsByRole] = useState(createInitialPermissionsByRole)

  const activeRole = useMemo((): AdminPermissionRoleTab => {
    const r = searchParams.get('role')
    return isValidRoleTab(r) ? r : 'master'
  }, [searchParams])

  const isMaster = Boolean(user && isMasterAdmin(user))

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

  const setItem = useCallback((role: AdminPermissionRoleTab, itemId: string, checked: boolean) => {
    setPermissionsByRole(prev => ({
      ...prev,
      [role]: { ...prev[role], [itemId]: checked },
    }))
  }, [])

  const setCategoryAll = useCallback(
    (role: AdminPermissionRoleTab, category: AdminPermissionCategoryDef, checked: boolean) => {
      const patch = Object.fromEntries(category.items.map(i => [i.id, checked])) as Record<
        string,
        boolean
      >
      setPermissionsByRole(prev => ({
        ...prev,
        [role]: { ...prev[role], ...patch },
      }))
    },
    []
  )

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

  const handlePersonalDetailClick = () => {
    window.alert('준비 중입니다.')
  }

  if (!user || !isMasterAdmin(user)) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="접근 권한 없음"
          description="이 페이지는 마스터 관리자만 접근할 수 있습니다."
          type="error"
          showIcon
        />
      </div>
    )
  }

  return (
    <div className="permission-customization-page">
      <Tabs
        className="permission-customization-page__tabs"
        activeKey={activeRole}
        onChange={handleTabChange}
        tabBarExtraContent={
          <AppButton type="primary" size="filter-wide" onClick={handlePersonalDetailClick}>
            개인정보 상세보기
          </AppButton>
        }
        items={ADMIN_PERMISSION_ROLE_TABS.map(tab => ({
          key: tab,
          label: ADMIN_PERMISSION_ROLE_LABELS[tab],
        }))}
      />

      <CategoryCards
        role={activeRole}
        flags={permissionsByRole[activeRole]}
        onItemChange={(itemId, checked) => setItem(activeRole, itemId, checked)}
        onCategorySelectAll={(cat, checked) => setCategoryAll(activeRole, cat, checked)}
      />
    </div>
  )
}
