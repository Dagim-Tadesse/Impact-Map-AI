from pathlib import Path
from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3deploy
from constructs import Construct


class ImpactMapWebStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, *, data_bucket: s3.IBucket, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 Web Hosting Bucket (Private)
        self.web_bucket = s3.Bucket(
            self, 'WebBucket',
            bucket_name=f'impactmap-web-{self.account}',
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=False,
            auto_delete_objects=True,
            removal_policy=RemovalPolicy.DESTROY,
            enforce_ssl=True,
        )

        # Imported Data Bucket to prevent cross-stack CloudFront policy cycle
        imported_data_bucket = s3.Bucket.from_bucket_attributes(
            self, 'ImportedDataBucket',
            bucket_name=data_bucket.bucket_name,
            bucket_regional_domain_name=data_bucket.bucket_regional_domain_name,
        )

        # Origins with OAC
        web_origin = origins.S3BucketOrigin.with_origin_access_control(self.web_bucket)
        data_origin = origins.S3BucketOrigin.with_origin_access_control(imported_data_bucket)

        # CloudFront Distribution
        self.distribution = cloudfront.Distribution(
            self, 'Distribution',
            default_root_object='index.html',
            default_behavior=cloudfront.BehaviorOptions(
                origin=web_origin,
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD,
                compress=True,
            ),
            additional_behaviors={
                '/data/*': cloudfront.BehaviorOptions(
                    origin=data_origin,
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                    cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD,
                    compress=True,
                ),
            },
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path='/index.html',
                    ttl=Duration.seconds(0),
                ),
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path='/index.html',
                    ttl=Duration.seconds(0),
                ),
            ],
            comment='ImpactMap AI CloudFront Distribution',
        )

        # Deploy web assets or placeholder
        web_dist_dir = Path(__file__).resolve().parents[2] / 'web' / 'dist'
        if not web_dist_dir.exists():
            web_dist_dir.mkdir(parents=True, exist_ok=True)
            placeholder_index = web_dist_dir / 'index.html'
            if not placeholder_index.exists():
                placeholder_index.write_text(
                    '<!DOCTYPE html><html><head><title>ImpactMap AI</title></head>'
                    '<body><div id="root"><h1>ImpactMap AI</h1><p>Walking Skeleton Deployed</p></div></body></html>'
                )

        s3deploy.BucketDeployment(
            self, 'DeployWebAssets',
            sources=[s3deploy.Source.asset(str(web_dist_dir))],
            destination_bucket=self.web_bucket,
            distribution=self.distribution,
            distribution_paths=['/*'],
        )

        CfnOutput(self, 'WebBucketName', value=self.web_bucket.bucket_name)
        CfnOutput(self, 'CloudFrontDomain', value=self.distribution.distribution_domain_name)
        CfnOutput(self, 'SiteUrl', value=f'https://{self.distribution.distribution_domain_name}')
