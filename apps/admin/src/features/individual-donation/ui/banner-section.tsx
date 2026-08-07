/**
 * 개인후원 — 상단 배너 섹션 (조회 테이블 + 수정 모달)
 */

import { useCallback, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  BannerSaveInput,
  IndividualDonationBanner,
} from '@/entities/individual-donation/model/types'
import { useSaveBanner } from '@/features/individual-donation/api/hooks'
import { BannerFormModal } from '@/features/individual-donation/ui/banner-form-modal'
import { CmsButton, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type Row = IndividualDonationBanner & { key: string }

type Props = {
  banner: IndividualDonationBanner
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
        className: 'individual-donation-col--image',
        render: (_value, record) =>
          record.imageUrl ? (
            <div className="individual-donation-thumb">
              <img src={record.imageUrl} alt="상단 배너" />
            </div>
          ) : (
            <div className="individual-donation-thumb individual-donation-thumb--empty">
              없음
            </div>
          ),
      },
      {
        title: '메인 텍스트',
        key: 'mainText',
        align: 'center',
        className: 'individual-donation-col--text',
        render: (_value, record) => (
          <span className="individual-donation-preline">{record.mainText || '-'}</span>
        ),
      },
      {
        title: '서브 텍스트',
        key: 'subText',
        align: 'center',
        className: 'individual-donation-col--text',
        render: (_value, record) => (
          <span className="individual-donation-preline">{record.subText || '-'}</span>
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
        const message = err instanceof Error ? err.message : ''
        if (message === 'BANNER_IMAGE_REQUIRED') {
          showAlert({ title: '입력 확인', content: '배너 이미지를 등록해 주세요.' })
          return
        }
        if (message === 'BANNER_MAIN_TEXT_REQUIRED') {
          showAlert({ title: '입력 확인', content: '메인 텍스트를 입력해 주세요.' })
          return
        }
        if (message === 'BANNER_SUB_TEXT_REQUIRED') {
          showAlert({ title: '입력 확인', content: '서브 텍스트를 입력해 주세요.' })
          return
        }
        showAlert({
          title: '저장 실패',
          content: '상단 배너 저장에 실패했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [saveMutation, showAlert]
  )

  return (
    <div className="individual-donation-section">
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
        className="cms-data-table cms-data-table--skip-auto-no-col individual-donation-banner-table"
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
