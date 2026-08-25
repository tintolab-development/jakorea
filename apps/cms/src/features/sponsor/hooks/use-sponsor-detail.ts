import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDataManagementApiErrorMessage } from '@/features/data-management/api/get-data-management-api-error'
import { useSponsorDetailQuery } from '@/features/sponsor/hooks/use-sponsor-detail-query'
import { useSponsorMutations } from '@/features/sponsor/hooks/use-sponsor-mutations'
import type {
  SponsorContactRow,
  SponsorManagementDetailView,
  SponsorManagementRow,
  SponsorProgramHistoryRow,
} from '@/features/sponsor/model/sponsor-management.types'
import type { BasicInfoEditState } from '@/features/sponsor/ui/sponsor-detail-basic-info'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'
import { splitAddress } from '@/features/sponsor/utils/split-address'
import { isAwaitingFirstQueryData } from '@/shared/lib/is-awaiting-first-query-data'

export interface UseSponsorDetailReturn {
  detail: SponsorManagementDetailView
  basicInfo: BasicInfoEditState | null
  setBasicInfo: React.Dispatch<React.SetStateAction<BasicInfoEditState | null>>
  contacts: SponsorContactRow[]
  setContacts: React.Dispatch<React.SetStateAction<SponsorContactRow[]>>
  programHistories: SponsorProgramHistoryRow[]
  removeProgramHistoryRows: (ids: string[]) => void
  isEditingBasicInfo: boolean
  handleBasicInfoChange: (updater: (prev: BasicInfoEditState) => BasicInfoEditState) => void
  /** 조회 모드: 즉시 API. 수정 모드: 로컬만(수정 완료 시 basicInfo와 함께 저장). */
  handleSponsorshipStatusChange: (
    next: NonNullable<SponsorManagementRow['sponsorshipStatus']>
  ) => Promise<void>
  handleToggleBasicInfoEdit: (canWrite: boolean) => void
  programHistoryDeleteDisabled: boolean
  refetchDetail: () => Promise<unknown>
  isLoading: boolean
  isError: boolean
}

export function buildBasicInfoEditStateFromDetail(
  detail: SponsorManagementDetailView
): BasicInfoEditState {
  const parsedAddress = splitAddress(detail.address)
  return {
    nameDisplayKo: detail.nameDisplayKo,
    nameDisplayEn: detail.nameDisplayEn,
    organizationKind: detail.organizationKind ?? 'corporate',
    businessNumber: detail.businessNumber,
    executives: detail.executives,
    district: parsedAddress.district,
    detailAddress: parsedAddress.detailAddress,
    sponsorshipStartDate: detail.sponsorshipStartDate,
    sponsorshipStatus: detail.sponsorshipStatus ?? 'active',
  }
}

function sponsorRowToPlaceholderDetail(sponsor: SponsorManagementRow): SponsorManagementDetailView {
  return {
    ...sponsor,
    nameDisplayKo: sponsor.name,
    nameDisplayEn: sponsor.nameEn ?? '',
    businessNumber: '',
    executives: '',
    address: '',
    contacts: [],
    programHistories: [],
    yearlyBusinesses: [],
  }
}

export function useSponsorDetail(sponsor: SponsorManagementRow): UseSponsorDetailReturn {
  const detailQuery = useSponsorDetailQuery(sponsor.id, true)
  const { updateBasicInfoMutation, updateStatusMutation } = useSponsorMutations()
  const isAwaitingDetail = isAwaitingFirstQueryData(detailQuery)

  const detail = useMemo((): SponsorManagementDetailView => {
    if (detailQuery.data) return detailQuery.data
    return sponsorRowToPlaceholderDetail(sponsor)
  }, [detailQuery.data, sponsor])

  const [contacts, setContacts] = useState<SponsorContactRow[]>(() =>
    detailQuery.data
      ? normalizeSponsorContactsSingleLead(
          detailQuery.data.contacts.map(contact => ({ ...contact }))
        )
      : []
  )
  const [programHistories, setProgramHistories] = useState<SponsorProgramHistoryRow[]>(() =>
    detailQuery.data ? detailQuery.data.programHistories.map(row => ({ ...row })) : []
  )
  const [basicInfo, setBasicInfo] = useState<BasicInfoEditState | null>(() =>
    detailQuery.data ? buildBasicInfoEditStateFromDetail(detailQuery.data) : null
  )
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- 실데이터 GET 이후에만 편집용 로컬 상태 동기화 */
  useEffect(() => {
    if (!detailQuery.data) return
    setContacts(
      normalizeSponsorContactsSingleLead(detailQuery.data.contacts.map(contact => ({ ...contact })))
    )
    setProgramHistories(detailQuery.data.programHistories.map(row => ({ ...row })))
    setBasicInfo(buildBasicInfoEditStateFromDetail(detailQuery.data))
    setIsEditingBasicInfo(false)
  }, [detailQuery.data])
  /* eslint-enable react-hooks/set-state-in-effect */

  const removeProgramHistoryRows = useCallback((_ids: string[]): void => {
    // API에 삭제 엔드포인트 없음 — no-op
  }, [])

  const handleBasicInfoChange = useCallback(
    (updater: (prev: BasicInfoEditState) => BasicInfoEditState): void => {
      setBasicInfo(prev => (prev ? updater(prev) : prev))
    },
    []
  )

  const handleSponsorshipStatusChange = useCallback(
    async (
      next: NonNullable<SponsorManagementRow['sponsorshipStatus']>
    ): Promise<void> => {
      if (isEditingBasicInfo) {
        setBasicInfo(prev => (prev ? { ...prev, sponsorshipStatus: next } : prev))
        return
      }
      const previous = basicInfo?.sponsorshipStatus ?? detail.sponsorshipStatus ?? 'active'
      setBasicInfo(prev => (prev ? { ...prev, sponsorshipStatus: next } : prev))
      try {
        await updateStatusMutation.mutateAsync({
          sponsorId: sponsor.id,
          sponsorshipStatus: next,
          existing: detail,
        })
      } catch (error) {
        setBasicInfo(prev => (prev ? { ...prev, sponsorshipStatus: previous } : prev))
        console.debug(
          'sponsorDetail status update failed',
          getDataManagementApiErrorMessage(error, '후원 상태 변경에 실패했습니다.')
        )
      }
    },
    [
      basicInfo?.sponsorshipStatus,
      detail,
      isEditingBasicInfo,
      sponsor.id,
      updateStatusMutation,
    ]
  )

  const handleToggleBasicInfoEdit = useCallback(
    async (canWrite: boolean): Promise<void> => {
      if (!canWrite || !basicInfo) return
      if (isEditingBasicInfo) {
        try {
          await updateBasicInfoMutation.mutateAsync({
            sponsorId: sponsor.id,
            basicInfo,
            existing: detail,
          })
        } catch (error) {
          console.debug(
            'sponsorDetail basicInfo save failed',
            getDataManagementApiErrorMessage(error, '기본 정보 저장에 실패했습니다.')
          )
          return
        }
        setIsEditingBasicInfo(false)
        return
      }
      setBasicInfo(buildBasicInfoEditStateFromDetail(detail))
      setIsEditingBasicInfo(true)
    },
    [basicInfo, detail, isEditingBasicInfo, sponsor.id, updateBasicInfoMutation]
  )

  return {
    detail,
    basicInfo,
    setBasicInfo,
    contacts,
    setContacts,
    programHistories,
    removeProgramHistoryRows,
    isEditingBasicInfo,
    handleBasicInfoChange,
    handleSponsorshipStatusChange,
    handleToggleBasicInfoEdit,
    programHistoryDeleteDisabled: true,
    refetchDetail: () => detailQuery.refetch(),
    isLoading: isAwaitingDetail,
    isError: detailQuery.isError,
  }
}
