import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import type { SetURLSearchParams } from 'react-router-dom'
import {
  programsHistoryHasChildMenu,
  resolveMemberDetailTabStateFromUrl,
  type UserDetailProgramsChildKey,
  type UserDetailUrlSyncUser,
} from './user-detail-fullpage-helpers'
import { memberDetailUrlParamsFromUser } from './teacher-detail-url-context'

/**
 * URL(`id`, `lnb`, `programsChild`) ↔ 사이드바
 * - 목록에서 열 때 부모가 `id`를 넣기 전/후 틱에 `useSearchParams`에 `id`가 없을 수 있음 → 열림 직후 한 번만 id 보강.
 * - 부모가 닫기 위해 `id`를 지우면 searchParams가 먼저 갱신되고, 이 effect는 아직 `open===true`인 틱에 돌 수 있음.
 *   이때 `id`를 다시 넣으면 URL이 복구되어 모달이 닫히지 않는다 → **이미 열린 상태에서 id만 비었으면** 보강하지 않는다.
 * - LNB 탭 상태는 `useUserDetailController`의 layout effect가 URL에서 동기화한다.
 */
export function useUserDetailUrlSync(params: {
  open: boolean
  displayUser: UserDetailUrlSyncUser | null | undefined
  mode: 'default' | 'permission'
  searchParams: URLSearchParams
  setSearchParams: SetURLSearchParams
  programsChildQueryKey: string
  /** 목록 상세 닫기 중 — URL에 id·lnb를 다시 쓰지 않음 */
  detailCloseIntentRef?: MutableRefObject<boolean>
}) {
  const {
    open,
    displayUser,
    mode,
    searchParams,
    setSearchParams,
    programsChildQueryKey,
    detailCloseIntentRef,
  } = params

  const detailUrlSyncSeenOpenRef = useRef(false)

  /** URLSearchParams 객체 identity 변경으로 effect가 과다 실행되지 않도록 동기화 관련 키만 직렬화 */
  const urlSyncKey = useMemo(() => {
    const id = searchParams.get('id') ?? ''
    const lnb = searchParams.get('lnb') ?? ''
    const child = searchParams.get(programsChildQueryKey) ?? ''
    const memberParams = displayUser
      ? Object.entries(memberDetailUrlParamsFromUser(displayUser))
          .map(([k, v]) => `${k}=${v ?? ''}`)
          .join('&')
      : ''
    return `${id}|${lnb}|${child}|${memberParams}`
  }, [searchParams, programsChildQueryKey, displayUser])

  useEffect(() => {
    if (!open || !displayUser) {
      detailUrlSyncSeenOpenRef.current = false
      return
    }

    if (detailCloseIntentRef?.current) {
      return
    }

    const urlId = searchParams.get('id')?.trim()
    // URL id와 displayUser가 어긋나면(뒤로가기·drill-down 직후) lnb sync로 history를 덮어쓰지 않는다.
    if (urlId && displayUser.id && urlId !== displayUser.id) {
      return
    }

    const transitionedIntoOpen = !detailUrlSyncSeenOpenRef.current
    detailUrlSyncSeenOpenRef.current = true

    if (mode === 'permission') {
      return
    }

    if (!urlId && displayUser.id) {
      if (!transitionedIntoOpen) {
        return
      }
    }

    const sp = new URLSearchParams(searchParams)
    // URL id가 이미 있으면 부모(목록 drill-down)가 설정한 id를 유지한다.
    if (displayUser.id && !urlId) {
      sp.set('id', displayUser.id)
    }

    const tabFromUrl = resolveMemberDetailTabStateFromUrl({
      searchParams: sp,
      displayUser,
      programsChildQueryKey,
      mode,
    })
    const nextLnb = tabFromUrl.lnb
    const hasChildMenu = programsHistoryHasChildMenu(displayUser)
    const nextChild: UserDetailProgramsChildKey = tabFromUrl.child ?? 'enrollment'

    const nextParams = new URLSearchParams(sp)
    let urlDirty = false

    for (const [key, value] of Object.entries(memberDetailUrlParamsFromUser(displayUser))) {
      const current = sp.get(key)
      if (value != null && value !== '') {
        if (current !== value) {
          nextParams.set(key, value)
          urlDirty = true
        }
      } else if (current != null) {
        nextParams.delete(key)
        urlDirty = true
      }
    }

    if ((sp.get('lnb') ?? '') !== nextLnb) {
      nextParams.set('lnb', nextLnb)
      urlDirty = true
    }

    if (nextLnb === 'history' && hasChildMenu) {
      const cur = sp.get(programsChildQueryKey)
      if (cur !== nextChild) {
        nextParams.set(programsChildQueryKey, nextChild)
        urlDirty = true
      }
    } else if (sp.has(programsChildQueryKey)) {
      nextParams.delete(programsChildQueryKey)
      urlDirty = true
    }

    if (!urlId && displayUser.id) {
      urlDirty = true
    }

    if (urlDirty) {
      setSearchParams(nextParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- urlSyncKey가 searchParams SSOT
  }, [
    open,
    displayUser?.id,
    displayUser?.role,
    displayUser?.instructorMemberProfile,
    displayUser?.affiliatedSchoolUserId,
    mode,
    urlSyncKey,
    setSearchParams,
    programsChildQueryKey,
  ])
}
