import json
from aws_cdk import CfnOutput, Stack
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3deploy
from constructs import Construct


class ImpactMapConfigStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        web_bucket: s3.IBucket,
        distribution: cloudfront.IDistribution,
        api_endpoint: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        config_data = {
            'api_base_url': api_endpoint.rstrip('/'),
            'data_base_url': f'https://{distribution.distribution_domain_name}/data',
            'region_id': 'pilot_01',
            'data_version': 'd20261025a',
            'model_version': 'm20261026a',
            'app_version': '9fa31c2',
            'features': {
                'correlated_mode': False,
                'landslide': False,
                'forecast': False,
                'accounts': False,
            },
        }

        # Deploy config.json to web bucket with prune=False
        s3deploy.BucketDeployment(
            self, 'DeployRuntimeConfig',
            sources=[s3deploy.Source.data('config.json', json.dumps(config_data, indent=2))],
            destination_bucket=web_bucket,
            distribution=distribution,
            distribution_paths=['/config.json'],
            prune=False,
        )

        CfnOutput(self, 'ConfigJsonUrl', value=f'https://{distribution.distribution_domain_name}/config.json')
