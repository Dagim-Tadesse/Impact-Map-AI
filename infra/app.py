import os
import aws_cdk as cdk
from cdk_nag import AwsSolutionsChecks, NagSuppressions

from stacks.api_stack import ImpactMapApiStack
from stacks.ci_stack import ImpactMapCiStack
from stacks.config_stack import ImpactMapConfigStack
from stacks.data_stack import ImpactMapDataStack
from stacks.web_stack import ImpactMapWebStack

app = cdk.App()

account = os.environ.get('CDK_DEFAULT_ACCOUNT', os.environ.get('AWS_ACCOUNT_ID', '123456789012'))
region = os.environ.get('CDK_DEFAULT_REGION', os.environ.get('AWS_REGION', 'eu-central-1'))
env = cdk.Environment(account=account, region=region)

github_repo = os.environ.get('GITHUB_REPOSITORY', 'Dagim-Tadesse/Impact-Map-AI')

# 1. CI Stack (Manual deploy once from laptop for GitHub OIDC)
ci_stack = ImpactMapCiStack(
    app, 'ImpactMapCiStack',
    github_repo=github_repo,
    env=env,
)

# 2. Data Stack (S3 data bucket + DynamoDB tables)
data_stack = ImpactMapDataStack(
    app, 'ImpactMapDataStack',
    env=env,
)

# 3. Web Stack (S3 web bucket + CloudFront distribution)
web_stack = ImpactMapWebStack(
    app, 'ImpactMapWebStack',
    data_bucket=data_stack.data_bucket,
    env=env,
)

# 4. API Stack (API Gateway HTTP API + FastAPI Lambda)
api_stack = ImpactMapApiStack(
    app, 'ImpactMapApiStack',
    data_bucket=data_stack.data_bucket,
    jobs_table=data_stack.jobs_table,
    cache_table=data_stack.cache_table,
    allowed_origin=f'https://{web_stack.distribution.distribution_domain_name}',
    env=env,
)

# 5. Config Stack (Runtime /config.json deployment)
config_stack = ImpactMapConfigStack(
    app, 'ImpactMapConfigStack',
    web_bucket=web_stack.web_bucket,
    distribution=web_stack.distribution,
    api_endpoint=api_stack.http_api.api_endpoint,
    env=env,
)

# Global Resource Tags per CONTRACTS.md C3.4
for stack in [ci_stack, data_stack, web_stack, api_stack, config_stack]:
    cdk.Tags.of(stack).add('Project', 'ImpactMap')
    cdk.Tags.of(stack).add('Owner', 'dagim')

# cdk-nag Security Checks
cdk.Aspects.of(app).add(AwsSolutionsChecks(verbose=True))

# Documented Nag Suppressions per Section D4.2 & D10
NagSuppressions.add_stack_suppressions(ci_stack, [
    {'id': 'AwsSolutions-IAM5', 'reason': 'OIDC deploy role assumes scoped CDK bootstrap roles with wildcard prefix.'}
])
NagSuppressions.add_stack_suppressions(data_stack, [
    {'id': 'AwsSolutions-S1', 'reason': 'Server access logging omitted to stay strictly inside AWS free-tier storage limits.'},
    {'id': 'AwsSolutions-DDB3', 'reason': 'Ephemeral hackathon cache and job tables with TTL; point-in-time recovery disabled to avoid cost.'}
])
NagSuppressions.add_stack_suppressions(api_stack, [
    {'id': 'AwsSolutions-APIG4', 'reason': 'Public API Gateway for hackathon evaluation in P0; user auth stack is P1.'},
    {'id': 'AwsSolutions-L1', 'reason': 'Python 3.12 pinned per project specification and worker container parity.'},
    {'id': 'AwsSolutions-IAM5', 'reason': 'Data bucket read access is scoped to data/* prefix; CloudWatch logs write permissions.'},
    {'id': 'AwsSolutions-IAM4', 'reason': 'AWS managed Lambda execution policy used for standard CloudWatch logs write.'}
])
NagSuppressions.add_stack_suppressions(web_stack, [
    {'id': 'AwsSolutions-S1', 'reason': 'Server access logging omitted to stay strictly inside AWS free-tier storage limits.'},
    {'id': 'AwsSolutions-CFR3', 'reason': 'CloudFront access logging omitted to stay strictly inside AWS free-tier storage limits.'},
    {'id': 'AwsSolutions-CFR4', 'reason': 'Default CloudFront viewer certificate is used during hackathon phase without custom domain.'},
    {'id': 'AwsSolutions-CFR1', 'reason': 'Geo restriction not required for public humanitarian demo tool.'},
    {'id': 'AwsSolutions-CFR2', 'reason': 'WAF not included to remain within AWS free tier limits; throttling enforced at API Gateway.'},
    {'id': 'AwsSolutions-IAM4', 'reason': 'CDK BucketDeployment internal custom resource uses AWSLambdaBasicExecutionRole.'},
    {'id': 'AwsSolutions-IAM5', 'reason': 'CDK BucketDeployment construct requires S3 permissions to sync web assets.'},
    {'id': 'AwsSolutions-L1', 'reason': 'CDK BucketDeployment internal Lambda handler version.'}
])
NagSuppressions.add_stack_suppressions(config_stack, [
    {'id': 'AwsSolutions-IAM4', 'reason': 'CDK BucketDeployment internal custom resource uses AWSLambdaBasicExecutionRole.'},
    {'id': 'AwsSolutions-IAM5', 'reason': 'CDK BucketDeployment construct requires S3 permissions to write config.json.'},
    {'id': 'AwsSolutions-L1', 'reason': 'CDK BucketDeployment internal Lambda handler version.'}
])

app.synth()
