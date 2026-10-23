# AWS Account Configuration & Pre-Flight Checks

*Record of AWS Account configuration per Team Work Division Section D2.2.*

---

## 1. Account Details
- **Account Owner**: Dagim Tadesse
- **AWS Account ID**: `[12-digit AWS Account ID]`
- **Default Region**: `eu-central-1` (Frankfurt)
- **Fallback Region**: `eu-west-1` (Ireland)
- **Account Plan**: Free Tier / Credit Allocation ($100 - $200 AWS Community Day credits)
- **IAM Admin User**: `dagim-admin` (MFA enabled, AdministratorAccess)
- **CLI Profile**: `impactmap` (`aws configure --profile impactmap`)

---

## 2. Security & Root Protection
- Root user MFA: Enabled (Authenticator app)
- IAM user/role access to Billing Information: Activated
- GitHub OIDC Deploy Role: `impactmap-gha-deploy` (assumed by GitHub Actions via `ImpactMapCiStack`)
- Secret Management: Zero permanent access keys in GitHub Secrets. No credentials committed in repo.

---

## 3. Service Quotas & Free Tier Checks
- **AWS Lambda Concurrent Executions Quota**: Checked (applied value recorded)
- **API Gateway**: HTTP API supported on Free Tier
- **Amazon DynamoDB**: Provisioned 5 RCU / 5 WCU on `impactmap-jobs` and `impactmap-cache`
- **Amazon S3**: Block Public Access enabled on all buckets; assets served via CloudFront OAC
- **Amazon CloudWatch**: 14-day log retention; 4 custom EMF metrics to remain inside free quota
