```markdown
# Finsight API

This is the official backend API for the FinSight mobile application, developed by Bangkit 2024 Batch 2 Cohort Team C242‑PS460. This API provides financial data processing, user authentication, and file storage integration with Firebase and Google Cloud services.

---

## 🔗 API Documentation

The complete API route definitions, request/response formats, and parameters are documented here:  
📄 [API Reference (Google Docs)](https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub)

---

## 📁 Project Structure

```

finsight-api/
├── src/
│   ├── config/              # Firebase and service configuration
│   ├── controllers/         # Route handler logic
│   ├── middlewares/         # Authentication and error handlers
│   ├── routes/              # API route definitions
│   └── utils/               # Helper functions
├── index.js                 # Entry point – sets up Express and routes
├── .env                     # Your environment variables
├── Dockerfile               # Docker configuration
├── cloudbuild.yaml          # Google Cloud Build config
└── README.md

````

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Firebase Project](https://console.firebase.google.com/)
- [Google Cloud SDK](https://cloud.google.com/sdk) (for bucket creation and deployment)

---

### 🛠️ Local Development Setup

1. **Clone the Repository**

```bash
git clone https://github.com/hyperneutr0n/finsight-api.git
cd finsight-api
````

2. **Install Dependencies**

```bash
npm install
```

3. **Configure Environment Variables**

Create a `.env` file in the root directory with your Firebase and GCP credentials:

```env
PROJECT_ID=your-project-id

# Firebase Web App
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-app.appspot.com
FIREBASE_MESSAGING_ID=your-messaging-id
FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK
ADMIN_PRIVATE_KEY_ID=your-private-key-id
ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR-PRIVATE-KEY\n-----END PRIVATE KEY-----\n"
ADMIN_CLIENT_EMAIL=your-service-account-email
ADMIN_CLIENT_ID=your-admin-client-id
ADMIN_AUTH_URI=https://accounts.google.com/o/oauth2/auth
ADMIN_TOKEN_URI=https://oauth2.googleapis.com/token
ADMIN_AUTH_PROVIDER=https://www.googleapis.com/oauth2/v1/certs
ADMIN_CLIENT_CERT_URL=your-cert-url
ADMIN_UNIVERSE_DOMAIN=googleapis.com

# Storage bucket key
PROFILE_BUCKET_KEY=profile-bucket-key.json
```

> 🛡️ **Note**: Do not commit your `.env` file or private credentials to version control.

---

4. **Create a Storage Bucket on GCP**

```bash
gcloud storage buckets create gs://your-bucket-name --location=asia-southeast1
```

Make sure the service account you use has permission to access the bucket.

---

5. **Run the Development Server**

```bash
npm start
```

By default, the API will run on `http://localhost:3000`.

---

## 📦 Deployment

This project is container-ready and integrates with Google Cloud Build.

To build and deploy using Docker:

```bash
docker build -t finsight-api .
docker run -p 3000:3000 finsight-api
```

Or use Cloud Build:

```bash
gcloud builds submit --config cloudbuild.yaml
```

---

## ✅ Features

* 🔐 **Authentication** with Firebase Auth
* ☁️ **File Storage** using Google Cloud Storage (profile photos, etc.)
* 📊 **Financial Insight APIs** for prediction and tracking
* ⚙️ Modular structure with clear separation of concerns
* 🐳 Ready for Docker and Google Cloud deployment

---

## 📂 API Routes Overview

| Method | Endpoint          | Description                   |
| ------ | ----------------- | ----------------------------- |
| POST   | `/auth/register`  | Register a new user           |
| POST   | `/auth/login`     | Login with email and password |
| GET    | `/profile`        | Get user profile              |
| POST   | `/upload/profile` | Upload profile picture to GCS |
| POST   | `/predict`        | Run stock prediction          |
| ...    | *(and more)*      | See full list in API Docs     |

Refer to the [📄 Full API Docs](https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub) for detailed request/response structures.

---

## 🧑‍💻 Contributors

Team C242‑PS460 – Bangkit 2024

* [hyperneutr0n](https://github.com/hyperneutr0n) – Backend Engineer & Cloud Architect
* [Cupcake-Legend](https://github.com/Cupcake-Legend) – Backend Engineer & Cloud Architect

---

## 💬 Questions or Feedback?

Feel free to [open an issue](https://github.com/hyperneutr0n/finsight-api/issues) or reach out to us for support.

```
