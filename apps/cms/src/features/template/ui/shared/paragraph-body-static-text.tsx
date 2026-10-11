import './paragraph-body-static-text.css'

/** 단락 authoring 비선택 등 — 피커·disabled 스킨 없이 placeholder/값만 표시 */
export function ParagraphBodyStaticText({
  value,
  placeholder,
}: {
  value?: string | null
  placeholder: string
}) {
  const filled = (value ?? '').trim().length > 0
  return (
    <span
      className={[
        'paragraph-body-static-text',
        !filled ? 'paragraph-body-static-text--placeholder' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {filled ? value : placeholder}
    </span>
  )
}
