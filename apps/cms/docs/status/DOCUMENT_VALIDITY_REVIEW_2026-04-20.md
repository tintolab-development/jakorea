# 문서 유효성 분류표 (2026-04-20)

이번 정리는 "기간 만료"와 "프로젝트 현행성" 기준으로 수행했습니다.

## 분류 기준

- `archive`: 과거 단계의 완료/검증 기록으로 보관 가치가 있는 문서
- `redirect`: 문서는 유지하되 상단에 대체 문서 안내가 필요한 문서
- `legacy-prompt`: 일회성 AI 실행 프롬프트 성격의 레거시 문서

## 분류 결과

| 문서 | 분류 | 사유 | 대체 문서 |
|------|------|------|----------|
| `status/NEXT_PHASE_CHECKLIST.md` | redirect | 2024-12-19 기준 다음 단계 체크리스트 | `requirements-specification/progress.md` |
| `status/PHASE_1_BRIEFING.md` | redirect | Phase 1.1 시점 브리핑 문서 | `requirements-specification/progress.md` |
| `status/PROGRESS.md` | redirect | 초기 롤 기반 진행 로그, 최신 기준과 충돌 가능 | `requirements-specification/progress.md` |
| `status/CURRENT_STATUS.md` | redirect | 2025-01-20 기준 상태 문서 | `requirements-specification/progress.md` |
| `roadmap/MVP_ROADMAP_V3.md` | redirect | V3 로드맵(과거 기준) | `roadmap/MVP_ROADMAP_V4_DETAILED.md`, `requirements-specification/progress.md` |
| `phase-verification/phase-0.4.2-verification.md` | archive | 특정 단계 완료 검증 리포트 | `requirements-specification/progress.md` |
| `phase-verification/phase-0.5.1-verification.md` | archive | 특정 단계 완료 검증 리포트 | `requirements-specification/progress.md` |
| `phase-verification/phase-0.5.2-verification.md` | archive | 특정 단계 완료 검증 리포트 | `requirements-specification/progress.md` |
| `phase-verification/phase-0.5.3-verification.md` | archive | 특정 단계 완료 검증 리포트 | `requirements-specification/progress.md` |
| `verification/phase-0.5-integration-verification.md` | archive | 특정 단계 통합 검증 리포트 | `requirements-specification/progress.md` |
| `claude-prompt/NEXT_CONTEXT_PROMPT.md` | legacy-prompt | 컨텍스트 전환용 일회성 프롬프트 | `requirements-specification/progress.md`, `requirements-specification/requirements.md` |
| `claude-prompt/QA-STATUS.md` | legacy-prompt | 시점 기반 QA 상태 문서 | `qa/auth-permission-qa-report.md`, `qa/qa-verification-report.md` |
| `claude-prompt/CURSOR-PROMPT-PHASE-0.1.1.md` | legacy-prompt | Phase 0.1.1 실행용 프롬프트 | `requirements-specification/requirements.md`, `requirements-specification/progress.md` |
| `design/JA코리아 사용자화면 프롬프트_1219.md` | legacy-prompt | 대용량 일회성 화면 생성 프롬프트 | `.cursor/rules/design/*`, `requirements-specification/requirements.md` |
