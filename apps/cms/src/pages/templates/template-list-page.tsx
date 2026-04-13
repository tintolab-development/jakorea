/**
 * 템플릿 관리 - 템플릿 목록 페이지
 * Phase: 관리자 페이지 카테고리 정리 및 뎁스 변경
 */

import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { Tabs } from 'antd'
import TemplateFormTab from './template-form-tab'
import { IssuanceFormTab } from './issuance-form-tab'
import { TemplateCreateModal } from '@/features/template/ui/modal/template-create-modal'
import './template-list-page.css'
import './template-form-tab.css'
import { CmsButton } from '@/shared/ui'

const FORM_MANAGEMENT_BASE = '/templates/form-management'

type FormManagementQuery = {
  tab?: string
  mode?: string
  type?: string
  id?: string
}
// const KAKAO_NOTIFICATION = '/templates/kakao-notification'
// const EMAIL_MANAGEMENT = '/templates/email-management'

export function TemplateListPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { params, setParams } = useQueryParams<FormManagementQuery>()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const formTabItems = useMemo(
    () => [
      { key: 'template-form', label: '작성 양식', path: FORM_MANAGEMENT_BASE },
      { key: 'issuance-form', label: '발급 양식', path: FORM_MANAGEMENT_BASE },
    ],
    []
  )

  const isFormManagementSection = location.pathname.startsWith(FORM_MANAGEMENT_BASE)
  const activeFormTabFromPath = 'template-form'

  const tabParam = params.tab
  const activeKey = tabParam || activeFormTabFromPath

  useEffect(() => {
    if (!isFormManagementSection) return

    const validKeys = new Set(formTabItems.map(t => t.key))
    const next = tabParam && validKeys.has(tabParam) ? tabParam : activeFormTabFromPath
    if (tabParam !== next) {
      setParams({
        tab: next,
      })
    }
  }, [
    activeFormTabFromPath,
    params.tab,
    setParams,
    formTabItems,
    tabParam,
    isFormManagementSection,
  ])

  const handleFormTabChange = (key: string) => {
    const updates: Partial<FormManagementQuery> = { tab: key }
    if (key !== 'template-form') {
      updates.mode = undefined
      updates.type = undefined
      updates.id = undefined
    }
    setParams(updates)

    const target = formTabItems.find(t => t.key === key)?.path || FORM_MANAGEMENT_BASE
    if (location.pathname !== target) {
      navigate(target, { replace: true })
    }
  }

  return (
    <>
      {isFormManagementSection && (
        <>
          <Tabs
            className="template-list-page__tabs"
            activeKey={activeKey}
            onChange={handleFormTabChange}
            items={formTabItems.map(t => ({ key: t.key, label: t.label }))}
            tabBarExtraContent={
              activeKey === 'template-form' ? (
                <CmsButton type="button" onClick={() => setCreateModalOpen(true)}>
                  + 신규 템플릿
                </CmsButton>
              ) : null
            }
            style={{ marginBottom: 20 }}
          />
          <TemplateCreateModal
            open={createModalOpen}
            onCancel={() => setCreateModalOpen(false)}
            onDirectRegister={target => {
              setCreateModalOpen(false)
              setParams({
                tab: 'template-form',
                mode: 'new',
                type: target,
                id: undefined,
              })
            }}
            onDuplicateSuccess={newTemplateId => {
              setCreateModalOpen(false)
              setParams({
                mode: 'edit',
                id: newTemplateId,
                type: undefined,
              })
            }}
          />
        </>
      )}
      {isFormManagementSection ? (
        activeKey === 'issuance-form' ? (
          <IssuanceFormTab />
        ) : (
          <TemplateFormTab />
        )
      ) : (
        <div />
      )}
    </>
  )
}
