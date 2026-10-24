/**
 * 테스트 전용 입력 어댑터. overlay KV → IndependentMediaFormValues.
 * 프로덕션 Builder는 이 모듈을 import하지 않는다.
 */
import {
  GENERAL_MEDIA_READ_PREFIXES,
  readIndependentMediaCanonicalFromOverlay,
  readIndependentMediaPrefixValues,
} from './media-domain'
import type { IndependentMediaFormValues, IndependentMediaSidecars } from './media-form-values'

function prefixHasMedia(item: ReturnType<typeof readIndependentMediaPrefixValues>): boolean {
  return item.thumbnail != null || item.attachments != null
}

export function overlayKvToIndependentMediaInput(overlay: Record<string, unknown>): {
  formValues: IndependentMediaFormValues
  sidecars: IndependentMediaSidecars
} {
  const byPrefix = GENERAL_MEDIA_READ_PREFIXES.map(prefix =>
    readIndependentMediaPrefixValues(overlay, prefix)
  ).filter(prefixHasMedia)
  const canonical = readIndependentMediaCanonicalFromOverlay(overlay)
  return {
    formValues: {
      ...canonical,
      ...(byPrefix.length > 0 ? { byPrefix } : {}),
    },
    sidecars: {
      unownedOverlay: { ...overlay },
      overlayKeyOrder: Object.keys(overlay),
    },
  }
}
