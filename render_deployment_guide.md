# Render Deployment Guide

This guide details how to deploy the BankEase Full Stack application on the **Render** cloud platform. Since the frontend and backend are hosted on separate URLs on Render, this guide explains how they connect using environment variables and CORS headers.

---

## 🏗️ Deployment Topology

```text
React 19 Frontend (Static Site)    ---> https://bankease.onrender.com
     │
     └── [API HTTP Requests] ───> Spring Boot Backend (Web Service) ---> https://bankease-api.onrender.com
                                       │
                                       ├── [Cache] ──────> Redis (Render Redis Cache)
                                       └── [Database] ───> MySQL (Render Docker or Aiven MySQL)
```

---

## 🗄️ Step 1: Deploy the Databases

### Option A: Free External MySQL (Recommended for speed)
Since Render does not offer a native MySQL managed database on the free tier (only PostgreSQL), we recommend using a free cloud MySQL provider such as **Aiven.io** or **Clever Cloud**.
1. Create a free account on [Aiven](https://aiven.io/) or [Clever Cloud](https://www.clever-cloud.com/).
2. Launch a free **MySQL** instance.
3. Save the connection details: Host, Port, Database Name, Username, and Password.

### Option B: Deploy MySQL on Render via Docker
1. Click **New +** on the Render Dashboard and select **Web Service**.
2. Connect this repository.
3. Set **Root Directory** to `.` (the workspace root).
4. Select runtime **Docker**.
5. Set environment variables:
   * `MYSQL_ROOT_PASSWORD`: `pandi`
   * `MYSQL_DATABASE`: `bankease_db`
6. Add a **Disk** mount in the Render service settings:
   * Mount Path: `/var/lib/mysql`
   * Size: `1 GB` (minimum)
7. Save. Render will host your MySQL instance. Note its internal host name (e.g. `mysql-service`).

---

## 🔴 Step 2: Deploy Render Redis
1. Click **New +** on the Render Dashboard and select **Redis**.
2. Choose a name (e.g., `bankease-redis`).
3. Select the free plan or standard plan.
4. Once active, copy the **Internal Redis Connection String** (e.g., `redis://red-xxxxxxxxxx:6379`).

---

## ☕ Step 3: Deploy the Spring Boot Backend (Web Service)
1. Click **New +** on the Render Dashboard and select **Web Service**.
2. Connect your GitHub repository.
3. In the creation wizard, configure these values:
   * **Name**: `bankease-backend`
   * **Runtime**: `Docker` (Render will build the backend using the Dockerfile inside `/Backend`)
   * **Root Directory**: `Backend` *(This ensures Render builds from the backend directory)*
4. Expand **Environment Variables** and add the following keys:
   | Key | Value / Source |
   |-----|----------------|
   | `SERVER_PORT` | `8082` |
   | `DB_TYPE` | `mysql` |
   | `DB_HOST` | *(Your MySQL host from Step 1, e.g. Aiven host or `bankease-mysql`)* |
   | `DB_PORT` | *(Your MySQL port, e.g. `3306`)* |
   | `DB_NAME` | `bankease_db` |
   | `DB_USERNAME` | `root` |
   | `DB_PASSWORD` | *(Your MySQL database password)* |
   | `JWT_SECRET` | `70af33bb83b54432a58b88f344bfb2298e6b1897e93081e77f08c39e14a7e93f` *(or any strong 64-char key)* |
   | `JWT_EXPIRATION_MS` | `900000` |
   | `SPRING_DATA_REDIS_URL` | *(The internal connection string copied from Step 2)* |
   | `CORS_ALLOWED_ORIGINS` | `https://<your-frontend-domain>.onrender.com` *(Replace this with your React frontend static site URL once created)* |
5. Save and deploy. Note the generated Web Service URL (e.g., `https://bankease-api.onrender.com`).

---

## ⚛️ Step 4: Deploy the React Frontend (Static Site)
1. Click **New +** on the Render Dashboard and select **Static Site**.
2. Connect your GitHub repository.
3. Configure the following values:
   * **Name**: `bankease-portal`
   * **Root Directory**: `frontend` *(Enforces building from the frontend directory)*
   * **Build Command**: `npm run build`
   * **Publish Directory**: `dist`
4. Expand **Environment Variables** and add the following key:
   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | `https://bankease-api.onrender.com` *(The URL of your Backend Web Service generated in Step 3)* |
5. Click **Create Static Site**.
6. Copy the URL of your static site (e.g., `https://bankease-portal.onrender.com`).

### 🔄 Critical Connection Loop: CORS update
Once your frontend Static Site URL is generated (e.g., `https://bankease-portal.onrender.com`), go back to your **Backend Web Service settings**:
1. Locate the `CORS_ALLOWED_ORIGINS` environment variable.
2. Update its value to your exact frontend domain: `https://bankease-portal.onrender.com`.
3. Save changes. Render will automatically redeploy the backend with the allowed headers, connecting the frontend to the backend without CORS blocks!
