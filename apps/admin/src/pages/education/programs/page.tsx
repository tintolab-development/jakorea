/**
 * 프로그램 소개 — 진로·취업 / 경제·금융 / 기업가 정신 / 디지털 리터러시
 */

import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ProgramIntroTabKey } from '@/entities/education-program-intro/model/types'
import { useProgramIntroCategory } from '@/features/education-program-intro/api/hooks'
import {
  PROGRAM_INTRO_TABS,
  fieldCodeForTab,
  parseProgramIntroTab,
} from '@/features/education-program-intro/lib/field-codes'
import { ProgramIntroFormCard } from '@/features/education-program-intro/ui/form-card'
import { CmsTextTabs, PageContentLoading } from '@/shared/ui'

import './page.css'

function ProgramIntroCategoryPanel({
  tab,
  onEditingChange,
}: {
  tab: ProgramIntroTabKey
  onEditingChange: (isEditing: boolean) => void
}) {
  const fieldCode = fieldCodeForTab(tab)
  const docQuery = useProgramIntroCategory(fieldCode)

  if (docQuery.isLoading) {
    return <PageContentLoading variant="viewport" />
  }

  if (!docQuery.data) {
    return (
      <div className="program-intro-page__empty" role="status">
        프로그램 소개 정보를 찾을 수 없습니다.
      </div>
    )
  }

  return <ProgramIntroFormCard data={docQuery.data} onEditingChange={onEditingChange} />
}

export function EducationProgramsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = useMemo(() => parseProgramIntroTab(searchParams.get('tab')), [searchParams])
  const [isEditing, setIsEditing] = useState(false)

  const handleTabChange = useCallback(
    (key: string) => {
      if (isEditing) return
      const next = parseProgramIntroTab(key)
      setIsEditing(false)
      setSearchParams(
        prev => {
          const params = new URLSearchParams(prev.toString())
          if (next === 'career') {
            params.delete('tab')
          } else {
            params.set('tab', next)
          }
          return params
        },
        { replace: true },
      )
    },
    [isEditing, setSearchParams],
  )

  const tabItems = useMemo(
    () =>
      PROGRAM_INTRO_TABS.map(item => ({
        key: item.key,
        label: item.label,
        disabled: isEditing,
      })),
    [isEditing],
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
        tab={activeTab}
        onEditingChange={setIsEditing}
      />
    </div>
  )
}
