/**
 * 메뉴별 조회 통계 — 섹션 블록
 * ■ 제목과 footnote 동일 헤더 라인 · 하단 정렬
 */

import type { ReactNode } from 'react'

type Props = {
  title: string
  footnote?: string
  children: ReactNode
}

export function MenuViewSectionBlock({ title, footnote, children }: Props) {
  return (
    <section className="menu-view-section">
      <div className="menu-view-section__header">
        <h3 className="menu-view-section__title">
          <span className="menu-view-section__bullet" aria-hidden>
            ■
          </span>
          {title}
        </h3>
        {footnote ? (
          <p className="menu-view-section__footnote">{footnote}</p>
        ) : null}
      </div>
      <div className="menu-view-section__body">{children}</div>
    </section>
  )
}
