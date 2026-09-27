# أمانك الرقمي | Amanak Alraqami

Amanak Alraqami is an interactive digital-safety learning platform designed for children, parents, and administrators.

The platform teaches children safer digital behavior through adventures, questions, assessments, points, badges, and progress tracking while giving parents and administrators secure tools for monitoring and management.

---

## Project Status

The application currently includes completed functional flows for:

- Child authentication and learning experience
- Parent registration and authentication
- Parent email verification
- Parent-to-child linking
- Parent dashboard
- Admin dashboard and management tools
- Adventures and questions
- Assessments
- Badges and rewards
- Media management
- Analytics
- Security and audit logs
- Password reset
- Two-factor authentication
- Recovery codes
- Responsive desktop, tablet, and mobile interfaces
- Progressive Web App support
- Offline application shell
- PWA update notifications

Backend automated test status:

```text
83 tests
83 passed
0 failed
```

---

## Technology Stack

### Frontend

- React 19
- React Router
- Vite
- Axios
- Lucide React
- QRCode
- vite-plugin-pwa
- Workbox

### Backend

- Node.js
- Express 5
- PostgreSQL
- pg
- bcrypt
- JSON Web Tokens
- Joi
- Helmet
- CORS
- express-rate-limit
- Multer
- Sharp
- Nodemailer
- otplib

---

## Application Roles

### Child

Children can authenticate, access their dashboard, complete digital-safety adventures, answer questions, complete assessments, earn points, unlock badges, and continue previous progress.

### Parent

Parents can register using email, verify their account, authenticate securely, link children, review child progress, view assessment information, use password recovery, and enable two-factor authentication.

### Administrator

Administrators can manage students, adventures, questions, badges, assessments, media, analytics, settings, security information, and audit records.

---

## Security

Amanak Alraqami includes several application-security protections:

- HttpOnly authentication cookies
- Secure cookies in production
- SameSite cookie protection
- Helmet security headers
- Restricted CORS
- Production Origin checking
- Reverse-proxy support
- Authentication and security-sensitive rate limiting
- Enumeration-safe password reset responses
- TOTP two-factor authentication
- Recovery codes
- TOTP replay prevention
- Hashed password-reset tokens
- Parent-child authorization checks
- Secure media validation and re-encoding
- Controlled application error responses

---

## Requirements

```text
Node.js >= 22.12
PostgreSQL
npm
```

The project has been tested with Node.js 24.

---

## Install Backend

```bash
cd server
npm install
```

## Install Frontend

```bash
cd client
npm install
```

---

## Environment Configuration

Create:

```text
server/.env
```

Use:

```text
server/.env.example
```

as the template.

Never commit real database passwords, JWT secrets, SMTP passwords, administrator passwords, two-factor secrets, recovery codes, or encryption keys.

---

## Start Backend

```bash
cd server
npm run dev
```

Default:

```text
http://localhost:3000
```

---

## Start Frontend

```bash
cd client
npm run dev
```

Default:

```text
http://localhost:5173
```

---

## Backend Tests

```bash
cd server
npm test
```

Expected:

```text
tests 83
pass 83
fail 0
```

---

## Frontend Production Build

```bash
cd client
npm run build
```

Preview:

```bash
npm run preview
```

---

## Progressive Web App

The application includes:

- Web App Manifest
- 192x192 icon
- 512x512 icon
- Apple touch icon
- Service worker
- Workbox precaching
- Offline application shell
- Update detection
- User-controlled update notification

Authenticated API responses are intentionally not stored in the service-worker cache.

---

## Database

The application uses PostgreSQL.

Development, testing, and production databases must remain separate.

Database migrations must be applied before production launch.

Production deployment must also include database backup and recovery procedures.

---

## Media Storage

Local development can use local media storage.

Production should use durable persistent storage or object storage.

Do not depend on ephemeral server storage for production uploads.

---

## Production Architecture

Planned deployment architecture:

```text
Vercel Frontend
       |
       v
Render Node.js API
       |
       v
PostgreSQL
```

A custom-domain configuration is preferred.

Example:

```text
app.example.com
api.example.com
```

Production must use HTTPS.

`CLIENT_URL` must match the exact production frontend origin.

---

## Production Checklist

Before public launch, complete:

- Production PostgreSQL database
- Database migrations
- Database backups
- Persistent media storage
- Production SMTP
- Production environment variables
- New production secrets
- HTTPS and domains
- Monitoring and logging
- CI/CD
- Accessibility review
- Performance optimization
- Privacy Policy
- Terms of Use
- Parental consent process
- Data-retention policy
- Account/data deletion process
- Final end-to-end UAT

---

## Privacy and Child Safety

Before public use, the platform should include appropriate:

- Privacy Policy
- Terms of Use
- Parental consent
- Data-minimization procedures
- Data-retention rules
- Account and data deletion
- Child-safety procedures

Applicable legal requirements should be reviewed for each jurisdiction where the service is offered.

---

## Repository

https://github.com/saifjeb/Amanak-Alraqami

---

## License

The backend package currently declares the ISC license.

Final licensing requirements should be reviewed before public distribution.

