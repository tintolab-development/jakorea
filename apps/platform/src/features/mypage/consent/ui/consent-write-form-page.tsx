import type { ReactNode } from 'react'
import { ProgramBackButton } from '@/features/program'
import { PFFormPage } from '@/shared/ui'

type ConsentWriteFormPageProps = {
  title: string
  description?: ReactNode
  ariaLabel: string
  onBack: () => void
  titleAside?: ReactNode
  children: ReactNode
}

/** 강사 신청·설정 동의서 작성 — 공통 PFFormPage shell */
export function ConsentWriteFormPage({
  title,
  description,
  ariaLabel,
  onBack,
  titleAside,
  children,
}: ConsentWriteFormPageProps) {
  return (
    <PFFormPage
      aria-label={ariaLabel}
      back={
        <ProgramBackButton size="small" label="이전으로" onClick={onBack} />
      }
      title={title}
      description={description}
      titleAside={titleAside}
    >
      {children}
    </PFFormPage>
  )
}
