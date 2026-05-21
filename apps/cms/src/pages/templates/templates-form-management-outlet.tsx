/**
 * `/templates/form-management` 전용 — 라우터 `<Outlet />`과 동기화.
 * `TemplateWritingPreviewProvider`는 상위 `TemplatesRouteLayout`에서 한 번만 감싼다.
 */
import type { ReactElement } from 'react'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import TemplateFormTab from './template-form-tab'
import { IssuanceFormTab } from './issuance-form-tab'
import { FormTab } from './form-tab'

type FormManagementQuery = {
  tab?: string
}

export default function TemplatesFormManagementOutlet() {
  const { params } = useQueryParams<FormManagementQuery>()
  const tab = params.tab

  let content: ReactElement
  if (tab === 'issuance-form') {
    content = <IssuanceFormTab />
  } else if (tab === 'form-test') {
    content = <FormTab />
  } else {
    content = <TemplateFormTab />
  }
  return content
}
