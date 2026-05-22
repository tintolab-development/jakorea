---
priority: high
category: routing
---

# 풀페이지 상세 Breadcrumb Query Stack

**Scope:** CMS `DetailFullPageModal` 기반 풀페이지 상세 전체

## 원칙

- 모든 신규/수정 풀페이지 상세는 `DetailFullPageModal`의 `headerTrailing`에
  `DetailFullpageBreadcrumb`를 노출한다.
- 상세 depth와 풀페이지 내부 LNB depth는 URL query params로 복원 가능해야 한다.
  - 목록 → 상세, 상세 → 중첩 상세 진입은 `{ replace: false }`로 history push.
  - 같은 depth 안의 탭, 필터, 수정 모드 변경은 `{ replace: true }`로 현재 엔트리를 갱신.
- 풀페이지 내부 LNB/하위 LNB가 실제 화면 전환을 만든다면 breadcrumb depth에 포함한다.
  - 기본 구조는 `목록 > 상세 > LNB > 중첩 상세` 순서를 따른다.
  - 2뎁스 LNB에서는 상위 카테고리를 생략하고 하위 카테고리만 표시해 `목록 > 상세 > 하위 LNB > 중첩 상세` 순서를 따른다.
  - `상세` 항목 클릭은 해당 상세의 기본 LNB query 상태로 이동한다.
  - `LNB`/`하위 LNB` 항목 클릭은 해당 LNB query 상태로 이동하고 중첩 상세 query만 삭제한다.
  - 교재/정산처럼 실질적으로 단일 고정 LNB만 있는 화면은 상세명과 의미가 중복되므로 LNB breadcrumb를 생략할 수 있다.
- breadcrumb의 이전 항목 클릭은 해당 depth의 query 상태로 이동해야 한다.
  - 목록 항목 클릭 시 해당 도메인의 상세 query를 모두 삭제한다.
  - 상세 항목 클릭 시 중첩 상세 query만 삭제하고 상위 상세 query는 유지한다.
- 풀페이지 닫기(X)와 목록 breadcrumb 클릭은 같은 query sweep 범위를 사용한다.

## UI 스펙

- 헤더 위치: 타이틀 오른쪽, 닫기 버튼 왼쪽.
- 헤더 gap: 기존 `detail-fullpage-modal__header-top`의 `16px` 간격 사용.
- 텍스트: `max-width: 200px`, `overflow: hidden`, `text-overflow: ellipsis`, 한 줄 표시.
- 기본 항목: Pretendard 14px / weight 500 / `var(--disabled-txt, rgba(61, 61, 61, 0.50))`.
- 마지막 항목: Pretendard 14px / weight 700 / `#7D7D7D`.
- 화살표: `DetailFullpageBreadcrumb` 내 SVG 사용, wrapper `20px × 20px`.
- breadcrumb 텍스트와 화살표 wrapper 사이 gap은 `4px`.

## 구현 체크

- 공통 UI: `shared/ui/detail-fullpage-breadcrumb.tsx`,
  `shared/ui/detail-fullpage-modal.tsx`, `shared/ui/detail-fullpage-modal.css`.
- query target 생성은 `shared/lib/detail-fullpage-query-stack.ts`의 순수 헬퍼를 우선 사용한다.
- 도메인별 label, LNB label, query sweep 목록은 각 feature/page 근처에 둔다.
- LNB가 로컬 state만으로 관리되면 breadcrumb 클릭/새로고침 복원이 불가능하므로 `lnb`, 도메인 전용 LNB query 등 URL 상태로 승격한다.

**Last updated:** 2026-05-22
