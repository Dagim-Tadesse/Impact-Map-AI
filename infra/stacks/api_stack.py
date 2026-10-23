from pathlib import Path
from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack
from aws_cdk import aws_apigatewayv2 as apigw
from aws_cdk import aws_apigatewayv2_integrations as integrations
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_logs as logs
from aws_cdk import aws_s3 as s3
from constructs import Construct


class ImpactMapApiStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        data_bucket: s3.IBucket,
        jobs_table: dynamodb.ITable,
        cache_table: dynamodb.ITable,
        allowed_origin: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # CloudWatch Access Log Group (14-day retention per C3.4)
        api_log_group = logs.LogGroup(
            self, 'ApiLogGroup',
            log_group_name='/aws/vendedlogs/impactmap-http-api',
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY,
        )

        api_code_dir = Path(__file__).resolve().parents[2] / 'services' / 'api'

        # Lambda Function Log Group (14-day retention per C3.4)
        lambda_log_group = logs.LogGroup(
            self, 'ApiFunctionLogGroup',
            log_group_name='/aws/lambda/impactmap-api',
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # API Lambda Function (Python 3.12, x86_64, 512 MB, 15s timeout)
        self.api_function = lambda_.Function(
            self, 'ApiFunction',
            function_name='impactmap-api',
            runtime=lambda_.Runtime.PYTHON_3_12,
            architecture=lambda_.Architecture.X86_64,
            memory_size=512,
            timeout=Duration.seconds(15),
            handler='app.main.handler',
            code=lambda_.Code.from_asset(
                str(api_code_dir),
                bundling=None,
            ),
            environment={
                'IMPACTMAP_DATA_BUCKET': data_bucket.bucket_name,
                'IMPACTMAP_JOBS_TABLE': jobs_table.table_name,
                'IMPACTMAP_CACHE_TABLE': cache_table.table_name,
                'IMPACTMAP_ALLOWED_ORIGIN': allowed_origin,
                'IMPACTMAP_DATA_VERSION': 'd20261025a',
                'IMPACTMAP_MODEL_VERSION': 'm20261026a',
                'LOG_LEVEL': 'INFO',
            },
            log_group=lambda_log_group,
        )

        # Least-privilege IAM Permissions per Section D9.3
        jobs_table.grant_read_write_data(self.api_function)
        cache_table.grant_read_data(self.api_function)
        data_bucket.grant_read(self.api_function, 'data/*')

        # API Gateway HTTP API
        self.http_api = apigw.HttpApi(
            self, 'HttpApi',
            api_name='impactmap-http',
            cors_preflight=apigw.CorsPreflightOptions(
                allow_origins=[allowed_origin, 'http://localhost:5173'],
                allow_methods=[apigw.CorsHttpMethod.ANY],
                allow_headers=['*'],
                max_age=Duration.days(1),
            ),
        )

        # Default proxy integration to the FastAPI Lambda function
        api_integration = integrations.HttpLambdaIntegration(
            'FastApiIntegration',
            self.api_function,
        )

        self.http_api.add_routes(
            path='/{proxy+}',
            methods=[apigw.HttpMethod.ANY],
            integration=api_integration,
        )
        self.http_api.add_routes(
            path='/',
            methods=[apigw.HttpMethod.ANY],
            integration=api_integration,
        )

        # Stage Throttling (10 rps burst 20 per Section D4.2)
        default_stage = self.http_api.default_stage
        if default_stage:
            cfn_stage = default_stage.node.default_child
            if isinstance(cfn_stage, apigw.CfnStage):
                cfn_stage.default_route_settings = apigw.CfnStage.RouteSettingsProperty(
                    throttling_rate_limit=10.0,
                    throttling_burst_limit=20,
                )
                cfn_stage.access_log_settings = apigw.CfnStage.AccessLogSettingsProperty(
                    destination_arn=api_log_group.log_group_arn,
                    format=(
                        '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp",'
                        '"caller":"$context.identity.caller","user":"$context.identity.user",'
                        '"requestTime":"$context.requestTime","httpMethod":"$context.httpMethod",'
                        '"resourcePath":"$context.resourcePath","status":"$context.status",'
                        '"protocol":"$context.protocol","responseLength":"$context.responseLength"}'
                    ),
                )

        CfnOutput(self, 'ApiEndpoint', value=self.http_api.api_endpoint)
        CfnOutput(self, 'ApiFunctionArn', value=self.api_function.function_arn)
