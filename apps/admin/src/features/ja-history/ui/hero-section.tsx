import { useState } from 'react'
import type { JaHistoryHero } from '@/entities/ja-history/model/types'
import { useSaveJaHistoryHero } from '@/features/ja-history/api/hooks'
import { showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'
import { MediaPreview, SectionFrame, jaHistorySaveAlert } from './chrome'
import { HeroFormModal } from './hero-form-modal'

export function HeroSection({ hero }: { hero: JaHistoryHero }) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveJaHistoryHero()
  const [open, setOpen] = useState(false)

  return (
    <>
      <SectionFrame title="히어로 배너" onEdit={() => setOpen(true)}>
        <div className="ja-history-header-table ja-history-header-table--hero" role="group" aria-label="히어로 배너">
          <div className="ja-history-header-table__cell">
            <div className="ja-history-header-table__label">배너 이미지</div>
            <div className="ja-history-header-table__value">
              <MediaPreview media={hero.image} size="hero" />
            </div>
          </div>
          <div className="ja-history-header-table__cell">
            <div className="ja-history-header-table__label">메인 텍스트</div>
            <div className="ja-history-header-table__value ja-history-header-table__value--center">
              <p className="ja-history-header-table__text">{hero.mainText}</p>
            </div>
          </div>
        </div>
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
