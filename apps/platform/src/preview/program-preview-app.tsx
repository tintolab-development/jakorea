import { useEffect, useState } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import {
  PLATFORM_PROGRAM_PREVIEW_MESSAGE_TYPE,
  PLATFORM_PROGRAM_PREVIEW_READY_MESSAGE_TYPE,
  type PlatformProgramPreviewMessage,
  type PlatformProgramPreviewReadyMessage,
} from '@jakorea/domain/portal/program-detail'
import type { ProgramDetail } from '@/features/program'
import { mapPortalProgramDetail } from '@/features/program/api/mappers'
import { ProgramDetailView } from '@/pages/programs/detail/detail-view'
import { AppLayout } from '@/widgets/layout'

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
  useBlockLinkNavigation()

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (!isPreviewMessage(event.data)) return
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
      {program ? (
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
