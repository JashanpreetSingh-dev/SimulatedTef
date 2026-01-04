# Practice Assessments vs Mock Exam Modules - Analysis

This document analyzes how the codebase handles practice assessments versus mock exam modules.

## Key Differences

### 1. **Purpose & Structure**

#### Practice Assessments
- **Purpose**: Individual, standalone practice sessions for specific modules
- **Structure**: Single module per session (Oral Expression, Written Expression, Reading, or Listening)
- **Location**: `/practice` route → Module selector → Individual exam routes (`/exam/:mode`, `/exam/written/:mode`)
- **Entry Point**: `PracticeView` component → Practice tabs (`ExpressionOraleTab`, `ExpressionEcritTab`, `ReadingTab`, `ListeningTab`)

#### Mock Exam Modules
- **Purpose**: Comprehensive full-length mock exams that include all 4 modules
- **Structure**: Multi-module exam session that tracks progress across all modules
- **Location**: `/mock-exam` route → Mock exam selection → Module selector → Individual module exams
- **Entry Point**: `MockExamView` component → `MockExamSelectionView` → `MockExamModuleSelector`

### 2. **Routes & Navigation**

#### Practice Routes
```
/practice
  └─> /exam/:mode (partA | partB | full) - Oral Expression
  └─> /exam/written/:mode (partA | partB | full) - Written Expression
  └─> /exam/reading - Reading (Assignment-based)
  └─> /exam/listening - Listening (Assignment-based)
```

#### Mock Exam Routes
```
/mock-exam
  └─> /mock-exam/:mockExamId
      └─> Module selector phase
          └─> Individual module exams (handled within MockExamView)
```

### 3. **API Endpoints**

#### Practice Assessments
- **Start Session**: `POST /api/exam/start` (with `examType: 'full' | 'partA' | 'partB'`)
- **Validate Session**: `POST /api/exam/validate-session`
- **Complete Session**: `POST /api/exam/complete`
- **No mockExamId parameter** - These are standalone practice sessions

#### Mock Exam Modules
- **List Available**: `GET /api/exam/mock-exams`
- **Start Mock Exam**: `POST /api/exam/start` (with `mockExamId` in body)
- **Get Status**: `GET /api/exam/mock/:mockExamId/status`
- **Get Modules**: `GET /api/exam/mock/:mockExamId/modules`
- **Start Module**: `POST /api/exam/start-module` (with `mockExamId` and `module`)
- **Complete Module**: `POST /api/exam/complete-module` (with `mockExamId`, `module`, and `result`)

### 4. **Result Storage & Tracking**

#### Practice Assessments
- **Result Type**: `resultType: 'practice'`
- **No mockExamId field** in SavedResult
- **No module field** required (handled by route context)
- **Storage**: Individual results stored per session
- **Session Keys**: `exam_session_{mode}`, `exam_scenario_{mode}`

#### Mock Exam Modules
- **Result Type**: `resultType: 'mockExam'`
- **mockExamId field**: Required and present in SavedResult
- **module field**: Required (`'oralExpression' | 'reading' | 'listening' | 'writtenExpression'`)
- **Storage**: Results linked to mock exam session
- **Session Tracking**: Stored in `examSessions` collection with `mockExamId` and `completedModules[]`
- **Progress Tracking**: Tracks which of 4 modules are completed

### 5. **Session Management**

#### Practice Assessments
**File**: `pages/ExamView.tsx`
- Creates session via `/api/exam/start` with `examType`
- Stores session ID in sessionStorage: `exam_session_{mode}`
- Validates session on page load/refresh
- Single module per session (no multi-module tracking)
- Session completion removes sessionStorage keys

#### Mock Exam Modules
**File**: `components/MockExamView.tsx` + `hooks/useMockExamModules.ts`
- Creates mock exam session via `/api/exam/start` with `mockExamId`
- Tracks active mock exam in `usage.activeMockExamId`
- Multi-phase state management:
  - `selection` → Select mock exam
  - `module-selector` → Choose which module to take
  - `oralExpression` | `reading` | `listening` | `writtenExpression` → Taking module
- Tracks completed modules: `completedModules: string[]`
- Polls for module evaluation status while modules are loading
- Returns to module selector after each module completion

### 6. **State Management**

#### Practice Assessments
- **Simple state**: Scenario + session ID stored locally
- **No phase management**: Direct navigation to exam component
- **State stored in**: Component state + sessionStorage for recovery
- **Files**: `pages/ExamView.tsx`, `pages/WrittenExamView.tsx`

#### Mock Exam Modules
- **Complex state**: Multiple phases, completed modules, module results
- **Custom hooks**: 
  - `useMockExamState` - Main state management
  - `useMockExamModules` - Module operations
  - `useMockExamNavigation` - Navigation logic
  - `useMockExamLoading` - Loading states
  - `useMockExamErrors` - Error handling
- **State includes**: 
  - Current phase
  - mockExamId, sessionId
  - completedModules array
  - Module-specific data (scenarios, tasks, questions)
- **Files**: `components/MockExamView.tsx`, `hooks/useMockExam*.ts`

### 7. **Task Selection**

#### Practice Assessments
**File**: `pages/ExamView.tsx` (lines 169-213)
- Uses `getRandomTasks()` from `services/tasks.ts`
- Optionally excludes completed task IDs
- Random selection each time
- No fixed task assignment

#### Mock Exam Modules
**File**: `server/services/mockExamService.ts`
- Tasks selected when starting a module via `/api/exam/start-module`
- Tasks are assigned per module and stored in the session
- Consistent tasks within the same mock exam instance
- Tasks come from database services (readingTaskService, listeningTaskService, etc.)

### 8. **Completion Flow**

#### Practice Assessments
1. User completes exam
2. Result saved with `resultType: 'practice'`
3. Auto-navigate to results page (`/results/:id`)
4. Session cleared from sessionStorage
5. Done - no further modules

#### Mock Exam Modules
1. User completes a module
2. Result saved with `resultType: 'mockExam'` + `mockExamId` + `module`
3. Module added to `completedModules` array in session
4. Return to module selector (no auto-navigate for mock exams)
5. Module selector shows completion status
6. User can:
   - Start next available module
   - View results of completed modules
   - Continue until all 4 modules completed
7. When all 4 modules completed → mock exam fully done

### 9. **Result Viewing**

#### Practice Assessments
- Results accessible via `/results/:id`
- Listed in history view
- Filterable by module type
- No mock exam grouping

#### Mock Exam Modules
- Results accessible via `/results/:id` 
- Can be viewed from module selector via "View Results" button
- Results filtered by `mockExamId` and `module`
- API: `/api/results/:userId?mockExamId={id}&module={module}&resultType=mockExam`
- Results grouped by mock exam

### 10. **Code Structure**

#### Practice Assessment Files
- `pages/PracticeView.tsx` - Main practice view
- `pages/ExamView.tsx` - Oral expression practice exam
- `pages/WrittenExamView.tsx` - Written expression practice exam
- `components/practice/*` - Practice-specific components
- `components/ExamSimulator.tsx` - Legacy/alternate simulator (unused?)

#### Mock Exam Files
- `components/MockExamView.tsx` - Main mock exam view (handles all phases)
- `components/MockExamSelectionView.tsx` - Mock exam selection
- `components/MockExamModuleSelector.tsx` - Module selection UI
- `hooks/useMockExam*.ts` - State management hooks
- `server/services/mockExamService.ts` - Backend mock exam logic
- `server/routes/exam.ts` - API routes (lines 155-289)

## Key Code Locations

### Practice Assessments
- Entry: `pages/PracticeView.tsx`
- Exam: `pages/ExamView.tsx`, `pages/WrittenExamView.tsx`
- API: `server/routes/exam.ts` (lines 52-153)
- Services: `services/tasks.ts` (getRandomTasks)

### Mock Exam Modules
- Entry: `components/MockExamView.tsx`
- State: `hooks/useMockExamState.ts`, `hooks/useMockExamModules.ts`
- API: `server/routes/exam.ts` (lines 155-289)
- Backend: `server/services/mockExamService.ts`

## Important Notes

1. **Shared Components**: Both use the same exam components (`OralExpressionLive`, `ReadingComprehensionExam`, `ListeningComprehensionExam`, `WrittenExpressionExam`), but with different props/context

2. **Result Type Field**: The `resultType` field in `SavedResult` is critical:
   - `'practice'` - Practice assessment results
   - `'mockExam'` - Mock exam module results
   - `'assignment'` - Assignment results (separate system)

3. **Session Management**: Practice uses simple session validation, while mock exams track multi-module progress in the database

4. **Navigation Patterns**: Practice uses React Router navigation, mock exams use phase-based state management within a single component

5. **Completion Tracking**: Practice tracks individual results, mock exams track completion status per module in the session record