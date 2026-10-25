# ImpactMap AI - Security & Least Privilege Documentation

> **AWS Community Day 2026 Hackathon**  
> **Security Baseline**: Aligned with AWS Well-Architected Security Pillar and `cdk-nag` `AwsSolutionsChecks`.

---

## 1. Zero Stored Secrets & OIDC Authentication
- **No Hardcoded API Keys or Passwords**: The entire Git history is clean of long-lived access keys, private database passwords, and tokens.
- **GitHub Actions OIDC (`ImpactMapCiStack`)**: Continuous integration and deployment use temporary AWS STS credentials via OpenID Connect (OIDC) federated role assumptions (`RoleArn`). No IAM static access keys are stored in GitHub Secrets.

---

## 2. Principle of Least Privilege (IAM)
Each architectural component operates strictly within its scoped boundary:

| Identity / Role | Scoped Permissions | Denied Actions |
| :--- | :--- | :--- |
| **ApiLambdaRole** | Read-only DynamoDB job status, read S3 data bucket, write CloudWatch logs. | No database schema modification, no IAM alterations. |
| **WorkerExecutionRole** | Read/write DynamoDB jobs table, read S3 DEM/graph caches, write scenario results. | No access to user tables or public routing. |
| **CloudFront OAC** | Read-only `s3:GetObject` on private web and data buckets. | Direct public S3 bucket access is blocked (`BlockPublicAccess.BLOCK_ALL`). |

---

## 3. Network & API Security
- **Strict Cross-Origin Resource Sharing (CORS)**: Configured to accept explicit origins with locked allowed methods (`GET`, `POST`, `OPTIONS`) and headers (`Content-Type`, `x-request-id`).
- **Input Validation & Sanitization**: All incoming scenario payloads are strictly parsed and validated against Pydantic models with type bounds (e.g. non-negative rainfall values, clamped coordinates).
- **Throttling & Abuse Prevention**: API Gateway stages enforce rate limits (100 req/sec sustained, 200 burst) to mitigate denial-of-service risks.

---

## 4. Encryption
- **Data in Transit**: Enforced TLS 1.3 across all public endpoints (Render.com HTTPS, CloudFront distributions).
- **Data at Rest**: S3 data and web buckets use AWS KMS / AES-256 managed encryption (`S3_MANAGED`). Supabase PostgreSQL storage is encrypted at rest.

---

## 5. Security Scanning & Tooling
- **Secret Scanning**: Scanned via Gitleaks baseline before each pull request merge.
- **IaC Compliance (`cdk-nag`)**: All CDK infrastructure stacks in `infra/` synthesize against `AwsSolutionsChecks` rulesets with documented suppressions.
