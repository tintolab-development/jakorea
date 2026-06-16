import { createPortal } from 'react-dom'
import './survey-share-copy-toast.css'

export type SurveyShareCopyToastProps = {
  open: boolean
  line1: string
  line2: string
}

export function SurveyShareCopyToast({ open, line1, line2 }: SurveyShareCopyToastProps) {
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="survey-share-copy-toast" role="status" aria-live="polite">
      <p className="survey-share-copy-toast__line">{line1}</p>
      <p className="survey-share-copy-toast__line">{line2}</p>
    </div>,
    document.body
  )
}
