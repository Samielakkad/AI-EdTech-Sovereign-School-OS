# Sovereign School OS - Production Archive

[![AI + EdTech](https://img.shields.io/badge/AI%20%2B-EdTech-8A2BE2)](#)

> AI-native operating system for K-12 schools. Full production archive of the Tsinghua AIID Yearly Competition submission (NetDragon partner). Browser-only, localStorage as the database, FERPA-compliant by construction.

![status](https://img.shields.io/badge/status-shipped-2ea44f) ![stack](https://img.shields.io/badge/stack-React%2019%20%2B%20TS%20%2B%20Vite-blue) ![data](https://img.shields.io/badge/data-localStorage--only-orange) ![winner](https://img.shields.io/badge/winner-Tsinghua%20AIID%202025-gold) ![partner](https://img.shields.io/badge/partner-NetDragon-purple)

**🏆 Winner — [Tsinghua · 清华大学](https://www.sigs.tsinghua.edu.cn/) AIID Yearly Competition, [NetDragon · 网龙](https://www.netdragon.com/) partner track.**

---

## The product thesis

**Market.** US K-12 = 55M students across 130K schools. Edtech spend has crossed USD 60B annually and is still growing 12% YoY. Incumbent SaaS (Google Workspace for Edu, Canvas, PowerSchool, Securly) charges per-seat for systems whose data flows out of district control - the exact opposite of what FERPA and state student-data laws now demand.

**Wedge.** Three structural shifts the incumbents cannot move on without cannibalizing their core revenue:

1. **Privacy as architecture, not policy.** Districts are losing patience with vendor-side compliance theater. The next default is data that never leaves the device. SSO ships that today: every byte of student state lives in browser-local `localStorage`, never serialized to a backend.
2. **One-source-of-truth per portal.** A Student does not need the same AI as their Teacher or their Principal. SSO ships three distinct co-pilots tuned for three distinct workflows, instead of one chatbot reused across hats.
3. **Content factory beats content library.** Teachers do not want 10,000 prebuilt lessons. They want their own lesson, on their material, in 5 minutes. SSO is built around that primitive.

**Unit economics.** Browser-only deployment removes per-seat database cost. The marginal cost of an additional student is one AI inference call, not one Postgres row. The incumbent stack is locked into the opposite cost curve.

---

## Architecture in one diagram

```
Browser (single SPA, no backend)
  |
  +-- Router (role gate: student / teacher / admin)
  |     |
  |     +-- StudentPortal     (28 views, adaptive Hero mentors)
  |     +-- TeacherPortal     (23 views, 5-Minute Lesson Planner)
  |     +-- AdministrationPortal (13 views, fairness + compliance)
  |
  +-- Services layer (15 services, all localStorage-backed)
  |     calendarService, lessonService, complianceLogService,
  |     archiveService, focusService, approvalService, ...
  |
  +-- AI engine (geminiService.ts)
  |     - Text:  gemini-2.5-pro with responseSchema for grounded JSON
  |     - Image: imagen-4.0-generate-001
  |     - Video: veo-3.1-fast-generate-preview
  |     - Reasoning: thinkingConfig for multi-step pedagogical traces
  |
  +-- Interactive-widget parser (utils/interactiveParser.ts)
        AI text stream -> live React components (quizzes,
        fill-in-the-blanks, drag-drops) rendered inside chat

Data plane:  localStorage (per-user, per-portal, isolated namespaces)
Network I/O: outbound AI calls only, never user data exfiltration
Auth:        client-side role gate (useUserProfile hook)
```

---

## What is in this archive

`sovereign-school-os.rar` contains the complete production source tree. See `readme5.md` for the full directory map. High-density components:

### Student portal (28 views)

AICoderView, AITeacherView, AdaptiveLearningPathView, AdventuresView, ArtStudioView, AssignmentsAndQuizzesView, ClassSummariesView, DebateCoachView, EngineeringSandboxView, FinancialLiteracyView, GraphingCalculator, HistoryExplorerView, LearningHubView, LearningJournalView, LiteratureCompanionView, MathSolverView, MusicComposerView, ProfileSettingsView, ProgressView, QuestsView, QuizResultView, QuizView, ReflectionView, ScienceLabView, StoriesView, StudentDashboardView, StudentLessonDisplay, InteractiveWidgets.

### Teacher portal (23 views)

AICoachView, AstraForTeachers, AdventureArchitectView, AttentionGauge, ClassRoster, CommunicationsView, CourseSummaryView, DashboardView, FlashcardModal, IEPCopilotView, ImageEditor, ImageGenerator, IncidentModal, IncidentsView, LessonPlannerView, LessonVideoGenerator, MyLibraryView, QuizGenerator, SmartSuggestionModal, StudentDashboardView, TeacherPortal, VideoGenerator, VideoPromptGenerator.

### Administration portal (13 views)

AICopilotView, AdminDashboardView, AdministrationPortal, ApprovalsView, CommunicationsView, ComplianceLogView, DeleteUserConfirmationModal, FairnessDashboardView, SchoolArchiveView, StaffOverviewView, StudentSupportView, UserManagementView, UserModal.

### Services (15)

approvalService, archiveService, calendarService, chatHistoryService, communicationService, complianceLogService, courseSummaryService, focusService, geminiService, heroData, lessonService, lessonTemplateService, lessonVersionService, priorityService, studentDataService.

### Utils (4)

interactiveParser, parser, pdfParser, video.

---

## PM specifics: what shipped vs what is on the roadmap

### Shipped (this archive)

- Three portals, fully role-gated
- localStorage as primary store; zero backend dependencies
- Hero-mentor adaptive narrative (lesson register adapts to student performance in real time)
- 5-Minute Lesson Planner with PDF ingestion -> structured lesson generation
- Adventure Architect (game-loop generator with branching narrative)
- Fairness Dashboard for admin (demographic equity surfacing)
- Compliance audit log (immutable client-side write log)
- IEP Co-pilot for teachers (special-education plan drafting)
- Interactive-widget parser (AI text -> live React widgets)
- Calibrated structured output via `responseSchema` (eliminates JSON-parse failures)
- `thinkingConfig` traces for deep pedagogical reasoning

### Roadmap (not in this archive)

- District-level federation layer (sync localStorage snapshots across devices for the same user without ever serializing to a vendor backend; design uses E2EE blob exchange)
- Multilingual content factory (Spanish + Mandarin priority; the parser is already language-agnostic)
- Adaptive assessment engine v2 (currently per-quiz; v2 is per-skill across the year)
- Mobile-first PWA shell (current build is desktop/tablet-optimized)
- LTI 1.3 + OneRoster export adapters (district interop for buyers who want to keep their incumbent SIS)

---

## Why this archive is worth reading for a PM or engineering lead

- **Productized constraints.** Every architectural choice is downstream of one product principle (data never leaves device). Read `geminiService.ts` to see how it constrains AI calls. Read `complianceLogService.ts` to see how it constrains audit. Read `studentDataService.ts` to see how it constrains state.
- **Real eval discipline.** Lesson generation is gated by `responseSchema` validation, not vibes. The same pattern is reused across the planner, the quiz generator, and the IEP co-pilot.
- **Honest scope.** The roadmap section above is what is NOT shipped. Most edtech demos blur this line; this archive does not.

---

## Repo siblings

- [sovereign-school-os](https://github.com/Samielakkad/sovereign-school-os) - polished, browseable, file-by-file source view of the same product (no `.rar`, no `credentials.md`)
- [jak-ma-eval-suite](https://github.com/Samielakkad/jak-ma-eval-suite) - the verifier-gated retrieval pattern used here, ported to a different domain (Moroccan service marketplace)

---

## License

Source archive is shared under the original competition submission terms. See the `README.md` inside the `.rar` for project-level license. Documentation in this repo (this README, `readme5.md`) is MIT.

---

**Sami EL AKKAD** | Tsinghua SIGS, AI MSc | sam25@mails.tsinghua.edu.cn
