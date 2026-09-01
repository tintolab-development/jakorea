import type { Modifier } from '@dnd-kit/core'

/** 세로 리스트 정렬 시 드래그 중 가로 이동(translateX)을 막아 가로 스크롤이 생기지 않게 함 */
export const restrictFormEditorListToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
})
