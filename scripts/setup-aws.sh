#!/usr/bin/env bash
set -euo pipefail

# Deploy Code Smiths LLC website to AWS
# Usage: ./scripts/setup-aws.sh <domain> [recaptcha-secret-key]

DOMAIN="${1:?Usage: $0 <domain> [recaptcha-secret-key]}"
RECAPTCHA_SECRET="${2:-}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && cd .. && pwd)"
cd "$SCRIPT_DIR"

BUCKET="codesmithsllc-website"
LAMBDA_FUNCTION="codesmiths-contact"
AWS_REGION="us-west-2"

echo "=== Deploying Code Smiths LLC ==="
echo "Domain: $DOMAIN"

# 1. Build frontend
echo "Building frontend..."
npm run build --prefix "$SCRIPT_DIR/frontend"

# 2. Build Lambda package (tsc + esbuild bundle)
echo "Building Lambda..."
npm run build --prefix "$SCRIPT_DIR/backend"
zip -j "$SCRIPT_DIR/backend/lambda.zip" "$SCRIPT_DIR/backend/bundle/handler.js"

# 3. Create S3 bucket and upload
echo "Creating S3 bucket..."
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION" 2>/dev/null || true

# Disable S3 Block Public Access
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" 2>/dev/null || true

aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy '{"Version":"2012-10-17","Statement":[{"Sid":"PublicReadGetObject","Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::'"$BUCKET"'/*"}]}' 2>/dev/null || true

echo "Uploading frontend..."
aws s3 sync "$SCRIPT_DIR/frontend/dist" "s3://$BUCKET" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html"

aws s3 sync "$SCRIPT_DIR/frontend/dist" "s3://$BUCKET" \
  --delete \
  --cache-control "no-cache" \
  --include "*.html"

# 4. Create IAM role for Lambda
echo "Creating IAM role..."
aws iam create-role \
  --role-name "codesmiths-lambda-role" \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || true

aws iam attach-role-policy \
  --role-name "codesmiths-lambda-role" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" 2>/dev/null || true

# 5. Create Lambda function
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/codesmiths-lambda-role"

if [ -n "$RECAPTCHA_SECRET" ]; then
  ENV_VARS="RECAPTCHA_SECRET_KEY=$RECAPTCHA_SECRET,RECIPIENT_EMAIL=jeff@jeffmsmith.com,RESEND_API_KEY=re_QykfUvq9_6A6i5DpjeW48d3njEUeD3W1k"
else
  ENV_VARS="RECIPIENT_EMAIL=jeff@jeffmsmith.com,RESEND_API_KEY=re_QykfUvq9_6A6i5DpjeW48d3njEUeD3W1k"
fi

echo "Creating Lambda function..."
aws lambda create-function \
  --function-name "$LAMBDA_FUNCTION" \
  --runtime nodejs20.x \
  --handler handler.handler \
  --role "$ROLE_ARN" \
  --timeout 10 \
  --memory-size 128 \
  --zip-file "fileb://backend/lambda.zip" \
  --environment "Variables={$ENV_VARS}" 2>/dev/null || true

# Always update function code
aws lambda update-function-code \
  --function-name "$LAMBDA_FUNCTION" \
  --zip-file "fileb://backend/lambda.zip" 2>/dev/null || true

# Wait for Lambda to become Active
for i in 1 2 3 4 5; do
  STATE=$(aws lambda get-function --function-name "$LAMBDA_FUNCTION" --query 'Configuration.State' --output text 2>/dev/null || echo "")
  if [ "$STATE" = "Active" ]; then break; fi
  echo "Waiting for Lambda to activate ($STATE)..."
  sleep 5
done

# Update env vars (ensure RESEND_API_KEY is present)
aws lambda update-function-configuration \
  --function-name "$LAMBDA_FUNCTION" \
  --environment "Variables={$ENV_VARS}" 2>/dev/null || true

# 6. Create API Gateway REST API
echo "Creating API Gateway..."
API_ID=$(aws apigateway create-rest-api \
  --name "codesmiths-api" \
  --query "id" \
  --output text 2>/dev/null)

if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
  ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --query "items[0].id" \
    --output text)

  CONTACT_ID=$(aws apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$ROOT_ID" \
    --path-part "contact" \
    --query "id" \
    --output text)

  # POST method
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$CONTACT_ID" \
    --http-method "POST" \
    --authorization-type "NONE" 2>/dev/null || true

  # POST method response (200 + 500) with CORS headers
  aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$CONTACT_ID" \
    --http-method "POST" \
    --status-code "200" \
    --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"true"}' 2>/dev/null || true

  aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$CONTACT_ID" \
    --http-method "POST" \
    --status-code "500" \
    --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"true"}' 2>/dev/null || true

  # POST Lambda proxy integration
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$CONTACT_ID" \
    --http-method "POST" \
    --type "AWS_PROXY" \
    --integration-http-method "POST" \
    --uri "arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$AWS_REGION:$ACCOUNT_ID:function:$LAMBDA_FUNCTION/invocations" 2>/dev/null || true

  # POST integration response with CORS
  aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$CONTACT_ID" \
    --http-method "POST" \
    --status-code "200" \
    --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"\\'*\\'}' 2>/dev/null || true

  # OPTIONS method for CORS preflight (MOCK - returns headers without hitting Lambda)
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$CONTACT_ID" \
    --http-method "OPTIONS" \
    --authorization-type "NONE" 2>/dev/null || true

  aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$CONTACT_ID" \
    --http-method "OPTIONS" \
    --status-code "200" \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"true","method.response.header.Access-Control-Allow-Methods":"true","method.response.header.Access-Control-Allow-Origin":"true"}' 2>/dev/null || true

  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$CONTACT_ID" \
    --http-method "OPTIONS" \
    --type "MOCK" \
    --integration-http-method "ANY" 2>/dev/null || true

  # Deploy
  aws apigateway deploy \
    --rest-api-id "$API_ID" \
    --stage-name "api" 2>/dev/null || true

  API_GATEWAY_URL="https://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com/api/contact"
  echo ""
  echo "API Gateway: $API_GATEWAY_URL"
fi

echo ""
echo "=== Deployment complete ==="
echo ""
echo "Next steps:"
echo "1. Create CloudFront distribution pointing to S3 bucket: $BUCKET"
echo "2. Add CloudFront CNAME to your Route 53 hosted zone for: $DOMAIN"
echo "3. Set VITE_API_URL in .env.production to: $API_GATEWAY_URL"
echo "4. Set VITE_RECAPTCHA_SITE_KEY in .env.production"
echo "5. Rebuild: cd frontend && npm run build"
