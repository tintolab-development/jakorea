/**
 * 프로그램 담당자 권한 설정 — 시안 기준 5열 정적 권한표 (조회 전용, 체크박스 비활성)
 * 권한 매트릭스 API·역할 옵션 API를 호출하지 않는다.
 */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { CmsCheckbox } from '@/shared/ui'
import type {
  ProgramManagerPermissionFlags,
  ProgramManagerPermissionRoleTab,
} from '@/types/program-manager-permission-settings-ui'
import { PROGRAM_MANAGER_PERMISSION_ROLE_TABS } from '@/types/program-manager-permission-settings-ui'
import {
  PROGRAM_MANAGER_PERMISSION_CATEGORIES,
  PROGRAM_MANAGER_PERMISSION_ROLE_LABELS,
  createInitialProgramManagerPermissionsByRole,
  isValidProgramManagerRoleTab,
} from './program-manager-permission-settings-ui-data'
import './permission-customization-page.css'

interface CategoryCardsProps {
  flags: ProgramManagerPermissionFlags
}

function CategoryCards({ flags }: CategoryCardsProps) {
  const isItemChecked = (itemId: string) => flags[itemId] ?? false

  return (
    <div className="permission-customization-page__grid">
      {PROGRAM_MANAGER_PERMISSION_CATEGORIES.map(category => {
        const values = category.items.map(item => isItemChecked(item.id))
        const allChecked = values.length > 0 && values.every(Boolean)
        const noneChecked = values.every(v => !v)
        const indeterminate = !allChecked && !noneChecked
        return (
          <div key={category.id} className="permission-customization-page__category-card">
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

export default function ProgramManagerPermissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [permissionsByRole] = useState(createInitialProgramManagerPermissionsByRole)

  const activeRole = useMemo((): ProgramManagerPermissionRoleTab => {
    const r = searchParams.get('role')
    return isValidProgramManagerRoleTab(r) ? r : 'owner'
  }, [searchParams])

  useEffect(() => {
    if (!searchParams.get('role')) {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('role', 'owner')
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
    <div className="permission-customization-page">
      <CmsTextTabs
        className="permission-customization-page__tabs"
        variant="list"
        activeKey={activeRole}
        onChange={handleTabChange}
        items={PROGRAM_MANAGER_PERMISSION_ROLE_TABS.map(tab => ({
          key: tab,
          label: PROGRAM_MANAGER_PERMISSION_ROLE_LABELS[tab],
        }))}
      />

      <CategoryCards flags={permissionsByRole[activeRole]} />
    </div>
  )
}
