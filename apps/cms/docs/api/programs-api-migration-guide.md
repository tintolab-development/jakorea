# 일반 프로그램 API 전환 마이그레이션 가이드

**작성 기준**: 2026-07-09  
**대상 화면**: CMS `/programs/general` (목록 · 상세 · 등록)  
**연동 명세**: [programs-api-integration.md](./programs-api-integration.md)  
**백엔드 갭**: [programs-api-backend-gaps.md](./programs-api-backend-gaps.md)  
**남은 작업 (프롬프트용)**: [programs-api-remaining-work.md](./programs-api-remaining-work.md)

---

## PHASE 개요

```mermaid
flowchart LR
  P0[PHASE 0\n문서·sweep]
  P1[PHASE 1\nCRUD 서비스]
  P2[PHASE 2\n상세 저장]
  P3[PHASE 3\n등록 POST]
  P4[PHASE 4\n목록 필터]
  P0 --> P1 --> P2 --> P3 --> P4
```

---

## PHASE 0 — 사전 정리

- [x] `programs-api-integration.md` · 본 가이드 · `programs-api-backend-gaps.md`
- [x] `programs-api-client` mutation 래핑 (POST/PATCH/DELETE)
- [x] `participantView` sweep 키 통일 (`general-program-detail-route.ts`)

**검증**: `general-program-detail-route.test.ts` 통과

---

## PHASE 1 — 코어 CRUD 서비스

- [x] `mapGeneralProgramToCreateRequest` / `mapGeneralProgramToUpdateRequest`
- [x] `createGeneralProgram` / `updateGeneralProgram` / `deleteGeneralProgram`
- [x] `useCreateGeneralProgram` / `useUpdateGeneralProgram` / `useDeleteGeneralPrograms`
- [x] adapter·filter params 단위 테스트

**DoD**: remote ON 시 POST/PATCH/DELETE 호출, OFF 시 mock fallback

---

## PHASE 2 — 상세 저장

- [x] `detail-fullpage-modal` — remote ON 시 `useUpdateGeneralProgram`
- [x] remote ON + detail 로드 시 session merge 비활성화
- [x] 저장 후 `edit` 제거, `lnb`/`tab`/`subTab` 유지

**DoD**: 상세 공통·모집 저장 후 새로고침해도 API 데이터 유지

---

## PHASE 3 — 등록 플로우

- [x] `persistGeneralProgramRegistration` — remote ON 시 POST
- [x] 등록 완료 → `programId` + `lnb=info` + `tab=info` URL 전환
- [x] `new` / `generalStep` / `userPreview` sweep

**DoD**: 등록 완료 후 상세 모달 오픈, 목록 필터 유지

---

## PHASE 4 — 목록 필터 서버 연동

- [x] `general-program-list-filter-params.ts` — keyword·periodStatus API 전달
- [x] 미지원 필터 클라이언트 보조
- [x] bulk delete remote 연동 (`page.tsx`)

**DoD**: 위젯 `status` → URL → remote list 일치 (지원 필터 범위 내)

---

## 2차 트랙 — 신청·진행현황 (진행 중)

- [x] `applications` · `programProgress` 모듈 키
- [x] 기관/강사/개인 신청 목록 GET + 승인/반려 POST
- [x] 진행현황 참여자 `GET .../participants`
- [x] `serviceDetailJson` v1 nested 필드
- [ ] 봉사자 신청·면접
- [ ] 참여 기관/강사/봉사 진행 목록
- [ ] `GET .../navigation` LNB 서버화

---

## 롤백

`VITE_REAL_API_MODULES`에서 `programs` 제거 → 즉시 mock 복귀.

---

## 수동 검증 체크리스트

**쿼리**
- [ ] 위젯 status → 목록 필터 URL → 테이블
- [ ] 행 클릭 시 목록 필터 + `programId`/`lnb`/`tab`
- [ ] breadcrumb 목록 복귀 시 상세 params sweep
- [ ] `subTab` · `participantRecruitmentPreview` URL 동기화
- [ ] `edit=1` → 저장 → `edit` 제거
- [ ] `new=1` → 완료 → `programId` 전환
- [ ] 상세 닫기 시 테이블 URL flush

**API**
- [ ] remote ON: 저장 후 새로고침 유지
- [ ] create → list 반영
- [ ] delete → 목록·URL 정리
- [ ] remote OFF: mock 회귀
