import {
  putUjatTemporarySchedule,
  type UjatOrganizationScheduleResponse,
} from '@/features/program/ujat/api/temporary-schedule-api'
import { getApiErrorHttpStatus, readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'

export const UJAT_TEMP_RELEASE_CONFIRM_TITLE = '임시 배정 해제'
export const UJAT_TEMP_RELEASE_FAILURE_FALLBACK = '임시 배정 해제에 실패했습니다.'

export function getUjatTempReleaseConfirmContent(count: number): string {
  return `선택한 기관 ${count}곳의 임시 일정·학급 배정을 해제합니다.\n봉사자 배정이 남아 있거나 기관 확인이 완료된 기관은 해제되지 않습니다.`
}

export type UjatTempReleaseTarget = { id: string; name: string }

export type UjatTempReleaseResult = UjatTempReleaseTarget & { ok: boolean; message?: string }

type PutTemporarySchedule = (
  programId: string,
  applicationId: string,
  body: { slots: [] }
) => Promise<UjatOrganizationScheduleResponse>

/** 기관별 PUT temporary-schedule { slots: [] } — 이미 해제된 기관은 서버가 200 no-op 처리한다. */
export async function releaseUjatTemporarySchedules(
  programId: string,
  targets: readonly UjatTempReleaseTarget[],
  put: PutTemporarySchedule = putUjatTemporarySchedule
): Promise<UjatTempReleaseResult[]> {
  const results: UjatTempReleaseResult[] = []
  for (const target of targets) {
    try {
      await put(programId, target.id, { slots: [] })
      results.push({ ...target, ok: true })
    } catch (error) {
      results.push({
        ...target,
        ok: false,
        message:
          getApiErrorHttpStatus(error) != null
            ? readApiErrorAlertMessage(error, UJAT_TEMP_RELEASE_FAILURE_FALLBACK)
            : UJAT_TEMP_RELEASE_FAILURE_FALLBACK,
      })
    }
  }
  return results
}

export function buildUjatTempReleaseResultAlert(results: readonly UjatTempReleaseResult[]): {
  title: string
  content: string
} {
  const succeeded = results.filter(item => item.ok)
  const failed = results.filter(item => !item.ok)
  if (failed.length === 0) {
    return {
      title: '안내',
      content: `${succeeded.length}개 기관의 임시 배정이 해제되었습니다.`,
    }
  }
  return {
    title: '해제 결과',
    content: [
      `해제 ${succeeded.length}건 · 실패 ${failed.length}건`,
      '',
      ...failed.map(item => `· ${item.name}: ${item.message ?? UJAT_TEMP_RELEASE_FAILURE_FALLBACK}`),
    ].join('\n'),
  }
}
