# deploy-fixed.ps1 - Fixed PowerShell deployment script

Write-Host "🚀 Deploying Expense Tracker to AWS..." -ForegroundColor Green

# Set AWS region
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

# Remove public access block FIRST (this is crucial)
Write-Host "🔓 Removing public access block..." -ForegroundColor Yellow
aws s3api put-public-access-block --bucket $bucketName --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Configure bucket for static website hosting
Write-Host "🌐 Configuring static website hosting..." -ForegroundColor Yellow
aws s3 website "s3://$bucketName" --index-document index.html --error-document index.html

# Upload build files to S3 with public-read ACL
Write-Host "📤 Uploading files to S3..." -ForegroundColor Yellow
aws s3 sync build/ "s3://$bucketName" --delete --acl public-read

# Create bucket policy JSON (fixed version)
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

# Verify the policy was applied
Write-Host "✅ Verifying bucket policy..." -ForegroundColor Yellow
aws s3api get-bucket-policy --bucket $bucketName

# Clean up temporary file
Remove-Item $policyFile

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌍 Your app is live at: http://$bucketName.s3-website.eu-north-1.amazonaws.com" -ForegroundColor Cyan

# Test the website
Write-Host "🧪 Testing website accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$bucketName.s3-website.eu-north-1.amazonaws.com" -Method Head -ErrorAction Stop
    Write-Host "✅ Website is accessible! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Website test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try waiting a few minutes for DNS propagation..." -ForegroundColor Yellow
}

Write-Host "`n🎉 Deployment Summary:" -ForegroundColor Green
Write-Host "📦 S3 Bucket: $bucketName" -ForegroundColor White
Write-Host "🌍 S3 Website: http://$bucketName.s3-website.eu-north-1.amazonaws.com" -ForegroundColor White
Write-Host "🔧 Region: eu-north-1" -ForegroundColor White

Write-Host "`n💡 If you still see 403 errors:" -ForegroundColor Yellow
Write-Host "1. Wait 5-10 minutes for AWS propagation" -ForegroundColor White
Write-Host "2. Try accessing: http://$bucketName.s3-website.eu-north-1.amazonaws.com/index.html" -ForegroundColor White
Write-Host "3. Check AWS Console: S3 -> $bucketName -> Properties -> Static website hosting" -ForegroundColor White