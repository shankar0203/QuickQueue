#!/bin/bash
set -e

# Configuration
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backup"
LOCAL_BACKUP="$BACKUP_DIR/mongodb_$DATE"
S3_BACKUP="s3://$AWS_S3_BUCKET/mongodb_$DATE.tar.gz"
RETENTION_DAYS=${BACKUP_RETENTION:-7}

echo "[$(date)] Starting MongoDB backup..."

# Create backup directory
mkdir -p "$LOCAL_BACKUP"

# MongoDB backup
echo "[$(date)] Creating MongoDB dump..."
mongodump --host="$MONGO_HOST:$MONGO_PORT" --db="$MONGO_DB" --out="$LOCAL_BACKUP"

if [ $? -eq 0 ]; then
    echo "[$(date)] MongoDB dump created successfully"
else
    echo "[$(date)] ERROR: MongoDB dump failed"
    exit 1
fi

# Compress backup
echo "[$(date)] Compressing backup..."
tar -czf "$LOCAL_BACKUP.tar.gz" -C "$BACKUP_DIR" "mongodb_$DATE"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup compressed successfully"
    rm -rf "$LOCAL_BACKUP"
else
    echo "[$(date)] ERROR: Backup compression failed"
    exit 1
fi

# Upload to S3 (if configured)
if [ -n "$AWS_S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "[$(date)] Uploading backup to S3..."
    aws s3 cp "$LOCAL_BACKUP.tar.gz" "$S3_BACKUP"
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] Backup uploaded to S3 successfully"
        rm -f "$LOCAL_BACKUP.tar.gz"
    else
        echo "[$(date)] WARNING: S3 upload failed, keeping local backup"
    fi
fi

# Clean up old local backups
echo "[$(date)] Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "mongodb_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Clean up old S3 backups (if S3 is configured)
if [ -n "$AWS_S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "[$(date)] Cleaning up old S3 backups..."
    aws s3 ls "s3://$AWS_S3_BUCKET/" --recursive | grep mongodb_ | sort -r | tail -n +$((RETENTION_DAYS + 1)) | while read -r line; do
        file=$(echo $line | awk '{print $4}')
        if [ -n "$file" ]; then
            aws s3 rm "s3://$AWS_S3_BUCKET/$file"
            echo "[$(date)] Deleted old S3 backup: $file"
        fi
    done
fi

echo "[$(date)] Backup completed successfully"

# Send notification (optional)
if [ -n "$WEBHOOK_URL" ]; then
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d '{"text":"QuickQueue backup completed: '"$DATE"'"}'
fi