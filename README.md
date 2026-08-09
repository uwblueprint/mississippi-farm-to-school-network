# Mississippi Farm to School Network

The [Mississippi Farm to School Network (MFSN)](https://www.mississippifarmtoschool.org/) is a statewide non-profit organization focused on increasing access to fresh, local produce for schools and other organizations. 

## What is the MFSN Platform?

This is a full-stack and mobile-friendly web application for the MFSN. Their focus is to help schools and farmers navigate procurement processes and strengthen local food systems across Mississippi. Our solution helps schools find local agricultural producers, manage farm-to-school programs, and promotes agricultural education while supporting local farmers and providing fresh, healthy food options for students.

### Technical Stack
- Frontend: SvelteKit
- Backend: Express + GraphQL
- Auth / files / app data: Firebase Auth, Cloud Storage, Cloud Firestore

## Getting Started (local, no Docker)

### Dependencies

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (LTS version)
* Firebase project with **Auth**, **Storage**, and **Firestore** enabled
* A Firebase Admin service-account key (Console → Project settings → Service accounts)

### Install & run

1. Backend env — copy [`backend/.env.example`](backend/.env.example) to `backend/.env` and set either:
   - `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json`, or
   - `FIREBASE_PROJECT_ID`, `FIREBASE_SVC_ACCOUNT_CLIENT_EMAIL`, `FIREBASE_SVC_ACCOUNT_PRIVATE_KEY`
2. Frontend env — ensure `frontend/.env` includes Firebase web config and optional `GRAPHQL_URL=http://localhost:3000/graphql`.
3. Start both processes:

```bash
cd backend && npm install && npm run dev
# separate terminal
cd frontend && npm install && npm run dev
```

- Frontend: http://localhost:5173  
- GraphQL: http://localhost:3000  

Deploy Firestore rules (from repo root) after enabling Firestore:

```bash
firebase deploy --only firestore:rules
```

Detailed onboarding notes: [Technical Onboarding](https://www.notion.so/uwblueprintexecs/Technical-Onboarding-2f710f3fb1dc80be8520d8eab6367860)

## Help

* Backend logs `Firebase Admin SDK not initialized` → service-account credentials are missing/empty in `backend/.env`.
* Frontend `TypeError: fetch failed` on `/api/farms` → backend not running, or `GRAPHQL_URL` still pointing at a Docker hostname.

## Authors

Erica Han  
[ericahan22](https://github.com/ericahan22)

Fiona Cai  
[@fiona-cai](https://x.com/fcaiona)

Sherry Tse  
[stse3](https://github.com/stse3)

Tina Xia  
tinazxia@gmail.com

Lukas Li  
[github](https://github.com/eatingfood142434)

Daniel Cheng  
dcheng6775@gmail.com

Lucas Jin  
[@LucasHJin](https://x.com/lucashjin)

Vidu Widyalankara  
[vidsterbroyo](https://vidsterbroyo.com)

Patrick Wei  
[github](https://github.com/patrick-zx-wei)

Tony Qiu  
[tony_q04](https://www.instagram.com/tony_q04/)
