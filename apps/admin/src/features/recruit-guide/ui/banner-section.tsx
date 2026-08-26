/**
 * 채용 안내 — 상단 배너 섹션 (조회 테이블 + 수정 모달)
 */

import { useCallback, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  BannerSaveInput,
  RecruitGuideBanner,
} from '@/entities/recruit-guide/model/types'
import { useSaveRecruitBanner } from '@/features/recruit-guide/api/hooks'
import { recruitGuideSaveFailureAlert } from '@/features/recruit-guide/lib/save-failure-alert'
import { BannerFormModal } from '@/features/recruit-guide/ui/banner-form-modal'
import { CmsButton, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type Row = RecruitGuideBanner & { key: string }

type Props = {
  banner: RecruitGuideBanner
}

export function BannerSectionCard({ banner }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveRecruitBanner()
  const [modalOpen, setModalOpen] = useState(false)

  const rows = useMemo<Row[]>(() => [{ key: 'banner', ...banner }], [banner])

  const columns = useMemo<ColumnsType<Row>>(
    () => [
      {
        title: '배너 이미지',
        key: 'image',
        width: 160,
        align: 'center',
        className: 'recruit-guide-col--image',
        render: (_value, record) =>
          record.imageUrl ? (
            <div className="recruit-guide-thumb">
              <img src={record.imageUrl} alt="상단 배너" />
            </div>
          ) : (
            <div className="recruit-guide-thumb recruit-guide-thumb--empty">없음</div>
          ),
      },
      {
        title: '메인 텍스트',
        key: 'mainText',
        align: 'center',
        render: (_value, record) => (
          <span className="recruit-guide-preline">{record.mainText || '-'}</span>
        ),
      },
      {
        title: '서브 텍스트 01',
        key: 'subText01',
        align: 'center',
        render: (_value, record) => (
          <span className="recruit-guide-preline">{record.subText01 || '-'}</span>
        ),
      },
      {
        title: '서브 텍스트 02',
        key: 'subText02',
        align: 'center',
        render: (_value, record) => (
          <span className="recruit-guide-preline">{record.subText02 || '-'}</span>
        ),
      },
    ],
    []
  )

  const handleSubmit = useCallback(
    async (values: BannerSaveInput) => {
      try {
        await saveMutation.mutateAsync(values)
        setModalOpen(false)
      } catch (err) {
        showAlert(
          recruitGuideSaveFailureAlert(
            err,
            '상단 배너 저장에 실패했습니다. 다시 시도해 주세요.'
          )
        )
      }
    },
    [saveMutation, showAlert]
  )

  return (
    <div className="recruit-guide-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">■ 상단 배너</span>
        </div>
        <div className="table-header-actions--wrapper">
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            onClick={() => setModalOpen(true)}
          >
            수정
          </CmsButton>
        </div>
      </div>

      <Table<Row>
        className="cms-data-table cms-data-table--skip-auto-no-col recruit-guide-banner-table"
        columns={columns}
        dataSource={rows}
        pagination={false}
        rowKey="key"
        scroll={{ x: true }}
      />

      <BannerFormModal
        open={modalOpen}
        initial={banner}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setModalOpen(false)}
        onSubmit={values => {
          void handleSubmit(values)
        }}
      />
    </div>
  )
}
