import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PortraitConsentWriteForm } from '@/features/auth/sign-up/ui/portrait-consent-write-form'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type { FormSignatureValue } from '@/shared/ui'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { useMypageMember } from '../../hooks/use-mypage-member'
import type { PortalConsentDocumentDetail } from '../api/portal-consent-documents.types'
import {
  clearMypagePortraitConsentDraftState,
  saveMypagePortraitConsentDraftState,
} from '../lib/mypage-portrait-consent-draft'
import {
  acquirePortraitConsentDraftDocument,
  portraitConsentDraftDocumentKey,
  releasePortraitConsentDraftDocument,
} from '../lib/portrait-consent-draft-document-session'
import {
  createPortraitConsentDraftDocument,
  submitPortalPortraitConsentFromWriteState,
} from '../lib/submit-portal-consent-document'

type PortraitSubmitState = {
  draft: WritingFormDraft
  signatures?: {
    final?: FormSignatureValue | string
  }
}

export function MypagePortraitConsentWriteForm({
  onComplete,
  onTitleAside,
  programTarget,
  guardianVerificationToken,
}: {
  onComplete: () => void
  onTitleAside?: (aside: ReactNode | null) => void
  /** 미성년 프로그램 신청 — 프로그램 단위 동의서로 제출 */
  programTarget?: { programId: number }
  guardianVerificationToken?: string
}) {
  const { displayName, isLoading: isMemberLoading } = useMypageMember()
  const [searchParams] = useSearchParams()
  /** 원본 보기(`?mode=view`)에서는 DRAFT를 만들지 않는다 */
  const isViewMode = searchParams.get('mode') === 'view'
  /** 작성 진입 시 DRAFT 생성 → 서버(CMS) 현재 양식으로 렌더. 실패·비원격이면 seed fallback */
  const [createdDocument, setCreatedDocument] = useState<PortalConsentDocumentDetail | null>(null)
  const [createFailed, setCreateFailed] = useState(false)
  const programId = programTarget?.programId
  const draftKey = portraitConsentDraftDocumentKey({
    memberKey: displayName || 'member',
    programId,
  })
  const remoteEnabled = isRemoteApiConfigured() && Boolean(getAccessToken())

  useEffect(() => {
    if (isViewMode || isMemberLoading || !remoteEnabled) return
    let cancelled = false
    // StrictMode 이중 effect·재진입·제출 경쟁 — 같은 키는 한 번만 POST
    void acquirePortraitConsentDraftDocument(draftKey, () =>
      createPortraitConsentDraftDocument(programId != null ? { programId } : undefined),
    )
      .then(document => {
        if (!cancelled) setCreatedDocument(document)
      })
      .catch(error => {
        if (!cancelled) setCreateFailed(true)
        console.debug('portal portrait consent draft create failed', error)
      })
    return () => {
      cancelled = true
    }
  }, [draftKey, isMemberLoading, isViewMode, programId, remoteEnabled])

  const serverDraft =
    (createdDocument?.formTemplateVersion?.schemaJson as WritingFormDraft | null | undefined) ??
    null

  const serverDraftPending =
    remoteEnabled && !isViewMode && createdDocument == null && !createFailed

  return (
    <PortraitConsentWriteForm
      verifiedName={displayName}
      serverDraft={serverDraft}
      serverDraftPending={serverDraftPending}
      saveDraftState={saveMypagePortraitConsentDraftState}
      onSubmitAsync={async (state: PortraitSubmitState) => {
        // 진입 시 생성이 아직 진행 중이면 같은 Promise를 기다린다(중복 POST 방지)
        const documentForSubmit =
          createdDocument ??
          (remoteEnabled && !isViewMode
            ? await acquirePortraitConsentDraftDocument(draftKey, () =>
                createPortraitConsentDraftDocument(programId != null ? { programId } : undefined),
              ).catch(() => null)
            : null)
        try {
          await submitPortalPortraitConsentFromWriteState(state, {
            programTarget: programTarget ? { programId: programTarget.programId } : undefined,
            guardianVerificationToken,
            createdDocument: documentForSubmit,
          })
        } finally {
          // 제출 성공·실패 모두 — 다음 진입은 새 DRAFT(이미 소비·만료된 문서 재사용 방지)
          releasePortraitConsentDraftDocument(draftKey)
        }
        clearMypagePortraitConsentDraftState()
      }}
      onComplete={onComplete}
      onTitleAside={onTitleAside}
    />
  )
}
