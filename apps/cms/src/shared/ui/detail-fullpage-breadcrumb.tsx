import { useNavigateToAncestor } from '@/shared/hooks/use-history-ancestor-navigation'
import { ButtonRightIcon } from './icons'

export type DetailFullpageBreadcrumbTarget = {
  pathname: string
  search?: string
}

export type DetailFullpageBreadcrumbItem = {
  label: string
  /** 상위 단계 URL — 클릭 시 지나온 history 엔트리면 뒤로, 아니면 replace (push 하지 않음) */
  to?: DetailFullpageBreadcrumbTarget
  /** `to`보다 우선 — 풀페이지 상세 닫기 등 라우터 밖 동작 */
  onClick?: () => void
}

interface DetailFullpageBreadcrumbProps {
  items: DetailFullpageBreadcrumbItem[]
  className?: string
}

/** 시안 GNB / Breadcrumb: Icon / Button / w20 right (disabled 색) */
function DetailFullpageBreadcrumbSeparator() {
  return (
    <span className="detail-fullpage-breadcrumb__separator" aria-hidden="true">
      <ButtonRightIcon className="detail-fullpage-breadcrumb__separator-icon" />
    </span>
  )
}

export function DetailFullpageBreadcrumb({
  items,
  className,
}: DetailFullpageBreadcrumbProps) {
  const { toTarget } = useNavigateToAncestor()

  if (items.length <= 1) return null

  return (
    <nav
      className={['detail-fullpage-breadcrumb', className].filter(Boolean).join(' ')}
      aria-label="풀페이지 상세 경로"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const content =
          item.onClick && !isLast ? (
            <button
              type="button"
              className="detail-fullpage-breadcrumb__button"
              onClick={item.onClick}
              title={item.label}
            >
              {item.label}
            </button>
          ) : item.to && !isLast ? (
            <button
              type="button"
              className="detail-fullpage-breadcrumb__button"
              onClick={() => toTarget(item.to!)}
              title={item.label}
            >
              {item.label}
            </button>
          ) : (
            <span
              className={[
                'detail-fullpage-breadcrumb__text',
                isLast && 'detail-fullpage-breadcrumb__text--current',
              ]
                .filter(Boolean)
                .join(' ')}
              title={item.label}
            >
              {item.label}
            </span>
          )

        return (
          <span className="detail-fullpage-breadcrumb__item" key={`${item.label}-${index}`}>
            {content}
            {!isLast ? <DetailFullpageBreadcrumbSeparator /> : null}
          </span>
        )
      })}
    </nav>
  )
}
