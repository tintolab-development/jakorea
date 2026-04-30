/**
 * `/templates/form-management` 전용 — 라우터 `<Outlet />`과 동기화되어
 * `TemplateWritingPreviewProvider` 안에서만 마운트되도록 한다.
 */
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

  if (tab === 'issuance-form') {
    return <IssuanceFormTab />
  }
  if (tab === 'form-test') {
    return <FormTab />
  }
  return <TemplateFormTab />
}
