# Update Log

This log records the employee dashboard and HR knowledge assistant changes made during the current upgrade.

## 2026-10-29 - Employee dashboard and RAG assistant upgrade

### Employee dashboard

- Replaced the basic employee tab experience with a more structured, responsive workspace featuring an overview, feedback history, guided feedback submission, and HR knowledge assistant.
- Added a personalized employee header and navigation that identifies the active section.
- Added overview cards based on the signed-in employee's actual feedback records. No unsupported organization-wide analytics were introduced.
- Added feedback search, status filtering, and date sorting.
- Added loading, empty, retryable error, and success states around employee feedback and dashboard actions.
- Updated the shared stylesheet with dashboard, feedback, assistant, mobile, focus, and reduced-motion treatments.
- Improved employee feedback forms and lists with clearer states, accessibility labels, and interaction feedback.
- Updated the guided questionnaire to use the signed-in employee's available context.

### Employee HR knowledge assistant

- Removed the old employee chatbot component and its chat-generation and chat-summarization functions from the employee chat path.
- Added a dedicated HR knowledge assistant interface with conversation history, source references, retry behavior, keyboard-friendly controls, and status announcements.
- Kept chat sessions and employee ownership checks; retained administrator-only access to all-session and HR-message operations.
- Added confirmation before sending a conversation to HR or requesting follow-up, including an explanation of what will be shared.
- Preserved legacy chat history compatibility while identifying newly generated assistant messages as RAG responses.
- Added source-reference storage and retrieval status to chat messages. References are only displayed when the existing agent supplies them.
- Added a backend adapter for the existing RAG-Agent Flask API. It sends `POST /ask` with only the current question and expects an answer with string sources, such as `handbook.pdf - Page 12`.
- The adapter maps source strings to title/page references, returns a no-reliable-source outcome when citations are missing, and handles malformed responses, upstream failures, and timeouts explicitly.
- Removed the unused conversation-history construction from the controller because the existing `/ask` endpoint does not accept history.
- Kept feedback/questionnaire/admin AI functionality separate; those existing features are not used as a fallback for employee chat.

### Safety, scenario handling, and access

- Kept scenario matching and its administrator review queue separate from document RAG.
- Kept scenario safety checks before calling the RAG agent, so flagged urgent messages are routed to follow-up rather than waiting on retrieval.
- Expanded urgent-message phrase detection to include immediate danger and direct self-harm statements.
- Preserved employee-only session access, administrator role checks, existing HR follow-up, and transcript-to-feedback workflows.
- Changed public signup to assign the employee role rather than allowing a registrant to select an administrator role.

### Documentation and configuration

- Added server-side RAG URL, timeout, and optional authentication settings to `backend/.env.example`; no real credentials were added.
- Documented the actual RAG API contract, local setup, source format, question-only request behavior, knowledge-base indexing location, and production security blockers in `README.md`.
- Updated sign-in examples for the seeded HR/Administration account and for an employee account created through registration.
- Updated shared portal branding and page metadata.

### Validation performed

- Frontend production build passed. It reports an outdated Browserslist data warning and a bundle-size warning.
- Backend JavaScript syntax checks passed for the changed controller, services, and model.
- Local mock-server checks passed for production authentication gating, question-only request payload, citation parsing, no-source handling, malformed responses, upstream errors, and timeouts.
- Focused safety phrase checks passed for immediate danger, self-harm, retaliation, harassment, and a non-urgent benefits question.
- `git diff --check` passed.
- `npm run lint` could not run because the frontend project has no ESLint configuration.

### Remaining integration and deployment notes

- The RAG-Agent repository's current Flask route has no authentication. Add and verify agent-side authentication before enabling the adapter in production; setting the backend verification flag by itself does not secure the upstream.
- The upstream RAG-Agent Flask app enables debug mode and logs full questions and subprocess output. Disable debug mode and remove or redact those logs before handling employee content; the local demo checkout was patched separately.
- Confirm that the RAG-Agent's indexed `data/handbook.pdf` is the approved, current HR knowledge source.
- The existing endpoint does not return confidence or structured source objects and does not accept conversation history. The integration intentionally follows the checked-in endpoint contract instead of assuming those capabilities.
- The frontend build output was restored after validation and is not part of the source changes.

## 2026-10-29 - Local demonstration repair

- Started the local frontend, backend, and existing RAG Agent against the available MongoDB, Ollama model, cached embedding/reranker models, and indexed handbook.
- Added the local RAG URL and timeout to the backend `.env` so the running backend can call `http://127.0.0.1:5000/ask`.
- Created an isolated Python environment for the separate RAG-Agent checkout and installed its missing Flask, Chroma, Ollama, and sentence-transformer runtime dependencies.
- Fixed a Windows console encoding failure in the RAG subprocess by setting UTF-8 output/decoding.
- Disabled Flask debug mode in the local RAG-Agent checkout and removed logging of the employee question and captured RAG answer.
- Added a narrow retrieval-query expansion for “annual leave” and “vacation” so those common terms also search the handbook's “paid time off (PTO)” wording. The employee's original question remains the question answered by RAG; the answer still must have a handbook citation to be treated as reliable.
- Verified the real backend adapter returned a grounded answer with `handbook.pdf`, page 27. Also verified the authenticated employee chat API created and persisted a grounded RAG response.
- Created a local employee demo account for the presentation. Its one-time sign-in details were returned in the task response, not saved in this log or source files.
- Added Windows local demo startup instructions to `README.md`. The separate RAG-Agent checkout and its changes are outside the employee-engagement Git repository.

## 2026-10-29 - Sign-in and registration UI

- Replaced the basic login and signup forms with a shared responsive authentication layout that matches the portal’s forest-green and soft-neutral dashboard design.
- Added portal branding, concise product context, consistent form fields, visible focus states, and a compact mobile layout.
- Added labelled email/password fields, password visibility controls, loading/disabled submit states, and accessible error messaging. Signup still creates employee accounts and keeps the existing password-confirmation check.
- Verified the production frontend build, the mobile layout without horizontal overflow, the signup password-mismatch alert, and successful sign-in with the existing demo employee account.

## 2026-10-30 - Feedback conversations and portal copy cleanup

- Removed em dash characters from portal interface copy and the update log. Unavailable dashboard counts now show `N/A`.
- Added a threaded conversation to each feedback record. Employees can send follow-up messages on their own submissions, and HR administrators can respond from the feedback row’s "Respond to feedback" action.
- Added server-side message length validation, owner checks for employee access, administrator role checks through the existing auth middleware, persisted sender/timestamp data, and live feedback updates.
- New HR messages mark the feedback as responded. An employee follow-up moves a responded item back to review.
- Kept existing AI reply drafts and recorded legacy replies available separately.
- Searched portal source and documentation for placeholder personal names; none were found.
- Verified the feedback conversation API end to end using temporary records, including employee access isolation, HR responses, employee follow-up, conversation readback, and status changes. Removed the test records after checks.
- Frontend production build passed with the existing Browserslist age and bundle size warnings. The frontend lint command remains unavailable because the repository has no ESLint configuration.

## 2026-10-30 - Render and Vercel deployment preparation

- Added a Render Blueprint for the Node API, health check, generated JWT secret, and server-side database, CORS, and RAG settings.
- Added Vercel SPA route rewrites and documented the frontend API URL setting.
- Updated backend CORS configuration to allow a comma-separated list of exact frontend origins for both Express and Socket.IO.
- Added deployment guidance for Atlas networking, Render and Vercel project settings, administrator provisioning, environment variables, and smoke tests.
- Replaced the hard-coded administrator seed credentials and destructive account replacement with an explicit, non-overwriting seed that requires a configured name, email, and password of at least 12 characters.
- Documented that production employee RAG remains disabled until the separate RAG service is reachable over HTTPS and its authentication is implemented and verified.
- Verified backend syntax and `git diff --check`. The Vite production build passed with the existing Browserslist age and bundle-size warnings. The frontend lint script is present but no ESLint configuration is available.
- No services were deployed. Hosting still requires the user's Render, Vercel, and MongoDB Atlas projects, and a separately secured production RAG service.
