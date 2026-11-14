import { useCallback, useMemo, useState } from 'react'
import { bulkDownloadIndividualSettlementDocumentsRemote } from '@/features/program/general/api/individual-settlement-review-remote'
import {
  filterIndividualSettlementDocumentDownloadRows,
  type IndividualSettlementReviewListRow,
} from '@/features/program/general/lib/map-individual-settlement-review-rows'
import {
  PROGRAM_API_UNAVAILABLE_TITLE,
  buildProgramApiUnavailableContent,
} from '@/features/program/shared/lib/program-api-unavailable'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { useProtectedFileDownload } from '@/shared/lib/use-protected-file-download'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { handleError } from '@/shared/utils/error-handler'

/**
 * 참여자·봉사자 정산 현황 「지급조서 일괄 다운로드」(CMS-FUNC-0248·0252).
 * 강사 정산 현황 일괄 다운로드와 같은 흐름·안내 문구: 원격 꺼짐·대상 없음 안내 → 다운로드 비밀번호 → 서버 암호화 ZIP.
 * 대상은 지급조서 확인 완료·계좌 지급 완료 건이며, 서버는 한 건이라도 통과하지 못하면 요청 전체를 거부한다.
 */
export function useIndividualSettlementDocumentBulkDownload(input: {
  rows: ReadonlyArray<IndividualSettlementReviewListRow>
  remoteEnabled: boolean
  /** 오류 로그 구분용 */
  context: string
}) {
  const { rows, remoteEnabled, context } = input
  const { showAlert } = useCmsAlert()
  const { runProtectedDownload, filePasswordModal } = useProtectedFileDownload()
  const [loading, setLoading] = useState(false)

  const downloadableIds = useMemo(
    () =>
      filterIndividualSettlementDocumentDownloadRows(rows)
        .map(row => row.settlementApplicationId)
        .filter((id): id is number => id != null),
    [rows]
  )

  const handleBulkDownload = useCallback(() => {
    if (loading) return
    if (!remoteEnabled) {
      showAlert({
        title: PROGRAM_API_UNAVAILABLE_TITLE,
        content: buildProgramApiUnavailableContent('지급조서 일괄 다운로드'),
      })
      return
    }
    if (downloadableIds.length === 0) {
      showAlert({
        title: '안내',
        content:
          '다운로드할 지급조서가 없습니다. 지급조서 확인 완료 또는 계좌 지급 완료 상태인 건만 다운로드됩니다.',
      })
      return
    }
    runProtectedDownload({
      kind: 'PAYMENT_STATEMENT',
      download: async password => {
        setLoading(true)
        try {
          await bulkDownloadIndividualSettlementDocumentsRemote({
            settlementApplicationIds: downloadableIds,
            password,
          })
        } catch (error) {
          handleError(error, { context: `${context}.bulkDownloadPaymentStatements` })
          showAlert({
            title: '안내',
            content: getSettlementApiErrorMessage(error, '지급조서 일괄 다운로드에 실패했습니다.'),
          })
          throw error
        } finally {
          setLoading(false)
        }
      },
    })
  }, [context, downloadableIds, loading, remoteEnabled, runProtectedDownload, showAlert])

  return { handleBulkDownload, loading, filePasswordModal }
}
