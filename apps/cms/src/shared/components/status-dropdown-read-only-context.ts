import { createContext } from 'react'

/**
 * true면 하위의 모든 `StatusDropdownCell`이 드롭다운 없이 태그만 표시한다.
 * 프로그램 상세에서 조회 전용 역할(Program Viewer 등)일 때 상태·역할 변경 드롭다운이 열리지 않게 하는 데 쓴다.
 */
export const StatusDropdownReadOnlyContext = createContext(false)
