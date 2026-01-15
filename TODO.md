## Completed

### Phase 0+1 (Bug Fixes & Polish)
- [x] ~~Loading Bar is not UI is not aligned.~~ Fixed in LoadingSpinner.tsx
- [x] ~~Add Dev logs, to see which API is being used~~ Added provider badge and console logs
- [x] ~~Viewing the studies from history still doesnt work.~~ Fixed with useSearchParams in HomePage
- [x] ~~Import feature with validation~~ Added Zod validation for JSON imports

### Phase 2 (Client-Side Architecture)
- [x] ~~Allow users to key in their own API key, this data will persist in their browser~~ API key settings modal in Header
- [x] ~~Make everything Client side so it's not necessary to have load balancing~~ OpenRouter direct calls from browser when API keys configured

### Phase 3 (New Features)
- [x] ~~Add ability to create/edit study without AI~~ "New Blank Study" button on home page
- [x] ~~Add ability to parse the JSON studies into a template for a word doc~~ "Export" button generates .docx file
- [x] ~~API Endpoints for additional functions such as to enhance/modify~~ AI enhance button on question cards (sparkles icon, client-side only)

## Future Enhancements
- Add more LLM provider options via backend proxy (Groq, Gemini, Claude)
- Enhanced Word export templates with more formatting options
- Regenerate entire sections with AI
- Share studies via URL
