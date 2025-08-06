# deploy-final-fix.ps1 - Complete fix for S3 hosting issues

Write-Host "🚀 Deploying Expense Tracker to AWS (Final Fix)..." -ForegroundColor Green

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

# STEP 1: Remove ALL public access blocks
Write-Host "🔓 Removing ALL public access blocks..." -ForegroundColor Yellow
aws s3api delete-public-access-block --bucket $bucketName

# STEP 2: Upload files with explicit public-read permissions
Write-Host "📤 Uploading files to S3 with public permissions..." -ForegroundColor Yellow
aws s3 sync build/ "s3://$bucketName" --delete --acl public-read

# STEP 3: Create a comprehensive bucket policy
Write-Host "📝 Creating comprehensive bucket policy..." -ForegroundColor Yellow
$bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource": "arn:aws:s3:::$bucketName/*"
        }
    ]
}
"@

$policyFile = "bucket-policy.json"
$bucketPolicy | Out-File -FilePath $policyFile -Encoding UTF8

aws s3api put-bucket-policy --bucket $bucketName --policy file://$policyFile

# STEP 4: Configure static website hosting with proper error handling
Write-Host "🌐 Configuring static website hosting..." -ForegroundColor Yellow
aws s3api put-bucket-website --bucket $bucketName --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
}'

# STEP 5: Set bucket ACL to public-read
Write-Host "🔓 Setting bucket ACL to public-read..." -ForegroundColor Yellow
aws s3api put-bucket-acl --bucket $bucketName --acl public-read

# STEP 6: Verify all settings
Write-Host "✅ Verifying configuration..." -ForegroundColor Yellow

# Check if bucket policy exists
Write-Host "  Checking bucket policy..." -ForegroundColor Gray
try {
    aws s3api get-bucket-policy --bucket $bucketName | Out-Null
    Write-Host "  ✅ Bucket policy applied" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Bucket policy issue" -ForegroundColor Red
}

# Check website configuration
Write-Host "  Checking website configuration..." -ForegroundColor Gray
try {
    aws s3api get-bucket-website --bucket $bucketName | Out-Null
    Write-Host "  ✅ Website configuration applied" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Website configuration issue" -ForegroundColor Red
}

# STEP 7: Test multiple URLs
$websiteUrl = "http://$bucketName.s3-website.eu-north-1.amazonaws.com"
Write-Host "🧪 Testing website accessibility..." -ForegroundColor Yellow

# Test main URL
Write-Host "  Testing main URL: $websiteUrl" -ForegroundColor Gray
Start-Sleep -Seconds 5  # Wait for propagation

try {
    $response = Invoke-WebRequest -Uri $websiteUrl -TimeoutSec 30 -ErrorAction Stop
    Write-Host "  ✅ Main URL accessible! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Main URL failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try direct index.html
    Write-Host "  Testing direct index.html..." -ForegroundColor Gray
    try {
        $indexResponse = Invoke-WebRequest -Uri "$websiteUrl/index.html" -TimeoutSec 30 -ErrorAction Stop
        Write-Host "  ✅ index.html accessible! Status: $($indexResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ index.html also failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Clean up
Remove-Item $policyFile -ErrorAction SilentlyContinue

Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "📦 Bucket Name: $bucketName" -ForegroundColor White
Write-Host "🌍 Website URL: $websiteUrl" -ForegroundColor Cyan
Write-Host "🔗 Direct Index: $websiteUrl/index.html" -ForegroundColor White

Write-Host "`n🔧 Manual Check Commands:" -ForegroundColor Yellow
Write-Host "aws s3api get-bucket-website --bucket $bucketName" -ForegroundColor Gray
Write-Host "aws s3api get-bucket-policy --bucket $bucketName" -ForegroundColor Gray
Write-Host "aws s3 ls s3://$bucketName/" -ForegroundColor Gray

Write-Host "`n💡 If still getting errors:" -ForegroundColor Yellow
Write-Host "1. Wait 10-15 minutes for full AWS propagation" -ForegroundColor White
Write-Host "2. Check AWS Console: S3 -> $bucketName -> Properties -> Static website hosting" -ForegroundColor White
Write-Host "3. Verify 'Block all public access' is OFF in Permissions tab" -ForegroundColor White
Write-Host "4. Try both URLs above" -ForegroundColor White

# Output the bucket name for easy reference
Write-Host "`n📋 Save this bucket name: $bucketName" -ForegroundColor Magenta