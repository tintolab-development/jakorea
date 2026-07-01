import type { ReactNode } from 'react'
import { PFText } from '@/shared/ui'

type StepHeaderProps = {
  title: ReactNode
  description?: ReactNode
  titleClassName?: string
  descriptionClassName?: string
}

export function StepHeader({
  title,
  description,
  titleClassName,
  descriptionClassName,
}: StepHeaderProps) {
  return (
    <>
      <PFText as="div" typo="hd-sm" color="black" className={titleClassName}>
        {title}
      </PFText>
      {description ? (
        <PFText as="p" typo="bd-lg-rg" color="primary-800" className={descriptionClassName}>
          {description}
        </PFText>
      ) : null}
    </>
  )
}
