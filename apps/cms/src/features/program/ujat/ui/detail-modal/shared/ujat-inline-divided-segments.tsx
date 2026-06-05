import { Fragment, type ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import './ujat-inline-divided-segments.css'

function isEmptySegment(segment: ReactNode): boolean {
  if (segment == null || segment === false) return true
  if (typeof segment === 'string') {
    const trimmed = segment.trim()
    return trimmed === '' || trimmed === '-'
  }
  return false
}

export function UjatInlineDividedSegments({ segments }: { segments: ReactNode[] }) {
  const filtered = segments.filter(segment => !isEmptySegment(segment))
  if (filtered.length === 0) return <>-</>
  if (filtered.length === 1) return <>{filtered[0]}</>

  return (
    <span className="ujat-inline-divided-segments">
      {filtered.map((segment, index) => (
        <Fragment key={index}>
          {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
          {typeof segment === 'string' ? <span>{segment}</span> : segment}
        </Fragment>
      ))}
    </span>
  )
}
