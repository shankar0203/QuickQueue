#!/bin/bash
# SSL Setup Script for QuickQueue

set -e

DOMAIN=$1
EMAIL=${SSL_EMAIL:-"admin@$DOMAIN"}
STAGING=${SSL_STAGING:-false}

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 quickqueue.example.com"
    exit 1
fi

echo "Setting up SSL for domain: $DOMAIN"
echo "Email for notifications: $EMAIL"

# Check if domain points to this server
echo "Checking DNS resolution..."
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN)

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo "WARNING: Domain $DOMAIN points to $DOMAIN_IP but server IP is $SERVER_IP"
    echo "Please update your DNS records before continuing."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install certbot in nginx container
echo "Setting up Certbot..."
docker-compose exec nginx sh -c "
    apk add --no-cache certbot certbot-nginx
    mkdir -p /etc/letsencrypt
"

# Request SSL certificate
echo "Requesting SSL certificate..."
if [ "$STAGING" = "true" ]; then
    echo "Using Let's Encrypt staging environment..."
    docker-compose exec nginx certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --staging \
        -d "$DOMAIN"
else
    echo "Using Let's Encrypt production environment..."
    docker-compose exec nginx certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN"
fi

if [ $? -eq 0 ]; then
    echo "SSL certificate successfully obtained and configured!"
    
    # Setup automatic renewal
    echo "Setting up automatic SSL renewal..."
    docker-compose exec nginx sh -c "
        echo '0 12 * * * /usr/bin/certbot renew --nginx --quiet && nginx -s reload' | crontab -
        crond -b
    "
    
    echo "SSL setup completed successfully!"
    echo "Your site is now accessible at: https://$DOMAIN"
else
    echo "SSL certificate generation failed!"
    echo "Please check your domain configuration and try again."
    exit 1
fi