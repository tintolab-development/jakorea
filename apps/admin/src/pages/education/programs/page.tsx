/**
 * 프로그램 소개 — 진로·취업 / 경제·금융 / 디지털 리터러시 탭
 */

import { useCallback, useMemo, useState } from 'react'
import { Spin } from 'antd'
import { useSearchParams } from 'react-router-dom'
import type { ProgramIntroCategoryKey } from '@/entities/education-program-intro/model/types'
import { useProgramIntroCategory } from '@/features/education-program-intro/api/hooks'
import { educationProgramIntroQueryKeys } from '@/features/education-program-intro/api/query-keys'
import { EDUCATION_PROGRAM_INTRO_CHANGED_EVENT } from '@/features/education-program-intro/api/store'
import { ProgramIntroFormCard } from '@/features/education-program-intro/ui/form-card'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { CmsTextTabs } from '@/shared/ui'

import './page.css'

const TAB_ITEMS = [
  { key: 'career' as const, label: '진로·취업' },
  { key: 'economy' as const, label: '경제·금융' },
  { key: 'digital' as const, label: '디지털 리터러시' },
]

function parseTab(raw: string | null): ProgramIntroCategoryKey {
  if (raw === 'economy' || raw === 'digital') return raw
  return 'career'
}

function ProgramIntroCategoryPanel({
  categoryKey,
  onEditingChange,
}: {
  categoryKey: ProgramIntroCategoryKey
  onEditingChange: (isEditing: boolean) => void
}) {
  const docQuery = useProgramIntroCategory(categoryKey)

  useInvalidateOnWindowEvent(
    EDUCATION_PROGRAM_INTRO_CHANGED_EVENT,
    educationProgramIntroQueryKeys.all
  )

  if (docQuery.isLoading) {
    return (
      <div className="page-content-loading page-content-loading--viewport" role="status">
        <Spin size="large" />
      </div>
    )
  }

  if (!docQuery.data) {
    return (
      <div className="program-intro-page__empty" role="status">
        프로그램 소개 정보를 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <ProgramIntroFormCard data={docQuery.data} onEditingChange={onEditingChange} />
  )
}

export function EducationProgramsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = useMemo(() => parseTab(searchParams.get('tab')), [searchParams])
  const [isEditing, setIsEditing] = useState(false)

  const handleTabChange = useCallback(
    (key: ProgramIntroCategoryKey) => {
      if (isEditing) return
      setIsEditing(false)
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev.toString())
          if (key === 'career') {
            next.delete('tab')
          } else {
            next.set('tab', key)
          }
          return next
        },
        { replace: true }
      )
    },
    [isEditing, setSearchParams]
  )

  const tabItems = useMemo(
    () =>
      TAB_ITEMS.map(item => ({
        ...item,
        disabled: isEditing,
      })),
    [isEditing]
  )

  return (
    <div className="program-intro-page">
      <CmsTextTabs
        variant="list"
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        ariaLabel="프로그램 소개 분야 탭"
        className="program-intro-page__tabs"
      />
      <ProgramIntroCategoryPanel
        key={activeTab}
        categoryKey={activeTab}
        onEditingChange={setIsEditing}
      />
    </div>
  )
}
