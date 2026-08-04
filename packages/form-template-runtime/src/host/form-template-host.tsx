import type { ReactNode } from 'react'
import { ConfigProvider } from 'antd'
import type { FormTemplateSurface } from '@jakorea/form-schema/surface'
import './cms-surface-tokens.css'
import '../shared/app-radio.css'
import '../detail-info-form/detail-info-form.css'
import '../paragraph/paragraph-card.css'
import '../paragraph/paragraph-input.css'
import '../paragraph/form-paragraph-section-description.css'
import './form-template-host.css'

export type FormTemplateHostProps = {
  surface: FormTemplateSurface
  children: ReactNode
  className?: string
}

export function FormTemplateHost({ surface, children, className }: FormTemplateHostProps) {
  const rootClass = ['form-template-host', className].filter(Boolean).join(' ')

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: 'Pretendard, system-ui, sans-serif',
          colorPrimary: '#01a1af',
          borderRadius: 8,
        },
      }}
    >
      <div className={rootClass} data-surface={surface}>
        {children}
      </div>
    </ConfigProvider>
  )
}
