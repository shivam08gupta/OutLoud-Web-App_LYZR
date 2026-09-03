# 🎙️ OutLoud

## AI-powered speaking practice for interview confidence
**OutLoud** is an AI-powered spoken English interview coach designed to help job seekers practice answering interview questions **out loud**, receive focused feedback, and retry their answers in their own words.
> The product doesn't write your answer. It helps you speak it better.

🔗 **Live MVP**: https://shivam-outloud-speaking-practice.architect.space/
📊 **Product Case Study**: https://app.notion.com/p/Capstone-Project-OutLoud-3c2a5115b1e2803381a0ec7dc65958e8?source=copy_link
🎥 **Demo**: LINK

## 🚨 The Problem
Many job seekers understand English reasonably well but struggle when they have to **speak spontaneously under interview pressure**.
Through user interviews, we found three recurring problems:
- Users freeze when they cannot immediately find the right word.
- Thoughts that are clear internally don't always translate into fluent speech.
- Fear of being judged makes users avoid speaking practice.

The problem isn't always **knowing English**.
It's being able to **think → speak → recover → improve** in real time.

## 💡 The Solution
OutLoud creates a low-pressure environment where users can repeatedly practice realistic interview questions.
**The core loop
Question → Think → Speak → Submit → AI Feedback → Try Again**

Each session is intentionally short and focused so that users can practice repeatedly rather than consume passive English-learning content.

## 🎯 MVP

The V1 MVP focuses specifically on Job Interview speaking practice.

What users can do
1. Select Job Interview practice.
2. Choose their target role.
3. Receive a realistic interview question.
4. Think and answer the question aloud.
5. Submit their spoken response.
6. Receive personalized AI feedback.
7. Retry the same question using their own words.

### One Practice Session

A typical session takes approximately 2–4 minutes.
A session is considered completed when:
> The user submits a spoken response and receives/views personalized AI feedback.

The minimum working response duration is approximately 30 seconds, which can be adjusted based on user testing.

## 🤖 AI-Powered Feedback
OutLoud uses AI for two key parts of the experience:
1. **Speech → Transcript**
The user's spoken response is processed using **Gemini 3.6 Flash** to generate a transcript.

2. Transcript → Coaching
The transcript is passed to the Lyzr Feedback Coach Agent, configured with OpenAI GPT-4o-mini, which generates structured feedback.

The feedback focuses on:
✅ **What went well**
What the user did effectively.

🎯 **Focus Areas**
A maximum of 2 priority improvements.

💬 **You said → Try → Why**
Instead of simply saying something is wrong, OutLoud explains:
You said: ...
Try: ...
Why: ...
The goal is to make feedback **actionable and easy to apply on the next attempt**.

## 🛡️ AI Guardrails

OutLoud is designed as a **coach, not an answer generator**.

The AI:

- Gives a maximum of 2 priority improvements.
- Bases feedback on the user's actual transcript.
- Uses a supportive, non-judgmental tone.
- Does not judge intelligence or employability.
- Does not generate a complete model answer.
- Does not interrupt users while speaking.
- Avoids evaluating appearance, body language, or eye contact.
- Does not treat accent differences as a measure of speaking ability.

## 🧩 Product Decisions
Some important decisions made during MVP development:

| Decision | Why |
| --- | --- |
| Job Interview only for V1 |	Keep the MVP focused on one high-value use case |
| Camera optional	| Adds realism without forcing privacy/friction |
| Post-response feedback | Avoid interrupting the user's speaking flow |
| Maximum 2 improvements | Prevent overwhelming users |
| You said → Try → Why	| Make feedback actionable |
| Try Again as primary CTA	| Turn feedback into immediate practice |
| No complete model answer	| Coach the user's speaking instead of writing for them |
| No leaderboard/percentile	| Avoid unnecessary judgment/comparison |
| Low-pressure retry experience	| Address fear of judgment found in research |

## 🏗️ Product Architecture
                   ┌──────────────────┐
                   │     User         │
                   │  Speaks Answer   │
                   └────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │  Audio Capture    │
                  │ getUserMedia +    │
                  │ MediaRecorder     │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ /api/transcribe   │
                  │     + FFmpeg      │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ Gemini 3.6 Flash  │
                  │ Speech → Text     │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ Lyzr Feedback     │
                  │ Coach Agent       │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ OpenAI GPT-4o-mini│
                  │ Feedback Generation│
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ Structured AI     │
                  │ Feedback          │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │   User retries    │
                  └───────────────────┘

## 🛠️ Tech Stack
### Product / Frontend
- React / Next.js
- Responsive mobile-first UI
- Browser Media APIs
- getUserMedia
- MediaRecorder
### AI
- Google Gemini 3.6 Flash — speech transcription
- Lyzr Architect / Feedback Coach Agent — AI orchestration
- OpenAI GPT-4o-mini — feedback generation
### Backend / Infrastructure
- Next.js API routes
- FFmpeg for audio processing
- Lyzr database
- Authentication
### Analytics
- Mixpanel
- Practice funnel
- Weekly active users
- Repeat practice behavior

## 📊 Early Product Signals

Initial MVP analytics from Aug 24–31, 2026:

| Metric | Users |
| --- | --- |
| Total sign-ups	| 61
| Real users	| 58
| Practice started	| 43
| Recording started	| 34
| Response submitted	| 29
| AI feedback generated	| 28

### Practice Funnel
Practice Started       43
        ↓ 79.1%
Recording Started      34
        ↓ 85.3%
Response Submitted     29
        ↓ 96.6%
AI Feedback Generated  28

Overall:
**Practice Start → AI Feedback = 65.1%**

The biggest drop currently occurs at the **first speaking action**, which aligns with the core research insight that users often hesitate before speaking.
> Note: these are early MVP signals, not mature retention metrics.

## 🔬 User Research

Before building the MVP, I conducted **8 user interviews** with students, recent graduates, professionals, and other potential users.

**Key insight #1 — Confidence, not comprehension**
Users often understand English but struggle to produce it spontaneously.

**Key insight #2 — Thought → Speech breaks under pressure**
Hesitation, fillers, word-retrieval problems and long pauses become more noticeable during interviews.

**Key insight #3 — Fear of judgment drives avoidance**
Users wanted constructive feedback without feeling embarrassed or judged.

These insights directly shaped the MVP's **low-pressure practice + retry loop**.

## 📱 Mobile Reliability
Because spoken practice is the core experience, mobile reliability became an important engineering challenge.
Android browser testing exposed issues around:
- Microphone permissions
- Speech recognition
- MediaRecorder
- Audio processing
- Microphone contention
- Server-side transcription

The final approach uses:

getUserMedia
      ↓
MediaRecorder
      ↓
Audio Blob
      ↓
/api/transcribe
      ↓
FFmpeg
      ↓
Gemini

Android avoids competing microphone capture paths, while desktop behavior remains supported.

## 📈 Product Analytics

The MVP instruments the core practice funnel:
`practice_started`
`permissions_granted`
`recording_started`
`response_submitted`
`feedback_generated`
`retry_clicked`

These events are used to understand where users drop off and whether users return to practice.

## 🚀 Future Roadmap
### V1.1
Better onboarding
More interview question variety
Improved feedback quality
Better retry experience
More mobile reliability testing

### V2
Additional speaking scenarios:
📊 Presentation
🤝 Difficult Conversation
💬 Other real-world speaking situations

### Longer term
Personalized practice plans
Interview difficulty progression
Role-specific question sets
Longitudinal speaking improvement
More sophisticated coaching signals

## ⚠️ Current Limitations
OutLoud is an MVP, not a complete English-learning platform.
Currently it does not:
- Provide live grammar correction.
- Analyze body language.
- Score attractiveness/appearance/eye contact.
- Generate complete interview answers.
- Provide leaderboards or percentile rankings.
- Support all speaking scenarios.
- Claim statistically proven long-term improvement yet.

The current goal is simple:
> Help users speak, get useful feedback, and try again.

## 🧠 What I Learned
Building OutLoud was as much a **product experiment** as a technical project.
Some of the biggest learnings:
- The hardest part isn't generating AI feedback — it's getting users to start speaking.
- A smaller amount of actionable feedback can be more useful than a detailed evaluation.
- AI latency directly affects the perceived quality of the experience.
- Mobile microphone behavior needs real-device testing, not just browser emulation.
- Product analytics should be designed alongside the experience rather than added at the end.
- Early user behavior can challenge assumptions made during product discovery.

## 👨‍💻 Built By
**Shivam Gupta**
Product Manager | AI Product Builder

Built as part of the **Airtribe AI-First Product Management Program**.
For your particular capstone, this is much stronger than a README that only says “OutLoud is an AI English speaking application built using React and Gemini.” It demonstrates PM thinking + research + experimentation + AI implementation + engineering execution in one place.
