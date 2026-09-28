/**
 * 운영원칙 관리 (투명경영)
 */

import { useOperatingPrinciples } from '@/features/operating-principles/api/hooks'
import { PrinciplesFormCard } from '@/features/operating-principles/ui/principles-form-card'
import { PageContentLoading } from '@/shared/ui'

import './page.css'

export function PrinciplesPage() {
  const query = useOperatingPrinciples()

  const data = query.data

  if (query.isLoading) {
    return (
      <div className="principles-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="principles-page">
        <div className="admin-list-card page-content-error" role="alert">
          콘텐츠를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="principles-page">
      <PrinciplesFormCard data={data} />
    </div>
  )
}
