import { useNavigate } from 'react-router-dom'

export type DetailFullpageBreadcrumbTarget = {
  pathname: string
  search?: string
}

export type DetailFullpageBreadcrumbItem = {
  label: string
  to?: DetailFullpageBreadcrumbTarget
  /** `to`보다 우선 — 풀페이지 상세 닫기 등 라우터 밖 동작 */
  onClick?: () => void
}

interface DetailFullpageBreadcrumbProps {
  items: DetailFullpageBreadcrumbItem[]
  className?: string
}

function DetailFullpageBreadcrumbSeparator() {
  return (
    <span className="detail-fullpage-breadcrumb__separator" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="6" height="9" viewBox="0 0 6 9" fill="none">
        <path
          d="M3.57542 4.45354L0.181042 1.05938C0.0657639 0.943959 0.00673616 0.798889 0.00395838 0.624167C0.0013195 0.449584 0.0603473 0.301875 0.181042 0.181042C0.301875 0.0603473 0.448264 0 0.620208 0C0.792153 0 0.938541 0.0603473 1.05937 0.181042L4.80458 3.92625C4.8825 4.00431 4.9375 4.0866 4.96958 4.17313C5.00167 4.25965 5.01771 4.35313 5.01771 4.45354C5.01771 4.55396 5.00167 4.64743 4.96958 4.73396C4.9375 4.82049 4.8825 4.90278 4.80458 4.98083L1.05937 8.72604C0.943958 8.84132 0.798889 8.90035 0.624166 8.90313C0.449583 8.90576 0.301875 8.84674 0.181042 8.72604C0.0603473 8.60521 0 8.45882 0 8.28688C0 8.11493 0.0603473 7.96854 0.181042 7.84771L3.57542 4.45354Z"
          fill="currentColor"
        />
      </svg>
    </span>
  )
}

export function DetailFullpageBreadcrumb({
  items,
  className,
}: DetailFullpageBreadcrumbProps) {
  const navigate = useNavigate()

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
              onClick={() => navigate(item.to!, { replace: false })}
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
