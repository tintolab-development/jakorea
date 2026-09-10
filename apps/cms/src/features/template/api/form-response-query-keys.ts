/**
 * Form response feedback 캐시 키.
 * 좁은 detail 키만 사용 — form-templates / UJAT detail 전체 invalidate 금지.
 */

export const formResponseQueryKeys = {
  all: ['cms', 'form-responses'] as const,
  feedbackAll: () => [...formResponseQueryKeys.all, 'feedback'] as const,
  /** GET/POST 후 seed·invalidate 대상 — Class D */
  feedback: (responseId: number) =>
    [...formResponseQueryKeys.feedbackAll(), responseId] as const,
} as const
