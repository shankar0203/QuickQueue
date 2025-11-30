FROM alpine:latest

# Install required tools
RUN apk add --no-cache \
    bash \
    curl \
    mongodb-tools \
    aws-cli \
    docker-cli \
    cronie \
    && rm -rf /var/cache/apk/*

# Copy backup scripts
COPY scripts/ /scripts/
RUN chmod +x /scripts/*.sh

# Create backup directory
RUN mkdir -p /backup

# Create crontab file
RUN echo "${BACKUP_SCHEDULE:-0 2 * * *} /scripts/backup.sh" > /etc/crontabs/root

# Start cron daemon
CMD ["crond", "-f", "-d", "8"]