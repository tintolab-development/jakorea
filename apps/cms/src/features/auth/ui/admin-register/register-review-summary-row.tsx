interface RegisterReviewSummaryRowProps {
  label: string
  value: string
}

export function RegisterReviewSummaryRow({ label, value }: RegisterReviewSummaryRowProps) {
  return (
    <div className="register-review-summary__row">
      <div className="register-review-summary__label-wrap">
        <span className="register-review-summary__label">{label}</span>
      </div>
      <span className="register-review-summary__value">{value}</span>
    </div>
  )
}
