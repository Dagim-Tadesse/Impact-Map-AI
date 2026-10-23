# ADR 0001: Selection of AWS Region (eu-central-1)

## Status
Accepted

## Date
2026-10-23

## Context
ImpactMap AI requires hosting compute, storage, caching, and serverless APIs on AWS while remaining strictly within the AWS Free Tier and promotional credit limits ($100–$200 USD).
Key criteria:
1. Low latency connection to Ethiopia.
2. Standard region requiring no special opt-in or regulatory approval.
3. Full support for AWS Lambda (Python 3.12, container images), Amazon S3, Amazon DynamoDB, Amazon API Gateway HTTP API, Amazon CloudFront, and Amazon CloudWatch.

## Decision
Select **Europe (Frankfurt) `eu-central-1`** as the default AWS deployment region.
- Fallback region: **Europe (Ireland) `eu-west-1`**.

## Consequences
- All CDK stacks, Lambda functions, S3 buckets, and DynamoDB tables default to `eu-central-1`.
- AWS CLI profile `impactmap` is configured with `eu-central-1`.
