import { buildAdminRegisterReviewItems } from '@/features/auth/lib/build-admin-register-review'
import type { AdminRegisterWizardData } from '@/types/admin-register'

import { RegisterReviewSummaryRow } from './register-review-summary-row'

interface RegisterReviewSummaryProps {
  formData: AdminRegisterWizardData
}

export function RegisterReviewSummary({ formData }: RegisterReviewSummaryProps) {
  const items = buildAdminRegisterReviewItems(formData)

  return (
    <div className="register-review-summary">
      {items.map(item => (
        <RegisterReviewSummaryRow key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  )
}
