---
priority: high
category: process
---

# 회원관리 > 전체 회원 페이지 — 테이블 스펙 (스크린샷 기준)

개발 시 **스크린샷**을 상세 참고하여 아래 스펙대로 구현합니다.

## 테이블 컬럼 (고정 6개)

| 컬럼명   | 설명           | 비고                    |
|----------|----------------|-------------------------|
| (선택)   | 행 선택 체크박스 | rowSelection 사용       |
| No.      | 목록 순번      | 중앙 정렬, 1부터 증가   |
| 회원명   | 사용자 이름    | name                   |
| 연락처   | 전화번호       | phone, 없으면 `-` 표시 |
| 이메일   | 이메일 주소    | email                  |
| 회원 유형 | 개인/학교(교사)/강사/관리자 | role → 한글 라벨 |
| 가입일   | 가입일         | createdAt, `YYYY. MM. DD` 형식 |

## UI/UX (스크린샷 기준)

- **헤더**: 컬럼명 중앙 정렬, 헤더 폰트는 일반보다 약간 굵게.
- **테두리**: 셀마다 얇은 연한 회색 테두리 (아래 보더 규칙 참고).
- **행 선택**: 체크박스 선택 시 해당 행 **연한 파란색 배경**으로 하이라이트.
- **테이블 모서리**: 상단 모서리 약간 둥글게 (디자인 시스템 적용).
- **가독성**: 일관된 검은색 폰트/크기.

## 테이블 보더 규칙

교육프로그램 카테고리 테이블(`.program-list-card`)과 동일한 셀 보더를 적용한다.

| 대상 | 속성 | 값 | 비고 |
|------|------|-----|------|
| **thead th** | border-right | 1px solid `var(--color-bg-base)` | 셀 오른쪽 구분선 |
| **thead th** | border-bottom | 1px solid `var(--color-bg-base)` | 헤더 하단선 |
| **thead th:last-child** | border-right | none | 마지막 컬럼 오른쪽선 제거 |
| **tbody td** | border-right | 1px solid `var(--color-border-light)` | 셀 오른쪽 구분선 |
| **tbody td** | border-bottom | 1px solid `var(--color-border-light)` | 행 하단선 |
| **tbody td:last-child** | border-right | none | 마지막 컬럼 오른쪽선 제거 |
| **tbody tr:last-child td** | border-bottom | none | 마지막 행 하단선 제거 |

- 구현 위치: `apps/cms/src/pages/users/user-list-page.css` — `.user-list-page__table-card .user-list-table` 하위.
- 다른 목록 테이블에서 동일 보더가 필요하면 위 규칙을 참고하여 동일 스타일을 적용한다.

## 회원 유형 라벨

- `INDIVIDUAL` → 개인
- `SCHOOL` → 학교(교사)
- `INSTRUCTOR` → 강사
- `ADMIN` → 관리자

## 모의 데이터

- 목록에 노출되는 회원 mock에는 **연락처(phone)**, **이메일**, **회원명**, **가입일(createdAt)** 이 채워져 있어야 함.
- 없으면 연락처는 `-`, 가입일은 포맷 유틸 적용.

## 참고

- [persona.md](./persona.md) — 시니어 개발자 역할 및 FSD/타입 안전성 준수.
- 행 클릭 시 노출되는 회원 상세 UI: [회원 상세 모달 스펙](./member-detail-modal-spec.md).
- 실제 테이블 컴포넌트: `apps/cms/src/features/user/shared/ui/user-list.tsx`
- 목록 페이지: `apps/cms/src/pages/users/user-list-page.tsx`
