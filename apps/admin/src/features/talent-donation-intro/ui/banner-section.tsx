/**
 * 재능기부 소개 — 상단 배너 섹션 (조회 테이블 + 수정 모달)
 */

import { useCallback, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  BannerSaveInput,
  TalentDonationBanner,
} from '@/entities/talent-donation-intro/model/types'
import { useSaveBanner } from '@/features/talent-donation-intro/api/hooks'
import { talentDonationIntroSaveFailureAlert } from '@/features/talent-donation-intro/lib/save-failure-alert'
import { BannerFormModal } from '@/features/talent-donation-intro/ui/banner-form-modal'
import { CmsButton, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type Row = TalentDonationBanner & { key: string }

type Props = {
  banner: TalentDonationBanner
}

export function BannerSectionCard({ banner }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveBanner()
  const [modalOpen, setModalOpen] = useState(false)

  const rows = useMemo<Row[]>(
    () => [{ key: 'banner', ...banner }],
    [banner]
  )

  const columns = useMemo<ColumnsType<Row>>(
    () => [
      {
        title: '배너 이미지',
        key: 'image',
        width: 200,
        align: 'center',
        className: 'talent-intro-col--image',
        render: (_value, record) =>
          record.imageUrl ? (
            <div className="talent-intro-thumb">
              <img src={record.imageUrl} alt="상단 배너" />
            </div>
          ) : (
            <div className="talent-intro-thumb talent-intro-thumb--empty">없음</div>
          ),
      },
      {
        title: '메인 텍스트',
        key: 'mainText',
        align: 'center',
        className: 'talent-intro-col--text',
        render: (_value, record) => (
          <span className="talent-intro-preline">{record.mainText || '-'}</span>
        ),
      },
      {
        title: '서브 텍스트',
        key: 'subText',
        align: 'center',
        className: 'talent-intro-col--text',
        render: (_value, record) => (
          <span className="talent-intro-preline">{record.subText || '-'}</span>
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
          talentDonationIntroSaveFailureAlert(
            err,
            '상단 배너 저장에 실패했습니다. 다시 시도해 주세요.'
          )
        )
      }
    },
    [saveMutation, showAlert]
  )

  return (
    <div className="talent-intro-section">
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
        className="cms-data-table cms-data-table--skip-auto-no-col talent-intro-banner-table"
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
