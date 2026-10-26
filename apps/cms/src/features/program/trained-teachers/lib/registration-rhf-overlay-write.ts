/**
 * TT 등록 RHF — overlay 키 단위 쓰기(공통정보 키). 등록 overlay 스토어와 TT 단락 바인딩이 같이 쓴다.
 */
import { peekTrainedTeachersRegistrationRhf } from './registration-rhf-api'
import {
  readTrainedTeachersRhfOverlayValue,
  writeTrainedTeachersRhfOverlayValue,
} from './registration-rhf-values'

export function writeTrainedTeachersRhfOverlayPartial(partial: Record<string, unknown>): void {
  const api = peekTrainedTeachersRegistrationRhf()
  if (api == null) return
  const current = api.getValues()
  let next = current
  let changed = false
  for (const [key, value] of Object.entries(partial)) {
    const prev = readTrainedTeachersRhfOverlayValue(current, key)
    if (Object.is(prev, value)) continue
    next = writeTrainedTeachersRhfOverlayValue(next, key, value)
    changed = true
  }
  if (!changed || next === current) return
  api.reset(next, { keepDefaultValues: true })
}
