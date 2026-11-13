/**
 * 로컬 개발 전용 「시드로 보기」.
 *
 * `/templates` 화면 주소에 `?seed=1`을 붙이면 서버 저장본 대신 프론트 시드(기본 양식)로 편집기를 연다.
 * 같은 탭에서는 sessionStorage로 유지되고, `?seed=0`으로 끈다.
 * 켜져 있는 동안 양식 저장·게시·삭제 요청은 보내지 않는다(서버 저장본을 시드로 덮어쓰지 않도록).
 *
 * - 운영·QA 빌드(`import.meta.env.DEV === false`)에서는 항상 꺼져 있다.
 * - `/templates` 밖(프로그램 등록 등)에서는 적용하지 않는다.
 */

const SEED_PREVIEW_STORAGE_KEY = 'jakorea.cms.form-template-seed-preview'
const SEED_PREVIEW_QUERY_KEY = 'seed'
const TEMPLATES_PATH_PREFIX = '/templates'

export const FORM_TEMPLATE_SEED_PREVIEW_WRITE_BLOCKED_MESSAGE =
  '시드 보기 중에는 양식을 저장할 수 없습니다. 주소에 ?seed=0을 붙여 끈 뒤 다시 시도해 주세요.'

function isTemplatesPath(pathname: string): boolean {
  return pathname === TEMPLATES_PATH_PREFIX || pathname.startsWith(`${TEMPLATES_PATH_PREFIX}/`)
}

/** 주소의 `seed` 값을 읽어 sessionStorage에 반영하고, 현재 켜져 있는지 돌려준다. */
export function isFormTemplateSeedPreviewActive(): boolean {
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return false
  if (!isTemplatesPath(window.location.pathname)) return false
  try {
    const param = new URLSearchParams(window.location.search).get(SEED_PREVIEW_QUERY_KEY)
    if (param === '1') window.sessionStorage.setItem(SEED_PREVIEW_STORAGE_KEY, '1')
    else if (param === '0') window.sessionStorage.removeItem(SEED_PREVIEW_STORAGE_KEY)
    return window.sessionStorage.getItem(SEED_PREVIEW_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** 양식 쓰기 API 호출 전에 부른다. 시드 보기 중이면 요청을 보내지 않고 오류를 던진다. */
export function assertFormTemplateWriteAllowed(): void {
  if (isFormTemplateSeedPreviewActive()) {
    throw new Error(FORM_TEMPLATE_SEED_PREVIEW_WRITE_BLOCKED_MESSAGE)
  }
}
