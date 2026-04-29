/**
 * 템플릿 관리 - 템플릿 목록 페이지
 * Phase: 관리자 페이지 카테고리 정리 및 뎁스 변경
 */

import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { Tabs } from 'antd'
import TemplateFormTab from './template-form-tab'
import { FormTab } from './form-tab'
import { IssuanceFormTab } from './issuance-form-tab'
import { TemplateWritingPreviewProvider } from '@/features/template/context/template-writing-preview-context'
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
      { key: 'form-test', label: '양식 테스트', path: FORM_MANAGEMENT_BASE },
    ],
    []
  )

  const isFormManagementSection = location.pathname.startsWith(FORM_MANAGEMENT_BASE)
  const isFormTestTablePath = location.pathname.startsWith('/templates/form-test/')
  const showFormTopTabs = isFormManagementSection || isFormTestTablePath
  const activeFormTabFromPath = 'template-form'

  const tabParam = params.tab
  const activeKey = isFormTestTablePath
    ? 'form-test'
    : tabParam || activeFormTabFromPath

  useEffect(() => {
    if (isFormTestTablePath) {
      if (tabParam !== 'form-test') {
        setParams({ tab: 'form-test' })
      }
      return
    }
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
    isFormTestTablePath,
  ])

  const handleFormTabChange = (key: string) => {
    if (isFormTestTablePath) {
      const sp = new URLSearchParams()
      sp.set('tab', key)
      navigate(`${FORM_MANAGEMENT_BASE}?${sp.toString()}`, { replace: true })
      return
    }
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
    <TemplateWritingPreviewProvider>
      <>
      {showFormTopTabs && (
        <>
          <Tabs
            className="template-list-page__tabs"
            activeKey={activeKey}
            onChange={handleFormTabChange}
            items={formTabItems.map(t => ({ key: t.key, label: t.label }))}
            tabBarExtraContent={
              isFormManagementSection && activeKey === 'template-form' ? (
                <CmsButton type="button" onClick={() => setCreateModalOpen(true)}>
                  + 신규 템플릿
                </CmsButton>
              ) : null
            }
            style={{ marginBottom: 20 }}
          />
          {isFormManagementSection && (
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
          )}
        </>
      )}
      {isFormTestTablePath ? (
        <Outlet />
      ) : isFormManagementSection ? (
        activeKey === 'issuance-form' ? (
          <IssuanceFormTab />
        ) : activeKey === 'form-test' ? (
          <FormTab />
        ) : (
          <TemplateFormTab />
        )
      ) : (
        <Outlet />
      )}
      </>
    </TemplateWritingPreviewProvider>
  )
}
