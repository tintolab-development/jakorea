/**
 * 교육 대상 인덱스 색상 원형 (20×20)
 */

export function IndexColorDot({
  color,
  size = 20,
  label,
}: {
  color: string
  size?: number
  label?: string
}) {
  return (
    <span
      role="img"
      aria-label={label ?? `색상 ${color}`}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  )
}
