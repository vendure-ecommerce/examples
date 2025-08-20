#!/bin/bash
# MinIO Setup Script for Vendure Assets
#
# PURPOSE: Configures MinIO bucket with public read permissions for Vendure asset serving
# 
# WHAT IT DOES:
# 1. Waits for MinIO server to be ready (health check)
# 2. Creates 'vendure-assets' bucket if it doesn't exist
# 3. Sets anonymous public read access (critical for browser asset loading)
# 4. Verifies configuration and displays bucket status
#
# WHY NEEDED: MinIO defaults to private buckets. Without public read access,
# browsers get 403 Forbidden errors when loading asset images.
#
# USAGE: ./setup-minio.sh (run after starting MinIO with docker-compose)

set -e

echo "🚀 Setting up MinIO for Vendure Assets"
echo "====================================="

# Configuration
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
BUCKET_NAME="vendure-assets"

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
until curl -sf "$MINIO_ENDPOINT/minio/health/ready" > /dev/null 2>&1; do
  echo "   MinIO not ready, waiting..."
  sleep 2
done
echo "✅ MinIO is ready!"

# Use MinIO client in Docker to configure bucket
echo "🪣 Creating bucket and setting permissions..."

# Create bucket and set public read policy
docker run --rm --network host \
  --entrypoint=/bin/sh minio/mc \
  -c "
    mc alias set myminio $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY;
    mc mb myminio/$BUCKET_NAME --ignore-existing;
    mc anonymous set public myminio/$BUCKET_NAME;
    echo '✅ Bucket created and public read access configured!';
    mc ls myminio/;
    mc stat myminio/$BUCKET_NAME;
  "

echo ""
echo "🎉 MinIO setup complete!"
echo "📍 MinIO Console: http://localhost:9090"
echo "🔑 Credentials: minioadmin / minioadmin"
echo "🪣 Bucket: $BUCKET_NAME (public read access enabled)"
echo ""
echo "Now you can:"
echo "1. Start your Vendure server: npm run dev:server"
echo "2. Upload assets via Admin UI: http://localhost:3000/admin"
echo "3. Assets will be publicly accessible via MinIO URLs"