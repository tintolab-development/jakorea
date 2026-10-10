import { CmsButton } from './cms-button'
import { ContentModal } from './content-modal'

const DEFAULT_Z = 1100
const WIDTH = 600

export type DeleteBlockedGuideModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description: string
  zIndex?: number
  className?: string
}

export function DeleteBlockedGuideModal({
  open,
  onClose,
  title,
  description,
  zIndex = DEFAULT_Z,
  className,
}: DeleteBlockedGuideModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={title}
      width={WIDTH}
      zIndex={zIndex}
      className={className}
      description={description}
      footer={
        <CmsButton variant="secondary" size="h40" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
