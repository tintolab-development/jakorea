import { useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { JaHistoryHero } from '@/entities/ja-history/model/types'
import { useSaveJaHistoryHero } from '@/features/ja-history/api/hooks'
import { showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { HistoryCopy, MediaPreview, SectionFrame, jaHistorySaveAlert } from './chrome'
import { HeroFormModal } from './hero-form-modal'

type HeroRow = { key: 'hero' }

export function HeroSection({ hero }: { hero: JaHistoryHero }) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveJaHistoryHero()
  const [open, setOpen] = useState(false)

  const columns = useMemo<ColumnsType<HeroRow>>(
    () => [
      {
        title: '배너 이미지',
        key: 'image',
        width: 240,
        align: 'center',
        render: () => <MediaPreview media={hero.image} size="hero" />,
      },
      {
        title: '메인 텍스트',
        key: 'mainText',
        align: 'center',
        ellipsis: false,
        render: () => <HistoryCopy value={hero.mainText} align="center" />,
      },
    ],
    [hero.image, hero.mainText]
  )

  return (
    <>
      <SectionFrame title="히어로 배너" marker={false} onEdit={() => setOpen(true)}>
        <CmsDataTable<HeroRow>
          className="cms-data-table cms-data-table--skip-auto-no-col ja-history-table"
          columns={columns}
          dataSource={[{ key: 'hero' }]}
          pagination={false}
          rowKey="key"
        />
      </SectionFrame>
      <HeroFormModal
        open={open}
        initial={hero}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setOpen(false)}
        onSubmit={values => {
          void saveMutation.mutateAsync(values).then(
            () => {
              setOpen(false)
              showSaveCompletedAlert()
            },
            error => {
              showAlert(jaHistorySaveAlert(error, '히어로 배너 저장에 실패했습니다. 다시 시도해 주세요.'))
            },
          )
        }}
      />
    </>
  )
}
