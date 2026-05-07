import type {
  AgreementExplanationTextParagraph,
  IdTypeWithInputParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  cloneHorizontalTableParagraph,
  cloneVerticalTableParagraph,
  getWritingFormHeadMiddlePinnedTail,
  type HorizontalTableParagraph,
  type MultipleChoiceParagraph,
  type ScaleTypeParagraph,
  type SessionPlanShortEssayParagraph,
  type ShortEssayParagraph,
  type SubjectiveParagraph,
  type UserInfoParagraph,
  type UserProfileParagraph,
  type VerticalTableParagraph,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

/** [단락 추가] 시 삽입되는 설명글 — 텍스트형(`agreement_explanation_text`) 기본값 */
export function createAgreementExplanationTextParagraphForInsert(
  id: string
): AgreementExplanationTextParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'agreement_explanation_text',
    requiredMark: true,
    paragraphTitle: '텍스트형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    bodyPlaceholder: '텍스트를 작성해 주세요',
    bodyText: '',
    answerRequired: true,
  }
}

/** 동일 내용·새 단락 id 및 하위 id(항목·테이블 등)로 복제 */
export function cloneWritingFormParagraphWithNewParagraphId(
  p: WritingFormParagraph,
  newParagraphId: string
): WritingFormParagraph {
  if (p.kind === 'description') {
    return { ...p, id: newParagraphId }
  }

  switch (p.variant) {
    case 'horizontal_table':
      return cloneHorizontalTableParagraph(p as HorizontalTableParagraph, newParagraphId)
    case 'vertical_table':
      return cloneVerticalTableParagraph(p as VerticalTableParagraph, newParagraphId)
    case 'short_essay':
    case 'session_plan_short_essay': {
      const s = p as ShortEssayParagraph | SessionPlanShortEssayParagraph
      const items = (s.items ?? []).map(it => ({
        ...it,
        id: crypto.randomUUID(),
      }))
      return {
        ...s,
        id: newParagraphId,
        items,
        bodyText: items[0]?.bodyText ?? s.bodyText,
      }
    }
    case 'multiple_choice': {
      const mc = p as MultipleChoiceParagraph
      const items = mc.items.map(it => ({
        ...it,
        id: crypto.randomUUID(),
      }))
      return {
        ...mc,
        id: newParagraphId,
        items,
        selectedPreviewSingleId: null,
        selectedPreviewMultipleIds: [],
      }
    }
    case 'scale_type': {
      const sc = p as ScaleTypeParagraph
      const items = sc.items.map(it => ({
        ...it,
        id: crypto.randomUUID(),
      }))
      return {
        ...sc,
        id: newParagraphId,
        items,
        selectedPreviewItemId: null,
      }
    }
    case 'subjective': {
      const sj = p as SubjectiveParagraph
      const items = sj.items.map(it => ({
        ...it,
        id: crypto.randomUUID(),
      }))
      return { ...sj, id: newParagraphId, items }
    }
    case 'user_profile': {
      const up = p as UserProfileParagraph
      return {
        ...up,
        id: newParagraphId,
        fields: up.fields.map(f => ({ ...f })),
      }
    }
    case 'user_info': {
      const ui = p as UserInfoParagraph
      return {
        ...ui,
        id: newParagraphId,
        userFields: ui.userFields?.map(x => ({ ...x })),
      }
    }
    case 'id_type_with_input': {
      const x = p as IdTypeWithInputParagraph
      return {
        ...x,
        id: newParagraphId,
        options: x.options.map(o => ({ ...o })),
      }
    }
    default:
      return { ...p, id: newParagraphId }
  }
}

/** `afterId` 단락 바로 뒤(중간 영역)에 삽입. `afterId`가 head이면 middle 맨 앞에 삽입. middle·head에 없으면 `null`. */
export function insertMiddleParagraphAfter(
  paragraphs: WritingFormParagraph[],
  afterId: string,
  insert: WritingFormParagraph
): WritingFormParagraph[] | null {
  const split = getWritingFormHeadMiddlePinnedTail(paragraphs)
  if (split == null) return null
  if (afterId === split.head.id) {
    const nextMiddle = [insert, ...split.middle]
    return [split.head, ...nextMiddle, ...split.pinnedTail]
  }
  const idx = split.middle.findIndex(p => p.id === afterId)
  if (idx < 0) return null
  const nextMiddle = [...split.middle.slice(0, idx + 1), insert, ...split.middle.slice(idx + 1)]
  return [split.head, ...nextMiddle, ...split.pinnedTail]
}

/** 마무리·고정 tail 앞에 넣기 위해, middle의 마지막 단락 id (없으면 `null`) */
export function getLastMiddleParagraphId(paragraphs: WritingFormParagraph[]): string | null {
  const split = getWritingFormHeadMiddlePinnedTail(paragraphs)
  if (split == null || split.middle.length === 0) return null
  return split.middle[split.middle.length - 1]!.id
}

/** middle에서 제거. middle이 1개뿐이면 `null`. */
export function removeMiddleParagraph(
  paragraphs: WritingFormParagraph[],
  paragraphId: string
): WritingFormParagraph[] | null {
  const split = getWritingFormHeadMiddlePinnedTail(paragraphs)
  if (split == null) return null
  if (!split.middle.some(p => p.id === paragraphId)) return null
  if (split.middle.length <= 1) return null
  const nextMiddle = split.middle.filter(p => p.id !== paragraphId)
  return [split.head, ...nextMiddle, ...split.pinnedTail]
}

/** `paragraphId`를 복제해 바로 뒤에 삽입 */
export function duplicateMiddleParagraph(
  paragraphs: WritingFormParagraph[],
  paragraphId: string,
  newParagraphId: string
): WritingFormParagraph[] | null {
  const split = getWritingFormHeadMiddlePinnedTail(paragraphs)
  if (split == null) return null
  const idx = split.middle.findIndex(p => p.id === paragraphId)
  if (idx < 0) return null
  const source = split.middle[idx]!
  const clone = cloneWritingFormParagraphWithNewParagraphId(source, newParagraphId)
  const nextMiddle = [...split.middle.slice(0, idx + 1), clone, ...split.middle.slice(idx + 1)]
  return [split.head, ...nextMiddle, ...split.pinnedTail]
}

/** 삭제 직전 배열 기준으로, 삭제 후 포커스할 단락 id */
export function pickActiveParagraphIdAfterMiddleDelete(
  paragraphsBeforeDelete: WritingFormParagraph[],
  deletedId: string
): string | null {
  const idx = paragraphsBeforeDelete.findIndex(p => p.id === deletedId)
  if (idx < 0) return paragraphsBeforeDelete[0]?.id ?? null
  if (idx > 0) return paragraphsBeforeDelete[idx - 1]!.id
  return paragraphsBeforeDelete[idx + 1]?.id ?? paragraphsBeforeDelete[0]?.id ?? null
}
