# 템플릿 양식 — Remote SSOT (localStorage 제거)

**작성일**: 2026-09-17  
**범위**: CMS `/templates/form-management` 작성·발급 양식 + 프로그램 상세 설문/UJAT 모집 overlay

## SSOT

| 동작 | 소스 |
|------|------|
| 목록 | `GET /api/admin/form-templates` (remote ON). 실패 시 **빈 섹션 + 에러 안내** (mock merge 없음) |
| draft load | `GET .../form-template-versions/{id}` |
| draft save | `PUT .../form-template-versions/{id}` — **성공 시에만** UI 성공 |
| version id 캐시 | 메모리 (`form-template-version-cache.ts`) — localStorage 미사용 |
| 프로그램 설문 편집 | 동일 version PUT/GET (`survey-writing-draft.ts`) |
| UJAT 모집 overlay | version `extensionJson` + 메모리 (`ujat-recruit-template-local-save.ts`) |
| UJAT 상세 기본정보 | **program PATCH** + 세션 overlay (템플릿 local 키 아님) |

개발 전용: `VITE_FORM_TEMPLATE_LOCAL_FALLBACK=1` 이면 load 실패 시 `cms.jakorea.writingFormTemplateSaves.v1` fallback.

remote OFF(API URL 없음): 목록만 FE mock 카탈로그 + **mock 배지**. 저장은 API 미연결 에러.

## 프로그램 임시저장 (범위 밖)

`localOnlyDraftPersistence: true` / `registration-local-save` — [program-draft-local-storage-follow-up.md](./program-draft-local-storage-follow-up.md)

## 관련 코드

- `admin-form-templates-service.ts` — load/save
- `writing-form-template-local-save.ts` — 프로그램 `localOnly` + 레거시
- `program-draft-local-save.ts` — 프로그램 진입점 re-export
- `survey-writing-draft.ts` — 프로그램 설문 remote
