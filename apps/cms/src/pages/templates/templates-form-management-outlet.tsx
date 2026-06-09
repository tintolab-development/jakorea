/**
 * `/templates/form-management` 전용 — 라우터 `<Outlet />`과 동기화.
 * `TemplateWritingPreviewProvider`는 lazy `TemplateListPage`의 Outlet 래퍼와
 * 이 outlet(동기 import) 양쪽에 둔다 — RR7에서 layout lazy 전 leaf가 먼저 마운트될 때 대비.
 */
import type { ReactElement } from 'react'
import { TemplateWritingPreviewProvider } from '@/features/template/context/template-writing-preview-context'
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
  return <TemplateWritingPreviewProvider>{content}</TemplateWritingPreviewProvider>
}
