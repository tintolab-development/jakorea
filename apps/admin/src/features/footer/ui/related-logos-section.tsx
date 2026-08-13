/**
 * 푸터 — 유관기관 로고 배너
 */

import { useCallback, useMemo, useState } from 'react'
import { Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FooterRelatedLogo } from '@/entities/footer/model/types'
import {
  useFooterRelatedLogosList,
  useReorderFooterRelatedLogos,
  useSaveFooterRelatedLogo,
  useSetFooterRelatedLogoActive,
} from '@/features/footer/api/hooks'
import {
  RelatedLogoFormModal,
  type RelatedLogoFormValues,
} from '@/features/footer/ui/related-logo-form-modal'
import { FooterDragHandle, FooterSortableTable } from '@/features/footer/ui/sortable-table'
import {
  CMS_TABLE_NO_COL_CLASS,
  CMS_TABLE_SORT_COL_CLASS,
  CMS_TABLE_USAGE_COL_CLASS,
  TABLE_COLUMN_WIDTHS,
} from '@/shared/constants/table'
import { CmsButton, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

/** 수정 버튼 88 + 좌우 패딩 (TABLE_COLUMN_WIDTHS.action=72 로는 부족) */
const RELATED_LOGO_ACTION_COL_WIDTH = 120

const EMPTY_NAME = '등록된 기관 로고가 없습니다'

export function FooterRelatedLogosSection() {
  const { showAlert } = useCmsAlert()
  const listQuery = useFooterRelatedLogosList()
  const reorderMutation = useReorderFooterRelatedLogos()
  const setActiveMutation = useSetFooterRelatedLogoActive()
  const saveMutation = useSaveFooterRelatedLogo()

  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data])
  const [editing, setEditing] = useState<FooterRelatedLogo | null>(null)

  const handleRowsReorder = useCallback(
    (reordered: FooterRelatedLogo[]) => {
      void reorderMutation.mutateAsync(reordered.map(r => r.id)).catch(() => {
        showAlert({
          title: '순서 변경 실패',
          content: '로고 배너 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, reorderMutation, showAlert]
  )

  const handleToggleActive = useCallback(
    (id: string, isActive: boolean) => {
      void setActiveMutation.mutateAsync({ id, isActive }).catch(() => {
        showAlert({
          title: '사용 여부 변경 실패',
          content: '사용 여부 변경에 실패했습니다. 다시 시도해 주세요.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, setActiveMutation, showAlert]
  )

  const handleSubmit = useCallback(
    async (values: RelatedLogoFormValues) => {
      if (!editing) return
      try {
        await saveMutation.mutateAsync({
          id: editing.id,
          isActive: values.isActive,
          name: values.name,
          logoUrl: values.logoUrl,
          logoFileName: values.logoFileName,
          logoAssetId: values.logoAssetId,
          logoFile: values.logoFile,
        })
        setEditing(null)
      } catch {
        showAlert({
          title: '저장 실패',
          content: '유관기관 로고 저장에 실패했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [editing, saveMutation, showAlert]
  )

  const columns = useMemo<ColumnsType<FooterRelatedLogo>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: TABLE_COLUMN_WIDTHS.sort,
        className: CMS_TABLE_SORT_COL_CLASS,
        align: 'center',
        render: () => <FooterDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_v, _r, index) => index + 1,
      },
      {
        title: '사용 여부',
        key: 'isActive',
        width: TABLE_COLUMN_WIDTHS.usage,
        align: 'center',
        className: CMS_TABLE_USAGE_COL_CLASS,
        render: (_v, record) => (
          <Switch
            checked={record.isActive}
            onChange={checked => handleToggleActive(record.id, checked)}
            aria-label={`${record.name || '유관기관'} 사용 여부`}
          />
        ),
      },
      {
        title: '로고',
        key: 'logo',
        width: 220,
        align: 'center',
        render: (_v, record) =>
          record.hasContent && record.logoUrl ? (
            <div className="footer-section__thumb">
              <img src={record.logoUrl} alt="" />
            </div>
          ) : (
            <div className="footer-section__thumb footer-section__thumb--empty" aria-hidden>
              —
            </div>
          ),
      },
      {
        title: '기관명',
        key: 'name',
        align: 'center',
        ellipsis: true,
        render: (_v, record) =>
          record.hasContent && record.name ? (
            <span>{record.name}</span>
          ) : (
            <span className="footer-section__empty-name">{EMPTY_NAME}</span>
          ),
      },
      {
        title: '관리',
        key: 'action',
        /* 수정 버튼 88 + 좌우 패딩 여유 (TABLE_COLUMN_WIDTHS.action=72 는 부족) */
        width: RELATED_LOGO_ACTION_COL_WIDTH,
        align: 'center',
        render: (_v, record) => (
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            width={88}
            onClick={() => setEditing(record)}
          >
            수정
          </CmsButton>
        ),
      },
    ],
    [handleToggleActive]
  )

  return (
    <>
      <section className="footer-section footer-related-logos-section">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">유관기관 로고 배너</span>
            <span className="table-description">
              기관명은 홈페이지에 미노출됩니다.
            </span>
          </div>
        </div>
        <div className="footer-section__table-scroll">
          <FooterSortableTable
            className="footer-related-logos-table"
            rows={rows}
            columns={columns}
            loading={listQuery.isLoading}
            onRowsReorder={handleRowsReorder}
          />
        </div>
      </section>

      <RelatedLogoFormModal
        open={Boolean(editing)}
        initial={editing}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setEditing(null)}
        onSubmit={values => {
          void handleSubmit(values)
        }}
      />
    </>
  )
}
