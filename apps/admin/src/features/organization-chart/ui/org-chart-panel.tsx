/**
 * 조직도 관리 패널 — 조회 카드 + 수정 모달
 */

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { OrganizationChartSaveInput } from '@/entities/organization-chart/model/types'
import {
  useOrganizationChart,
  useSaveOrganizationChart,
} from '@/features/organization-chart/api/hooks'
import { organizationChartQueryKeys } from '@/features/organization-chart/api/query-keys'
import { ORGANIZATION_CHART_CHANGED_EVENT } from '@/features/organization-chart/api/store'
import { OrgChartFormModal } from '@/features/organization-chart/ui/org-chart-form-modal'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { CmsButton, PageContentLoading, useCmsAlert } from '@/shared/ui'

import './org-chart-panel.css'

export function OrganizationChartPanel() {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const chartQuery = useOrganizationChart()
  const saveMutation = useSaveOrganizationChart()
  const [modalOpen, setModalOpen] = useState(false)

  useInvalidateOnWindowEvent(
    ORGANIZATION_CHART_CHANGED_EVENT,
    organizationChartQueryKeys.all
  )

  const data = chartQuery.data

  const handleOpenEdit = useCallback(() => {
    setModalOpen(true)
  }, [])

  const handleCancel = useCallback(() => {
    setModalOpen(false)
  }, [])

  const handleSubmit = useCallback(
    async (values: OrganizationChartSaveInput) => {
      try {
        await saveMutation.mutateAsync(values)
        setModalOpen(false)
      } catch {
        showAlert({
          title: '저장 실패',
          content: '조직도 정보 저장에 실패했습니다. 다시 시도해 주세요.',
        })
        void queryClient.invalidateQueries({
          queryKey: organizationChartQueryKeys.all,
        })
      }
    },
    [queryClient, saveMutation, showAlert]
  )

  if (chartQuery.isLoading) {
    return (
      <div className="org-chart-panel">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="org-chart-panel">
        <div className="admin-list-card page-content-error" role="alert">
          콘텐츠를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="org-chart-panel">
      <div className="admin-list-card org-chart-card">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">조직도 관리</span>
          </div>
          <div className="table-header-actions--wrapper">
            <CmsButton
              variant="primary"
              size="large"
              type="button"
              onClick={handleOpenEdit}
            >
              수정
            </CmsButton>
          </div>
        </div>

        <div className="org-chart-card__body">
          <DetailInfoForm
            title="조직도 관리"
            hideHeader
            mode="view"
            className="org-chart-card__form"
          >
            <DetailInfoForm.Row type="single" className="org-chart-card__row--fixed">
              <DetailInfoForm.Field
                label="메인"
                view={<span>{data.mainTitle || '-'}</span>}
                edit={null}
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single" className="org-chart-card__row--image">
              <DetailInfoForm.Field
                label="조직도"
                view={
                  data.imageUrl ? (
                    <div className="org-chart-preview">
                      <img src={data.imageUrl} alt="조직도" />
                    </div>
                  ) : (
                    <div className="org-chart-preview org-chart-preview--empty">
                      등록된 조직도 이미지가 없습니다.
                    </div>
                  )
                }
                edit={null}
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </div>
      </div>

      <OrgChartFormModal
        open={modalOpen}
        initial={data}
        confirmLoading={saveMutation.isPending}
        onCancel={handleCancel}
        onSubmit={values => {
          void handleSubmit(values)
        }}
      />
    </div>
  )
}
