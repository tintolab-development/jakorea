/**
 * Empty State 컴포넌트
 * 공통 UI 원칙: 명확한 안내, 안정적인 어조
 */

import { Empty } from 'antd'
import { SingleCTA } from './single-cta'

interface EmptyStateProps {
  description: string
  image?: React.ReactNode
  cta?: {
    label: string
    targetUrl?: string
    onClick?: () => void
    type?: 'primary' | 'default'
  }
}

export function EmptyState({ description, image, cta }: EmptyStateProps) {
  return (
    <Empty
      description={description}
      image={image || Empty.PRESENTED_IMAGE_SIMPLE}
      imageStyle={{ height: 60 }}
    >
      {cta && (
        <SingleCTA
          label={cta.label}
          targetUrl={cta.targetUrl}
          onClick={cta.onClick}
          type={cta.type}
        />
      )}
    </Empty>
  )
}

