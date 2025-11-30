#!/bin/sh
set -e

# Replace environment variables in nginx config if needed
if [ -n "$DOMAIN" ]; then
    sed -i "s/server_name localhost;/server_name $DOMAIN;/g" /etc/nginx/nginx.conf
fi

# Start nginx
exec "$@"