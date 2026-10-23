from aws_cdk import CfnOutput, RemovalPolicy, Stack
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_s3 as s3
from constructs import Construct


class ImpactMapDataStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 Data Bucket (Assets, Map Data, Model artifacts, Results)
        self.data_bucket = s3.Bucket(
            self, 'DataBucket',
            bucket_name=f'impactmap-data-{self.account}',
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=False,
            auto_delete_objects=True,
            removal_policy=RemovalPolicy.DESTROY,
            enforce_ssl=True,
        )

        # Allow CloudFront to read public data/* prefix via OAC
        from aws_cdk import aws_iam as iam
        self.data_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid='AllowCloudFrontServicePrincipalReadOnly',
                actions=['s3:GetObject'],
                resources=[self.data_bucket.arn_for_objects('data/*')],
                principals=[iam.ServicePrincipal('cloudfront.amazonaws.com')],
                conditions={
                    'StringEquals': {'aws:SourceAccount': self.account}
                },
            )
        )

        # DynamoDB Jobs Table
        self.jobs_table = dynamodb.Table(
            self, 'JobsTable',
            table_name='impactmap-jobs',
            partition_key=dynamodb.Attribute(
                name='job_id',
                type=dynamodb.AttributeType.STRING,
            ),
            time_to_live_attribute='expires_at',
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # DynamoDB Cache Table
        self.cache_table = dynamodb.Table(
            self, 'CacheTable',
            table_name='impactmap-cache',
            partition_key=dynamodb.Attribute(
                name='cache_key',
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=RemovalPolicy.DESTROY,
        )

        CfnOutput(self, 'DataBucketName', value=self.data_bucket.bucket_name)
        CfnOutput(self, 'JobsTableName', value=self.jobs_table.table_name)
        CfnOutput(self, 'CacheTableName', value=self.cache_table.table_name)
