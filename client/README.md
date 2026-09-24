# Amanak Alraqami — أمانك الرقمي

A polished bilingual React frontend for a child-focused digital-safety learning platform. The product includes distinct experiences for children, parents and administrators while sharing one Amanak visual system.

## Product design

- **Arabic is the default language** with a persistent **عربي / EN** switch.
- Full **RTL ↔ LTR** direction switching across public, child, parent and admin areas.
- Royal blue / navy Amanak identity with orange, mint, yellow and purple supporting accents.
- Child experience designed for two age groups: **8–10** and **11–14**.
- Illustrated school-style Amanak characters and six built-in adventure cover artworks.
- Admin-uploaded adventure images override the built-in covers; broken remote images fall back automatically.
- Responsive desktop, tablet and mobile navigation for every role.
- Dedicated loading, empty, error, invalid-route and 404 states.

## Child experience

- Registration and login
- Character/avatar selection
- Dynamic dashboard with points, progress, badges and adventure previews
- Adventure library with illustrated covers and progress states
- Adventure details and interactive question flow
- Pre-test and post-test assessments
- Badges and achievements
- Profile and parent linking
- Persistent child sidebar/topbar with language and account controls

## Parent experience

- Registration and login
- Parent overview dashboard
- Generate a child-link code
- Linked-child cards
- Detailed child progress, badges and assessment results
- Persistent parent navigation and bilingual interface

## Admin experience

- Secure admin login
- Professional admin dashboard
- Student management and student details
- Adventure create/edit/activate/deactivate/trash/restore/permanent-delete
- Adventure image assignment
- Question management for adventure, pre-test and post-test questions
- Media upload/library/trash/restore/permanent-delete
- Shared professional admin navigation with bilingual controls

## Backend integration

The existing Amanak API contracts are preserved. The frontend expects an API base URL through:

```env
VITE_API_URL=http://localhost:3000/api
```

Copy `.env.example` to `.env` for local development and replace the URL for production hosting.

## Install and run

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run lint -- --quiet
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Main stack

- React 19
- React Router
- Axios
- Lucide React
- Vite
- Plain responsive CSS

## Language behavior

Language preference is stored in `localStorage` under `amanak-language`. The application updates the document `lang` and `dir` attributes so Arabic uses RTL layout and English uses LTR layout.

## Adventure image behavior

For each adventure:

1. Use the image assigned through Admin when available.
2. Otherwise use the matching built-in Amanak adventure illustration.
3. If an assigned image fails to load, automatically fall back to the built-in illustration.

This prevents broken image cards in the child experience.

## Production notes

- `.env` is intentionally not included in the project archive.
- `.env.example` is included.
- `node_modules` and `dist` should not be committed.
- Node.js **22.12+** is recommended for the included Vite version.
