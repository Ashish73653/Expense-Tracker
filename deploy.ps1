# deploy.ps1 - PowerShell deployment script for Windows

Write-Host "🚀 Deploying Expense Tracker to AWS..." -ForegroundColor Green

# Set AWS region (you're using eu-north-1 based on your Cognito setup)
$env:AWS_DEFAULT_REGION = "eu-north-1"

# Build the React app
Write-Host "📦 Building React app..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Generate a unique bucket name
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$bucketName = "expense-tracker-$timestamp"

Write-Host "🪣 Creating S3 bucket: $bucketName" -ForegroundColor Yellow

# Create S3 bucket with correct region
aws s3 mb "s3://$bucketName" --region eu-north-1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create bucket!" -ForegroundColor Red
    exit 1
}

# Configure bucket for static website hosting
Write-Host "🌐 Configuring static website hosting..." -ForegroundColor Yellow
aws s3 website "s3://$bucketName" --index-document index.html --error-document index.html

# Upload build files to S3
Write-Host "📤 Uploading files to S3..." -ForegroundColor Yellow
aws s3 sync build/ "s3://$bucketName" --delete

# Create bucket policy JSON
$bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$bucketName/*"
        }
    ]
}
"@

# Write policy to temporary file
$policyFile = "bucket-policy.json"
$bucketPolicy | Out-File -FilePath $policyFile -Encoding UTF8

# Apply bucket policy
Write-Host "🔓 Setting bucket policy..." -ForegroundColor Yellow
aws s3api put-bucket-policy --bucket $bucketName --policy file://$policyFile

# Clean up temporary file
Remove-Item $policyFile

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌍 Your app is live at: http://$bucketName.s3-website.eu-north-1.amazonaws.com" -ForegroundColor Cyan

Write-Host "`n🎉 Deployment Summary:" -ForegroundColor Green
Write-Host "📦 S3 Bucket: $bucketName" -ForegroundColor White
Write-Host "🌍 S3 Website: http://$bucketName.s3-website.eu-north-1.amazonaws.com" -ForegroundColor White