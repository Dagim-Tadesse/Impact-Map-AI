from aws_cdk import CfnOutput, Duration, Stack
from aws_cdk import aws_iam as iam
from constructs import Construct


class ImpactMapCiStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, *, github_repo: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        provider = iam.OpenIdConnectProvider(
            self, 'GitHubOidc',
            url='https://token.actions.githubusercontent.com',
            client_ids=['sts.amazonaws.com'],
        )
        role = iam.Role(
            self, 'DeployRole',
            role_name='impactmap-gha-deploy',
            max_session_duration=Duration.hours(1),
            assumed_by=iam.WebIdentityPrincipal(
                provider.open_id_connect_provider_arn,
                conditions={
                    'StringEquals': {'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com'},
                    'StringLike': {'token.actions.githubusercontent.com:sub': f'repo:{github_repo}:ref:refs/heads/main'},
                },
            ),
        )
        # The role can only assume the CDK bootstrap deployment roles
        role.add_to_policy(iam.PolicyStatement(
            actions=['sts:AssumeRole'],
            resources=[f'arn:aws:iam::{self.account}:role/cdk-hnb659fds-*'],
        ))
        CfnOutput(self, 'DeployRoleArn', value=role.role_arn)
