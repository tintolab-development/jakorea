import { useEffect, useState } from 'react'

/**
 * 선택된 `File`에 대한 임시 object URL을 생성하고, 파일 변경·언마운트 시 해제합니다.
 * 이미지 미리보기 등에 사용합니다.
 */
export function useObjectUrlFromFile(file: File | null): string | undefined {
  const [url, setUrl] = useState<string | undefined>()

  useEffect(() => {
    if (!file) {
      // Object URL 해제 후 표시 URL 초기화 — 브라우저 URL API와 동기화
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional sync when file cleared
      setUrl(undefined)
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => {
      URL.revokeObjectURL(next)
    }
  }, [file])

  return url
}
