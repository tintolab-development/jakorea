# overlay 키 인벤토리 (P3)

생성: 2026-10-25 KST, `registration-wizard-overlay-key-coverage.test.ts`와 `projectCompanySchoolRhfToOverlayRecord`에서 추출.

- 원칙: 등록 위저드 값의 정본은 RHF다. 아래 overlay 키는 BE 호환 출력(안쪽 `serviceDetailJson.registration.overlay`)과 legacy 읽기 전용이다.
- 완료 기준(overlay에만 있는 키 0개): 일반 단락 키 ⊆ 매핑 키는 vitest로 단언한다(allowlist 0). 1사1교 단락 리터럴 키는 33개 모두 RHF 명시 필드에서 투영된다.
- 'BE 읽음'은 §1-2 감사 결과를 키 이름으로 대응한 것이다([추정], 키 단위 BE 코드 대조는 하지 않음).

## 일반 (generalRegistration.*) — 59키

| overlay 키 | RHF path | 저장 시 출처 | BE 읽음 |
|---|---|---|---|
| `generalRegistration.basicInfo.localProgramTitleKo` | `programTitleKo` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.programTitleEn` | `programTitleEn` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.publicProgramTitle` | `publicProgramTitle` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer/PortalPublicProgramTitle |
| `generalRegistration.basicInfo.detailedProgramId` | `detailedProgramId` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.detailedProgramName` | `detailedProgramName` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.businessField` | `businessField` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.partnerInvolvement` | `partnerInvolvement` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.educationVenueKind` | `educationVenueKind` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.educationVenueDetail` | `educationVenueDetail` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.educationCourse` | `educationCourse` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.ipOwned` | `ipOwned` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.courseDeliveredBy` | `courseDeliveredBy` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.operationRangeSeal` | `operationRangeSeal` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(운영기간) |
| `generalRegistration.basicInfo.operationAnchorIso` | `operationAnchorIso` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.surveyItems` | `surveyItems` | RHF → projectRegistrationWizardUiValuesToOverlay | 설문 생성 |
| `generalRegistration.basicInfo.localSponsorIds` | `sponsorIds` | RHF → projectRegistrationWizardUiValuesToOverlay | CommandService sponsor mirror |
| `generalRegistration.basicInfo.localSponsorId` | `sponsorId` | RHF → projectRegistrationWizardUiValuesToOverlay | CommandService sponsor mirror |
| `generalRegistration.basicInfo.localManagerContactIds` | `managerContactIds` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.localManagerContactId` | `managerContactId` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.sponsorManagerLine` | `sponsorManagerLine` | RHF → projectRegistrationWizardUiValuesToOverlay | CommandService sponsor mirror |
| `generalRegistration.kpi.participantCount` | `kpiParticipantCount` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.kpi.instructor` | `kpiInstructor` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.kpi.volunteer` | `kpiVolunteer` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.kpi.dispatchedSchool` | `kpiDispatchedSchool` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.kpi.dispatchedClass` | `kpiDispatchedClass` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.wageInfo.grade1Fee` | `wageGrade1Fee` | RHF → projectRegistrationWizardUiValuesToOverlay | Settlement projection |
| `generalRegistration.wageInfo.grade2Fee` | `wageGrade2Fee` | RHF → projectRegistrationWizardUiValuesToOverlay | Settlement projection |
| `generalRegistration.wageInfo.grade3Fee` | `wageGrade3Fee` | RHF → projectRegistrationWizardUiValuesToOverlay | Settlement projection |
| `generalRegistration.wageInfo.paymentItemValues` | `paymentItemValues` | RHF → projectRegistrationWizardUiValuesToOverlay | Settlement projection |
| `generalRegistration.wageInfo.paymentItemLabels` | `paymentItemLabels` | RHF → projectRegistrationWizardUiValuesToOverlay | Settlement projection |
| `generalRegistration.typeSettings.singleEducationForm` | `singleEducationForm` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer |
| `generalRegistration.typeSettings.multiCommonEducationForm` | `multiCommonEducationForm` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer |
| `generalRegistration.typeSettings.educationForm` | `legacyEducationForm` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer |
| `generalRegistration.typeSettings.singleParticipation` | `singleParticipation` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer |
| `generalRegistration.typeSettings.multiCommonParticipation` | `multiCommonParticipation` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer |
| `generalRegistration.typeSettings.ipsType` | `ipsType` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer |
| `generalRegistration.educationScheduleSettings.scheduleLines` | `scheduleLines` | RHF → projectRegistrationWizardUiValuesToOverlay | ProgramEducationScheduleLines |
| `generalRegistration.educationScheduleSettings.singleDateIso` | `singleDateIso` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.educationScheduleSettings.periodDateIso` | `periodDateIso` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.basicInfo.footerIpsType` | `footerIpsType` | RHF → projectRegistrationWizardUiValuesToOverlay | — |
| `generalRegistration.educationCurriculum.unitNameBySession` | `curriculum.unitNameBySession` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationCurriculum.unitContentBySession` | `curriculum.unitContentBySession` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationCurriculum.progressSessionByRound` | `curriculum.progressSessionByRound` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationCurriculum.roundContentByRound` | `curriculum.roundContentByRound` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationCurriculum.educationFormBySession` | `curriculum.educationFormBySession` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationCurriculum.participationBySession` | `curriculum.participationBySession` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationCurriculum.ipsBySession` | `curriculum.ipsBySession` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationCurriculum.assignmentByRound` | `curriculum.assignmentByRound` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationCurriculum.preEducationScheduleName` | `curriculum.preEducationScheduleName` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationCurriculum.preEducationScheduleLine` | `curriculum.preEducationScheduleLine` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationCurriculum.teacherTrainingEducationForm` | `curriculum.teacherTrainingEducationForm` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationScheduleCurriculum.eventNameByDetail` | `schedule.eventNameByDetail` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso` | `schedule.scheduleDateByDetailIso` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationScheduleCurriculum.groupTimesByDetail` | `schedule.groupTimesByDetail` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationScheduleCurriculum.educationFormByDetail` | `schedule.educationFormByDetail` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationScheduleCurriculum.participationByDetail` | `schedule.participationByDetail` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationScheduleCurriculum.ipsByDetailIndex` | `schedule.ipsByDetailIndex` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationScheduleCurriculum.assignmentByDetail` | `schedule.assignmentByDetail` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |
| `generalRegistration.educationScheduleCurriculum.preEducationName` | `schedule.preEducationName` | RHF → projectRegistrationWizardUiValuesToOverlay | SsotNormalizer(curriculum 맵) |

## 1사1교 (economyRegistration.*) — 33키 + sidecar

| overlay 키 | RHF 필드 | 저장 시 출처 | BE 읽음 |
|---|---|---|---|
| `economyRegistration.basicInfo.repKo` | `repKo` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.repEn` | `repEn` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.publicProgramTitle` | `publicProgramTitle` | RHF → projectCompanySchoolRhfToOverlayRecord | SsotNormalizer/PortalPublicProgramTitle |
| `economyRegistration.basicInfo.detailedProgramId` | `detailedProgramId` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.detailedProgramName` | `detailedProgramName` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.businessField` | `businessField` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.ipOwned` | `ipOwned` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.courseDeliveredBy` | `courseDeliveredBy` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.partnerInvolvement` | `partnerInvolvement` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.ipsCategory` | `ipsCategory` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.educationCourse` | `educationCourse` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.sponsorId` | `sponsorId` | RHF → projectCompanySchoolRhfToOverlayRecord | CommandService sponsor mirror |
| `economyRegistration.basicInfo.managerContactIds` | `managerContactIds` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.managerContactId` | `managerContactIds[0]` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.operationRangeSeal` | `operationRange` | RHF → projectCompanySchoolRhfToOverlayRecord | SsotNormalizer(운영기간) |
| `economyRegistration.basicInfo.operationAnchorIso` | `operationAnchorIso` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.basicInfo.surveyItems` | `surveyItemsRecordFromMenuKeys(` | RHF → projectCompanySchoolRhfToOverlayRecord | 설문 생성 |
| `economyRegistration.kpi.participantCount` | `participantCount` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.kpi.instructor` | `instructor` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.kpi.dispatchedSchool` | `dispatchedSchool` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.kpi.dispatchedClass` | `dispatchedClass` | RHF → projectCompanySchoolRhfToOverlayRecord | — |
| `economyRegistration.educationCurriculum.session1.title` | `curriculumSessions[0].title` | RHF → projectCompanySchoolRhfToOverlayRecord | SsotNormalizer(curriculum 맵) |
| `economyRegistration.educationCurriculum.session1.description` | `curriculumSessions[0].description` | RHF → projectCompanySchoolRhfToOverlayRecord | SsotNormalizer(curriculum 맵) |
| `economyRegistration.educationCurriculum.session2.title` | `curriculumSessions[1].title` | RHF → projectCompanySchoolRhfToOverlayRecord | SsotNormalizer(curriculum 맵) |
| `economyRegistration.educationCurriculum.session2.description` | `curriculumSessions[1].description` | RHF → projectCompanySchoolRhfToOverlayRecord | SsotNormalizer(curriculum 맵) |
| `economyRegistration.educationScheduleSettings.dateRangeSeal` | `educationScheduleRange` | RHF → projectCompanySchoolRhfToOverlayRecord | SsotNormalizer |
| `economyRegistration.wageInfo.grade1Fee` | `grade1Fee` | RHF → projectCompanySchoolRhfToOverlayRecord | Settlement projection |
| `economyRegistration.wageInfo.grade1DistanceFee` | `grade1DistanceFee` | RHF → projectCompanySchoolRhfToOverlayRecord | Settlement projection |
| `economyRegistration.wageInfo.grade2Fee` | `grade2Fee` | RHF → projectCompanySchoolRhfToOverlayRecord | Settlement projection |
| `economyRegistration.wageInfo.grade2DistanceFee` | `grade2DistanceFee` | RHF → projectCompanySchoolRhfToOverlayRecord | Settlement projection |
| `economyRegistration.wageInfo.grade3Fee` | `grade3Fee` | RHF → projectCompanySchoolRhfToOverlayRecord | Settlement projection |
| `economyRegistration.wageInfo.grade3DistanceFee` | `grade3DistanceFee` | RHF → projectCompanySchoolRhfToOverlayRecord | Settlement projection |
| `economyRegistration.wageInfo.paymentItemValues` | `paymentItemValues` | RHF → projectCompanySchoolRhfToOverlayRecord | Settlement projection |

### 1사1교 sidecar
- 단락이 쓰지 않는 키(legacy·dev 자동입력 `kpi.volunteer`, `kpi.educationProgress.*` 등)는 `values.sidecar`에 보존돼 그대로 다시 출력된다. 단락 리터럴 키 중 sidecar로만 가는 키는 0개다.
- [미완] 계획서 P3-2의 'sidecar 키를 명시 필드로 승격'은 하지 않았다. 단락에서 쓰는 키가 없어 승격해도 화면 동작은 그대로이고, legacy 보존 경로를 바꾸면 위험만 생긴다고 판단했다(보수적 선택).

## TT / UJAT / Gemini
- TT(trainedTeachersRegistration.*)와 UJAT(ujat.*)는 이번 작업에서 바꾸지 않는다(불변 제약, D2 기본값). 인벤토리 대상에서도 뺐다.

## 단락에서 쓰지만 일반 위저드 RHF 소유가 아닌 키
- 없음(allowlist 0). TT legacy import의 `generalRegistration.basicInfo.managerContactIds`와 TT persist의 `generalRegistration.educationCurriculum.educationJournalEnabled`는 TT 모듈 안에서만 읽고 쓰므로 일반 위저드 범위 밖이다.
