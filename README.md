# Code Smiths, LLC

Professional website for Code Smiths, LLC — software engineering, cloud infrastructure, and AI platform consulting.

## Live

https://www.codesmithspdx.com

## Structure

```
codesmithspdx/
├── frontend/          # React 19 + TypeScript + Tailwind CSS + Vite
│   ├── src/components/   # Hero, Services, About, Our Work, Contact, Navbar, Footer
│   ├── src/data/         # Content data (services, projects, stats)
│   └── public/           # Favicon (SVG logo mark)
├── backend/           # Node.js Lambda handler (TypeScript)
│   └── src/handler.ts  # Contact form: validation, reCAPTCHA, Resend email
├── aws/ansible/       # Deployment pipeline
│   ├── deploy          # Entry point: ./aws/ansible/deploy
│   ├── playbooks/      # AWS S3 upload, Lambda update, CloudFront invalidation
│   └── group_vars/     # Config: bucket names, CloudFront ID, API keys
└── scripts/           # One-off AWS setup scripts (DNS, Resend, etc.)
```

## Development

### Prerequisites

- Node.js 20+ (via Volta recommended)
- AWS CLI configured (`AWS_PROFILE=codesmiths`)

### Frontend

```bash
cd frontend

npm install
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run Vitest tests
npm run lint         # Run Oxlint
```

### Backend (Lambda)

```bash
cd backend

npm install
npm run build        # TypeScript + esbuild bundle for Lambda
```

## Deployment

The site is deployed via Ansible:

```bash
./aws/ansible/deploy
```

This builds both frontend and backend, uploads to S3, updates the Lambda function, and invalidates the CloudFront cache.

### Manual AWS Setup (one-time)

If deploying to a fresh AWS account, run:

```bash
./scripts/setup-aws.sh codesmithspdx.com "<recaptcha-secret-key>"
```

This creates the S3 bucket, IAM role, Lambda function, API Gateway, and CloudFront distribution.

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_RECAPTCHA_SITE_KEY` | Frontend `.env.production` | reCAPTCHA v3 site key |
| `VITE_API_URL` | Frontend `.env.production` | Lambda/API Gateway endpoint |
| `RESEND_API_KEY` | Lambda env | Resend API key for email delivery |
| `RECAPTCHA_SECRET_KEY` | Lambda env | reCAPTCHA v3 secret key |

## Testing

```bash
cd frontend && npm run test
```

6 tests covering the Contact form: validation, submission, success/error states.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Form handler | Node.js 20, Resend, reCAPTCHA v3 |
| Hosting | AWS S3 (static) + CloudFront + Lambda |
| Deploy | Ansible |
| Lint | Oxlint |
| Tests | Vitest |

## License

[Apache-2.0](LICENSE)
