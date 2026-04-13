/**
 * 템플릿 관리 - 템플릿 목록 페이지
 * Phase: 관리자 페이지 카테고리 정리 및 뎁스 변경
 */

import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { Tabs } from 'antd'
import TemplateFormTab from './template-form-tab'
import { FormTab } from './form-tab'
import { IssuanceFormTab } from './issuance-form-tab'
import './template-list-page.css'
import './template-form-tab.css'
import { CmsButton } from '@/shared/ui'

const FORM_MANAGEMENT_BASE = '/templates/form-management'
// const KAKAO_NOTIFICATION = '/templates/kakao-notification'
// const EMAIL_MANAGEMENT = '/templates/email-management'

export function TemplateListPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { params, setParams } = useQueryParams<{ tab?: string }>()

  const formTabItems = useMemo(
    () => [
      { key: 'template-form', label: '작성 양식', path: FORM_MANAGEMENT_BASE },
      { key: 'issuance-form', label: '발급 양식', path: FORM_MANAGEMENT_BASE },
      { key: 'form-test', label: '양식 테스트', path: FORM_MANAGEMENT_BASE },
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
    setParams({
      tab: key,
    })

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
              activeKey === 'form-test' ? null : <CmsButton>+ 신규 템플릿</CmsButton>
            }
            style={{ marginBottom: 20 }}
          />
        </>
      )}
      {isFormManagementSection ? (
        activeKey === 'issuance-form' ? (
          <IssuanceFormTab />
        ) : activeKey === 'form-test' ? (
          <FormTab />
        ) : (
          <TemplateFormTab />
        )
      ) : (
        <div />
      )}
    </>
  )
}
