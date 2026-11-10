import { useEffect, useState } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import {
  PLATFORM_PROGRAM_APPLICATION_PREVIEW_MESSAGE_TYPE,
  PLATFORM_PROGRAM_PREVIEW_MESSAGE_TYPE,
  PLATFORM_PROGRAM_PREVIEW_READY_MESSAGE_TYPE,
  type PlatformProgramApplicationPreviewMessage,
  type PlatformProgramPreviewMessage,
  type PlatformProgramPreviewReadyMessage,
} from '@jakorea/domain/portal/program-detail'
import type { ProgramApplicationFormQuery, ProgramDetail } from '@/features/program'
import { mapPortalProgramDetail } from '@/features/program/api/mappers'
import { ProgramDetailView } from '@/pages/programs/detail/detail-view'
import { ProgramApplyPage } from '@/pages/programs/apply/page'
import {
  ProgramApplyPreviewProvider,
  type ProgramApplyPreview,
} from '@/pages/programs/apply/preview-context'
import { AppLayout } from '@/widgets/layout'

/** 신청 화면 미리보기 — 등록 전 프로그램이라 실제 id 대신 고정 키를 쓴다. */
const APPLICATION_PREVIEW_PROGRAM_ID = 'preview'

function isApplicationPreviewMessage(
  data: unknown
): data is PlatformProgramApplicationPreviewMessage {
  if (data == null || typeof data !== 'object') return false
  const record = data as Record<string, unknown>
  return (
    record.type === PLATFORM_PROGRAM_APPLICATION_PREVIEW_MESSAGE_TYPE &&
    record.version === 1 &&
    record.detail != null &&
    typeof record.detail === 'object' &&
    record.form != null &&
    typeof record.form === 'object' &&
    typeof record.applicationType === 'string'
  )
}

function toApplicationPreview(
  message: PlatformProgramApplicationPreviewMessage
): ProgramApplyPreview | null {
  const program = mapPortalProgramDetail(message.detail)
  if (!program) return null
  const formQuery: ProgramApplicationFormQuery = {
    status: 'ready',
    isRemoteEnabled: true,
    bundle: {
      option: { applicationType: message.applicationType, canApply: true },
      form: { applicationType: message.applicationType, form: message.form, draftAnswers: {} },
    },
    blockedReason: null,
    blockedMessage: null,
    refetch: noop,
  }
  return {
    programId: APPLICATION_PREVIEW_PROGRAM_ID,
    program: { ...program, applicationType: message.applicationType },
    formQuery,
  }
}

function isPreviewMessage(data: unknown): data is PlatformProgramPreviewMessage {
  if (data == null || typeof data !== 'object') return false
  const record = data as Record<string, unknown>
  return (
    record.type === PLATFORM_PROGRAM_PREVIEW_MESSAGE_TYPE &&
    record.version === 1 &&
    record.detail != null &&
    typeof record.detail === 'object'
  )
}

function toPreviewProgram(message: PlatformProgramPreviewMessage): ProgramDetail | null {
  const program = mapPortalProgramDetail(message.detail)
  if (!program) return null
  const assets = message.assets
  const thumbnailUrl = assets?.thumbnailUrl?.trim()
  return {
    ...program,
    ...(thumbnailUrl ? { thumbnailUrl, detailImageUrl: thumbnailUrl } : {}),
    ...(assets?.attachments
      ? {
          attachments: assets.attachments.map(file => ({
            name: file.name,
            url: file.url ?? '#',
          })),
        }
      : {}),
  }
}

function noop() {}

/** 미리보기 안에서는 링크 이동을 막는다 (헤더 메뉴·첨부 등). */
function useBlockLinkNavigation() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('a[href]')) event.preventDefault()
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])
}

function PreviewPage() {
  const [program, setProgram] = useState<ProgramDetail | null>(null)
  const [applyPreview, setApplyPreview] = useState<ProgramApplyPreview | null>(null)
  useBlockLinkNavigation()

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (isApplicationPreviewMessage(event.data)) {
        setProgram(null)
        setApplyPreview(toApplicationPreview(event.data))
        return
      }
      if (!isPreviewMessage(event.data)) return
      setApplyPreview(null)
      setProgram(toPreviewProgram(event.data))
    }
    window.addEventListener('message', handleMessage)
    const ready: PlatformProgramPreviewReadyMessage = {
      type: PLATFORM_PROGRAM_PREVIEW_READY_MESSAGE_TYPE,
    }
    window.parent?.postMessage(ready, window.location.origin)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <AppLayout layout="full">
      {applyPreview ? (
        <ProgramApplyPreviewProvider value={applyPreview}>
          <ProgramApplyPage />
        </ProgramApplyPreviewProvider>
      ) : program ? (
        <ProgramDetailView program={program} onBackToList={noop} onApply={noop} />
      ) : null}
    </AppLayout>
  )
}

const router = createMemoryRouter([{ path: '*', element: <PreviewPage /> }], {
  initialEntries: ['/programs/preview'],
})

export function ProgramPreviewApp() {
  return <RouterProvider router={router} />
}
