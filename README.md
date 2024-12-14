# Finsight API

This project is an API for mobile app FinSight created by Bangkit 2024 batch 2 Cohort team C242-PS460.

## API Routing

This is API routing, request query, body, and return format can be seen read [here](https://docs.google.com/document/d/e/2PACX-1vR2o9aVKf3ExNOvtks7p-lq_dJxUiUhDX3mbnRAdzmIfufrhIYKmMB8k-BsuxuYQNxGqeNAZYvzeh2e/pub)

## Prerequisites

- Node.js
- Firebase Project

## Local Development Setup

1. Clone the repository:

```bash
git clone https://github.com/hyperneutr0n/finsight-api.git
```

2. Install dependecies:

```bash
cd finsight-api
npm install
```

3. Setup your environment variable in `.env` file in the root directory with credentials you obtained from firebase:
```env
PROJECT_ID= #your gcp project id


#Firebase 
FIREBASE_API_KEY= # your firebase api key
FIREBASE_AUTH_DOMAIN= # your firebase auth domain
FIREBASE_STORAGE_BUCKET= # your firebase storage bucket
FIREBASE_MESSAGING_ID= # your firebase messaging id
FIREBASE_APP_ID= # your firebase app id

#ADMIN
ADMIN_PRIVATE_KEY_ID= # your firebase admin private key id
ADMIN_PRIVATE_KEY= # your firebase admin private key
ADMIN_CLIENT_EMAIL= # your firebase service account email
ADMIN_CLIENT_ID= # your admin client id
ADMIN_AUTH_URI="https://accounts.google.com/o/oauth2/auth"
ADMIN_TOKEN_URI="https://oauth2.googleapis.com/token"
ADMIN_AUTH_PROVIDER="https://www.googleapis.com/oauth2/v1/certs"
ADMIN_CLIENT_CERT_URL= # your firebase admin client certification url
ADMIN_UNIVERSE_DOMAIN="googleapis.com"


PROFILE_BUCKET_KEY="profile-bucket-key.json"
```

4. Create a bucket with unique name in your GCP Project
<!-- iki bucket piye ngmg e lmao -->
```bash
gcloud storage buckets create gs://your-bucket-name --location your-desired-location
```

5. 