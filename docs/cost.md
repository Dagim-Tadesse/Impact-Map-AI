# ImpactMap AI: Cost Governance & Free Tier Discipline

*Documentation of spending alarms, cost controls, and empirical pricing.*

---

## 1. Budget Alarms (Hand-Crafted in Console & Replicated via IaC)

Per the hackathon handbook and Section D2.3, two budgets are configured:

1. **Zero-Spend Budget**:
   - Template: Zero spend budget
   - Trigger: Alerts when actual spending exceeds $0.01 (above free allowance)
   - Channel: SNS / Email notification to Dagim

2. **Monthly Cost Budget ($5.00 Limit)**:
   - Template: Monthly cost budget
   - Amount: $5.00 USD
   - Threshold 1: 85% of budget ($4.25 actual spend) -> Alert
   - Threshold 2: 100% of budget ($5.00 actual spend) -> Alert
   - Threshold 3: 100% forecasted spend -> Alert
   - Channel: Email notification to Dagim

---

## 2. Architecture Cost Protections
- **API Rate Limiting**: API Gateway HTTP API stage throttling set to 10 requests/sec with burst of 20 to prevent runaway concurrency.
- **Worker Concurrency & Timeouts**: Worker Lambda function configured with 120-second hard timeout and zero asynchronous retries (`max_retry_attempts: 0`).
- **Deterministic DynamoDB Caching**: Identical scenarios hit DynamoDB cache instantly without spinning up worker containers.
- **Auto-Deleting Assets on Teardown**: S3 buckets configured with `auto_delete_objects=True` and `RemovalPolicy.DESTROY` for clean teardown.
