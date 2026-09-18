# 후속 — 프로그램 등록/모집 localStorage 임시저장 제거

**상태**: 로드맵 (런타임 SSOT 일부 remote 전환 완료 · 임시저장만 잔여)  
**작성일**: 2026-09-17  
**갱신**: 2026-09-17 — 설문·모집·등록 오버레이 remote SSOT 반영

양식 관리 draft는 remote SSOT. 아래는 **프로그램 등록 「임시저장」** 등 `localOnly`만 남긴다.

## 완료 (2026-09-17) — 런타임 SSOT remote

| Phase | 내용 | SSOT |
|-------|------|------|
| **1** | 프로그램 상세 설문 관리 저장·미리보기·poll·강의평가 draft | `load/persistWritingFormTemplateDraft` → form-template version API |
| **2** | UJAT 모집 템플릿 draft/overlay (`ujatRecruitTemplateSaves`) | remote `extensionJson` + 메모리 캐시. remote ON 시 레거시 키 삭제. `localOnly`만 local 기록 |
| **3** | UJAT 상세 기본정보 overlay (`ujatRegistrationTemplateSaves`) | **program PATCH** + 세션 overlay. 템플릿 local 키는 `localOnly` 임시저장 전용 |

진입(설문): [`survey-writing-draft.ts`](../../src/features/program/shared/lib/survey-management/survey-writing-draft.ts)  
진입(모집): [`ujat-recruit-template-local-save.ts`](../../src/features/program/ujat/lib/ujat-recruit-template-local-save.ts)

## 현재 localOnly 사용처 (잔여)

| 위치 | 플래그 / 키 | 역할 |
|------|-------------|------|
| `use-registration-flow.ts` | `localOnlyDraftPersistence: true` | 일반·1사1교 프로그램 등록 임시저장 |
| `use-ujat-program-registration-flow.ts` | `localOnlyDraftPersistence: true` | UJAT 등록·모집 오버레이 임시저장 |
| `registration-local-save` | 프로그램 목록 노출용 등록본 | remote OFF 폴백 |
| `writingFormTemplateSaves.v1` | `localOnly: true`만 | 프로그램 등록 임시저장 본문 |
| UJAT recruit/registration local keys | `localOnly`만 | 임시저장 병행 · remote ON 시 clear |

진입점: [`program-draft-local-save.ts`](../../src/features/program/shared/lib/program-draft-local-save.ts)

## 제거 전제 (BE) — 임시저장

1. 프로그램 draft / 공통정보 API가 양식 `schemaJson`·`extensionJson`(overlay/editorState)를 수용
2. 목록「임시저장」배지가 remote draft 상태로 대체 가능
3. 등록 완료·폐기 시 local 키 정리 정책

## 권장 단계 (임시저장만)

1. 일반 프로그램 등록 — `localOnlyDraftPersistence` 제거, 프로그램 draft API로 전환
2. UJAT 등록·모집 `localOnly` 이중 기록 제거
3. `registration-local-save` / UJAT 전용 키 deprecate → 삭제
4. `cms.jakorea.writingFormTemplateSaves.v1` 프로그램 전용 분기 제거 (키 자체 폐기)

## 하지 말 것

- 양식 관리 에디터에 `localOnly` 재도입
- remote 실패 시 조용한 local 성공 복원
- 프로그램 설문 편집을 다시 localStorage에 쓰기
