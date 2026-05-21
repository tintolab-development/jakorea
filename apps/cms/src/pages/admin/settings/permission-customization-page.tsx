/**
 * 관리자 권한 설정 (UI 미리보기 — 로컬 state만, 저장/API 없음)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert } from 'antd'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { isMasterAdmin } from '@/shared/utils/permissions'
import { CmsCheckbox } from '@/shared/ui'
import type {
  AdminPermissionCategoryDef,
  AdminPermissionFlags,
  AdminPermissionRoleTab } from '@/types/admin-permission-settings-ui'
import { ADMIN_PERMISSION_ROLE_TABS } from '@/types/admin-permission-settings-ui'
import {
  ADMIN_PERMISSION_CATEGORIES,
  ADMIN_PERMISSION_ROLE_LABELS,
  PARTNER_UNCHECKED_PERMISSION_IDS,
  PM_UNCHECKED_PERMISSION_IDS,
  createInitialPermissionsByRole,
  isValidRoleTab } from './admin-permission-settings-ui-data'
import './permission-customization-page.css'

interface CategoryCardsProps {
  role: AdminPermissionRoleTab
  flags: AdminPermissionFlags
  onItemChange: (itemId: string, checked: boolean) => void
  onCategorySelectAll: (category: AdminPermissionCategoryDef, checked: boolean) => void
}

function CategoryCards({ role, flags, onItemChange, onCategorySelectAll }: CategoryCardsProps) {
  const isMasterRole = role === 'master'
  const isPmRole = role === 'pm'
  const isPartnerRole = role === 'partner'
  const isViewerRole = role === 'viewer'
  const isRoleLocked = isMasterRole || isPmRole || isPartnerRole || isViewerRole
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
                disabled={isRoleLocked}
                onChange={e => onCategorySelectAll(category, e.target.checked)}
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
                    disabled={isRoleLocked}
                    onChange={e => onItemChange(item.id, e.target.checked)}
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
      [role]: { ...prev[role], [itemId]: checked } }))
  }, [])

  const setCategoryAll = useCallback(
    (role: AdminPermissionRoleTab, category: AdminPermissionCategoryDef, checked: boolean) => {
      const patch = Object.fromEntries(category.items.map(i => [i.id, checked])) as Record<
        string,
        boolean
      >
      setPermissionsByRole(prev => ({
        ...prev,
        [role]: { ...prev[role], ...patch } }))
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

      <CategoryCards
        role={activeRole}
        flags={permissionsByRole[activeRole]}
        onItemChange={(itemId, checked) => setItem(activeRole, itemId, checked)}
        onCategorySelectAll={(cat, checked) => setCategoryAll(activeRole, cat, checked)}
      />
    </div>
  )
}
