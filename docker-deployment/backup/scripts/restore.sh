#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_filename_without_extension>"
    echo "Example: $0 mongodb_20231201_020000"
    exit 1
fi

BACKUP_NAME="$1"
BACKUP_FILE="/backup/${BACKUP_NAME}.tar.gz"
RESTORE_DIR="/backup/restore_${BACKUP_NAME}"

echo "[$(date)] Starting MongoDB restore from $BACKUP_NAME..."

# Check if local backup exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "[$(date)] Local backup not found. Attempting to download from S3..."
    
    if [ -n "$AWS_S3_BUCKET" ]; then
        aws s3 cp "s3://$AWS_S3_BUCKET/${BACKUP_NAME}.tar.gz" "$BACKUP_FILE"
        
        if [ $? -ne 0 ]; then
            echo "[$(date)] ERROR: Could not download backup from S3"
            exit 1
        fi
    else
        echo "[$(date)] ERROR: Backup file not found and S3 not configured"
        exit 1
    fi
fi

# Extract backup
echo "[$(date)] Extracting backup..."
mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

if [ $? -ne 0 ]; then
    echo "[$(date)] ERROR: Failed to extract backup"
    exit 1
fi

# Restore database
echo "[$(date)] Restoring database..."
mongorestore --host="$MONGO_HOST:$MONGO_PORT" --db="$MONGO_DB" --drop "$RESTORE_DIR/mongodb_*/"*

if [ $? -eq 0 ]; then
    echo "[$(date)] Database restored successfully"
    rm -rf "$RESTORE_DIR"
else
    echo "[$(date)] ERROR: Database restore failed"
    exit 1
fi

echo "[$(date)] Restore completed successfully"