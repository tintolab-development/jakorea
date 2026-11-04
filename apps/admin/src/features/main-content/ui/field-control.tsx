import type { ReactNode } from 'react'

type Props = {
  error?: string
  children: ReactNode
}

export function MainContentFieldControl({ error, children }: Props) {
  return (
    <div className="main-content-field-control">
      {children}
      {error ? (
        <p className="main-content-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
