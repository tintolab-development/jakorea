# 주간 시간 격자 캘린더 (CalendarSet / CalendarMain)

## 프로그램 시각 미설정

- `Program`(또는 이벤트)에 `startTime` / `endTime`이 **없거나** 파싱 불가하면 **종일**로 취급한다.
- **라벨**: 블록에 프로그램명(또는 `timeGridLabel`) + 부가 문구 **`종일`** (단일 일정). 겹침 집약 시에는 `외 N개의 항목` 우선.
- **주간 격자**: `00:00`–`24:00` 전체 높이(24×**56px** = **1344px**)로 블록을 채운다. 상단 32px 스택이 아니다.
- **겹침**: 종일·시간 일정 모두 `buildTimedItemGroupLayouts`로 집약(가장 긴 일정 1블록 + `외 N개의 항목`).

## 시간 설정 있음

- `HH:mm`–`HH:mm` 구간으로 블록 높이·위치 계산.
- 동일 시간대 겹침 → 집약 표시(열 분할 아님).

## Mock

- `/programs/general`: `scheduleTimeEnabled: false` 시드 — `general-programs.ts` 참고.

**Last updated:** 2026-05-29 (56px/시간 · 1344px 총 높이)
