import { useEffect, useRef } from 'react'
import type { SetURLSearchParams } from 'react-router-dom'
import type { User } from '@/types/user'
import {
  programsHistoryHasChildMenu,
  parseProgramsChildParam,
  clampProgramsChildForRole,
  type UserDetailLnbKey,
  type UserDetailProgramsChildKey,
} from './user-detail-fullpage-helpers'

/**
 * URL(`id`, `lnb`, `programsChild`) ↔ 사이드바
 * - 목록에서 열 때 부모가 `id`를 넣기 전/후 틱에 `useSearchParams`에 `id`가 없을 수 있음 → 열림 직후 한 번만 id 보강.
 * - 부모가 닫기 위해 `id`를 지우면 searchParams가 먼저 갱신되고, 이 effect는 아직 `open===true`인 틱에 돌 수 있음.
 *   이때 `id`를 다시 넣으면 URL이 복구되어 모달이 닫히지 않는다 → **이미 열린 상태에서 id만 비었으면** 보강하지 않는다.
 */
export function useUserDetailUrlSync(params: {
  open: boolean
  displayUser: Pick<User, 'id' | 'role'> | null | undefined
  mode: 'default' | 'permission'
  searchParams: URLSearchParams
  setSearchParams: SetURLSearchParams
  setActiveLnb: (v: UserDetailLnbKey) => void
  setActiveProgramsChild: (v: UserDetailProgramsChildKey) => void
  programsChildQueryKey: string
}) {
  const {
    open,
    displayUser,
    mode,
    searchParams,
    setSearchParams,
    setActiveLnb,
    setActiveProgramsChild,
    programsChildQueryKey,
  } = params

  const detailUrlSyncSeenOpenRef = useRef(false)

  useEffect(() => {
    if (!open || !displayUser) {
      detailUrlSyncSeenOpenRef.current = false
      return
    }

    const transitionedIntoOpen = !detailUrlSyncSeenOpenRef.current
    detailUrlSyncSeenOpenRef.current = true

    if (mode === 'permission') {
      setActiveLnb('detail-info')
      setActiveProgramsChild('enrollment')
      return
    }

    const urlId = searchParams.get('id')?.trim()
    if (!urlId && displayUser.id) {
      if (!transitionedIntoOpen) {
        return
      }
    }

    const sp = new URLSearchParams(searchParams)
    if (displayUser.id) {
      sp.set('id', displayUser.id)
    }

    const rawLnb = sp.get('lnb')
    const isInstructor = displayUser.role === 'INSTRUCTOR'
    const hasChildMenu = programsHistoryHasChildMenu(displayUser.role)

    const nextLnb: UserDetailLnbKey =
      rawLnb === 'history'
        ? 'history'
        : rawLnb === 'payment-status' && isInstructor
          ? 'payment-status'
          : 'detail-info'

    let nextChild: UserDetailProgramsChildKey =
      displayUser.role === 'INSTRUCTOR' ? 'lecture' : 'enrollment'
    if (nextLnb === 'history' && hasChildMenu) {
      const parsed = parseProgramsChildParam(sp.get(programsChildQueryKey))
      nextChild = parsed
        ? clampProgramsChildForRole(displayUser.role, parsed)
        : displayUser.role === 'INSTRUCTOR'
          ? 'lecture'
          : 'enrollment'
    }

    setActiveLnb(nextLnb)
    setActiveProgramsChild(nextChild)

    const nextParams = new URLSearchParams(sp)
    let urlDirty = false

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

    if (displayUser.id && searchParams.get('id') !== displayUser.id) {
      urlDirty = true
    }

    if (urlDirty) {
      setSearchParams(nextParams, { replace: true })
    }
    // displayUser 전체 미포함: id·role만 의존(원본 모달과 동일, 참조 변경 과실행 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    displayUser?.id,
    displayUser?.role,
    mode,
    searchParams,
    setSearchParams,
    setActiveLnb,
    setActiveProgramsChild,
    programsChildQueryKey,
  ])
}
