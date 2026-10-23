# MODULE_INFRA (owner: Dagim)

## Status
In progress

## What is built
- `infra/stacks/ci_stack.py`: GitHub OIDC Deploy Role stack (`ImpactMapCiStack`) allowing GitHub Actions to deploy without stored AWS credentials.
- `infra/stacks/data_stack.py`: `ImpactMapDataStack` creating encrypted S3 data bucket with CloudFront OAC policy, plus DynamoDB `impactmap-jobs` (TTL) and `impactmap-cache` tables.
- `infra/stacks/web_stack.py`: `ImpactMapWebStack` creating private web bucket and CloudFront distribution with dual origins (`/` to web, `/data/*` to data bucket).
- `infra/stacks/api_stack.py`: `ImpactMapApiStack` deploying FastAPI Lambda function and API Gateway HTTP API with stage throttling and CloudWatch logging.
- `infra/stacks/config_stack.py`: `ImpactMapConfigStack` deploying runtime `/config.json` with CloudFront invalidation.
- `infra/app.py`: Integrated CDK application passing `cdk-nag` `AwsSolutionsChecks` with documented security suppressions.

## How to test
- Run `cd infra; cdk synth --quiet`. All 5 stacks synthesize cleanly with zero errors.

## Known issues
- None yet.
