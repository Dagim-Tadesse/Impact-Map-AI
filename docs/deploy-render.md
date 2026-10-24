# Deploying ImpactMap AI Backend to Render.com

This guide provides the simple, step-by-step instructions to deploy the FastAPI backend service on Render.com free tier, connecting directly to your GitHub repository and Supabase database.

---

## 1. Quick Setup via Render Dashboard

1. **Sign in to Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com/) and sign in with your GitHub account.

2. **Create New Web Service**:
   - Click **"New +"** (top right) $\to$ **"Web Service"**.
   - Select **"Build and deploy from a Git repository"** $\to$ Click **Next**.
   - Choose your repository: `Dagim-Tadesse/Impact-Map-AI`.

3. **Configure Service Settings**:
   - **Name**: `impactmap-api`
   - **Region**: `Frankfurt (EU Central)`
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Python 3` (or `Docker`)
   - **Build Command**:
     ```bash
     pip install -r services/api/requirements.txt && pip install -e packages/impactmap_core --no-deps
     ```
   - **Start Command**:
     ```bash
     uvicorn services.api.app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: **Free**

4. **Environment Variables**:
   Under **"Environment Variables"**, click **"Add Environment Variable"** and enter:

   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.12.8` | Recommended Python version |
   | `SUPABASE_URL` | `https://imcabquqwaczourzuwui.supabase.co` | Your Supabase project URL |
   | `SUPABASE_KEY` | *(Your anon public key from `.env`)* | Anon public API key |
   | `IMPACTMAP_ALLOWED_ORIGIN` | `*` | Allows Vercel frontend access |
   | `LOG_LEVEL` | `INFO` | Standard structured logging |

5. **Deploy**:
   - Click **"Create Web Service"**.
   - Render will build the container, install packages, and deploy the service.
   - Once deployment completes, your API will be live at:
     ```
     https://impactmap-api.onrender.com
     ```

---

## 2. Verify Your Live Deployment

Open your browser or terminal and test the following endpoints:

- **Health Check**:
  ```bash
  curl https://impactmap-api.onrender.com/health
  ```
  *Response*: `{"status":"ok","time":"..."}`

- **Model Card**:
  ```bash
  curl https://impactmap-api.onrender.com/model-card
  ```

- **Interactive Swagger Docs**:
  Open in browser:
  ```
  https://impactmap-api.onrender.com/docs
  ```

- **Demo Cascade**:
  ```bash
  curl https://impactmap-api.onrender.com/demo/index.json
  ```

---

## 3. Connecting the Frontend (Anon)

Provide Anon with your live Render API URL:
In `web/public/config.json`:
```json
{
  "api_base_url": "https://impactmap-api.onrender.com",
  "data_base_url": "https://impactmap-api.onrender.com/data",
  "region_id": "awash_01",
  "data_version": "d20261025a",
  "model_version": "m20261026a",
  "app_version": "4562453"
}
```
Anon can now deploy the frontend to Vercel pointing directly at your live Render API.
