/**
 * BE `NotificationTemplateParameterResolver` 토큰 계약과 동일:
 * `#\{([^{}]+)}` — HTML 엔티티로 이스케이프된 중괄호는 매칭되지 않아
 * 치환·fail-closed가 건너뛰어지고 `#{키}`가 그대로 발송될 수 있다.
 */

const TEMPLATE_PLACEHOLDER_RE = /#\{([^{}]+)\}/g

/** `&#123;` / `&#x7b;` / `&lbrace;` 등 → 리터럴 `{` `}` */
export function normalizeNotificationPlaceholderMarkup(input: string): string {
  if (!input) return input
  return input
    .replace(/&#0*123;/gi, '{')
    .replace(/&#0*125;/gi, '}')
    .replace(/&#x0*7b;/gi, '{')
    .replace(/&#x0*7d;/gi, '}')
    .replace(/&lbrace;/gi, '{')
    .replace(/&rbrace;/gi, '}')
}

export function extractNotificationPlaceholderKeys(
  ...texts: Array<string | null | undefined>
): string[] {
  const keys = new Set<string>()
  for (const raw of texts) {
    if (!raw) continue
    const text = normalizeNotificationPlaceholderMarkup(raw)
    for (const match of text.matchAll(TEMPLATE_PLACEHOLDER_RE)) {
      const key = match[1]?.trim()
      if (key) keys.add(key)
    }
  }
  return [...keys]
}

export function normalizeNotificationTemplateFields<T extends { subject?: string; body?: string }>(
  input: T & { subject: string; body: string }
): { subject: string; body: string } {
  return {
    subject: normalizeNotificationPlaceholderMarkup(input.subject),
    body: normalizeNotificationPlaceholderMarkup(input.body),
  }
}
