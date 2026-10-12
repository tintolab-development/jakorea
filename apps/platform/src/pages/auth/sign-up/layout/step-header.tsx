import type { CSSProperties, ReactNode } from 'react'
import { PFText } from '@/shared/ui'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import styles from './step-header.module.css'

type StepHeaderProps = {
  title: ReactNode
  description?: ReactNode
}

const lineBreakStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  minWidth: 0,
  whiteSpace: 'pre-line',
}

const lineStyle: CSSProperties = {
  display: 'block',
  width: '100%',
}

function hasLineBreak(content: ReactNode): content is string {
  return typeof content === 'string' && /[\r\n]/.test(content)
}

function renderWithLineBreaks(content: ReactNode) {
  if (!hasLineBreak(content)) return content

  return content.split(/\r\n|\n|\r/).map((line, index) => (
    <span key={index} style={lineStyle}>
      {line}
    </span>
  ))
}

export function StepHeader({ title, description }: StepHeaderProps) {
  return (
    <>
      <PFText
        as="div"
        typo="hd-sm"
        color="black"
        className={authPageCopyClass('title', styles.title)}
        style={hasLineBreak(title) ? lineBreakStyle : undefined}
      >
        {renderWithLineBreaks(title)}
      </PFText>
      {description ? (
        <PFText
          as="p"
          typo="bd-lg-rg"
          color="primary-800"
          className={authPageCopyClass('description', styles.description)}
          style={hasLineBreak(description) ? lineBreakStyle : undefined}
        >
          {typeof description === 'string' && hasLineBreak(description)
            ? description
            : renderWithLineBreaks(description)}
        </PFText>
      ) : null}
    </>
  )
}
