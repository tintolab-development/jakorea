import { shouldUseApplicationsHttpRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { shouldUseProgramProgressHttpRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'

/** 신청(기관) 또는 진행현황(참여) remote 중 하나라도 활성일 때 합반 API 사용 */
export function shouldUseOrganizationMergeGroupsRemoteApi(): boolean {
  return (
    shouldUseApplicationsHttpRemoteApi() || shouldUseProgramProgressHttpRemoteApi()
  )
}
