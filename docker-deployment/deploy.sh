#!/bin/bash

# QuickQueue Production Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    print_status "Checking system requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please copy .env.example to .env and configure it."
        exit 1
    fi
    
    print_success "All requirements met"
}

setup_directories() {
    print_status "Setting up directories and permissions..."
    
    # Create necessary directories
    mkdir -p data/{mongodb,redis,elasticsearch,prometheus,grafana}
    mkdir -p logs/{nginx,backend}
    mkdir -p ssl
    mkdir -p backup/storage
    
    # Set permissions
    sudo chown -R 1000:1000 data/elasticsearch
    sudo chown -R 472:472 data/grafana
    
    print_success "Directories set up successfully"
}

generate_secrets() {
    print_status "Generating secure passwords..."
    
    # Generate random passwords if not set in .env
    if ! grep -q "SECRET_KEY=" .env || [ -z "$(grep 'SECRET_KEY=' .env | cut -d'=' -f2)" ]; then
        SECRET_KEY=$(openssl rand -hex 32)
        sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
        print_success "Generated SECRET_KEY"
    fi
    
    if ! grep -q "JWT_SECRET=" .env || [ -z "$(grep 'JWT_SECRET=' .env | cut -d'=' -f2)" ]; then
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        print_success "Generated JWT_SECRET"
    fi
    
    # Generate nginx auth file for monitoring endpoints
    if [ ! -f "nginx/.htpasswd" ]; then
        mkdir -p nginx
        GRAFANA_USER=$(grep 'GRAFANA_ADMIN_USER=' .env | cut -d'=' -f2)
        GRAFANA_PASS=$(grep 'GRAFANA_ADMIN_PASSWORD=' .env | cut -d'=' -f2)
        
        if [ -n "$GRAFANA_USER" ] && [ -n "$GRAFANA_PASS" ]; then
            echo "$GRAFANA_USER:$(openssl passwd -apr1 $GRAFANA_PASS)" > nginx/.htpasswd
            print_success "Generated nginx auth file"
        fi
    fi
}

setup_ssl() {
    local domain=$1
    
    if [ -z "$domain" ]; then
        print_warning "No domain specified, skipping SSL setup"
        return
    fi
    
    print_status "Setting up SSL for domain: $domain"
    
    # Check if SSL certificates already exist
    if [ -f "ssl/live/$domain/fullchain.pem" ]; then
        print_success "SSL certificates already exist for $domain"
        return
    fi
    
    # Create SSL directory structure
    mkdir -p ssl/live/$domain
    mkdir -p ssl/archive/$domain
    
    # Generate self-signed certificates for initial setup
    print_status "Generating temporary self-signed certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/live/$domain/privkey.pem \
        -out ssl/live/$domain/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$domain"
    
    print_warning "Temporary self-signed certificates generated."
    print_warning "Run 'docker-compose exec nginx certbot --nginx -d $domain' after deployment to get real SSL certificates."
}

deploy_application() {
    print_status "Deploying QuickQueue application..."
    
    # Pull latest images
    print_status "Pulling latest Docker images..."
    docker-compose pull
    
    # Build custom images
    print_status "Building application images..."
    docker-compose build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check service health
    check_services
    
    print_success "Application deployed successfully!"
}

check_services() {
    print_status "Checking service health..."
    
    services=("nginx" "frontend" "backend" "mongodb" "redis")
    
    for service in "${services[@]}"; do
        if docker-compose ps $service | grep -q "Up"; then
            print_success "$service is running"
        else
            print_error "$service is not running properly"
            docker-compose logs $service | tail -20
        fi
    done
}

show_deployment_info() {
    local domain=$(grep 'DOMAIN=' .env | cut -d'=' -f2)
    
    echo ""
    echo "================================="
    echo "  QuickQueue Deployment Complete  "
    echo "================================="
    echo ""
    echo "🚀 Application URL: https://$domain"
    echo "📊 Grafana (Monitoring): https://$domain/grafana"
    echo "📋 Kibana (Logs): https://$domain/kibana"
    echo "🔧 API Health: https://$domain/api/health"
    echo ""
    echo "📁 Important directories:"
    echo "   - Logs: ./logs/"
    echo "   - Backups: ./backup/storage/"
    echo "   - SSL certificates: ./ssl/"
    echo ""
    echo "🔐 Default monitoring credentials:"
    echo "   - Username: $(grep 'GRAFANA_ADMIN_USER=' .env | cut -d'=' -f2)"
    echo "   - Password: $(grep 'GRAFANA_ADMIN_PASSWORD=' .env | cut -d'=' -f2)"
    echo ""
    echo "📖 Management commands:"
    echo "   - View logs: docker-compose logs -f [service]"
    echo "   - Restart service: docker-compose restart [service]"
    echo "   - Stop all: docker-compose down"
    echo "   - Backup database: docker-compose exec backup /scripts/backup.sh"
    echo ""
    print_warning "Remember to:"
    print_warning "1. Point your domain DNS to this server's IP address"
    print_warning "2. Configure real SSL certificates: docker-compose exec nginx certbot --nginx -d $domain"
    print_warning "3. Set up monitoring alerts"
    print_warning "4. Configure automated backups to S3"
    echo ""
}

# Main execution
echo "QuickQueue Production Deployment"
echo "================================"

# Parse command line arguments
case "$1" in
    "deploy")
        check_requirements
        setup_directories
        generate_secrets
        setup_ssl $(grep 'DOMAIN=' .env | cut -d'=' -f2)
        deploy_application
        show_deployment_info
        ;;
    "ssl")
        if [ -z "$2" ]; then
            print_error "Please provide domain name: $0 ssl example.com"
            exit 1
        fi
        setup_ssl "$2"
        ;;
    "check")
        check_services
        ;;
    "backup")
        docker-compose exec backup /scripts/backup.sh
        ;;
    "restore")
        if [ -z "$2" ]; then
            print_error "Please provide backup name: $0 restore mongodb_20231201_020000"
            exit 1
        fi
        docker-compose exec backup /scripts/restore.sh "$2"
        ;;
    "logs")
        if [ -z "$2" ]; then
            docker-compose logs -f
        else
            docker-compose logs -f "$2"
        fi
        ;;
    "restart")
        if [ -z "$2" ]; then
            docker-compose restart
        else
            docker-compose restart "$2"
        fi
        ;;
    "stop")
        docker-compose down
        ;;
    "update")
        docker-compose pull
        docker-compose build --no-cache
        docker-compose up -d
        ;;
    *)
        echo "Usage: $0 {deploy|ssl|check|backup|restore|logs|restart|stop|update} [options]"
        echo ""
        echo "Commands:"
        echo "  deploy          - Full deployment (initial setup)"
        echo "  ssl <domain>    - Setup SSL for domain"
        echo "  check           - Check service health"
        echo "  backup          - Create database backup"
        echo "  restore <name>  - Restore from backup"
        echo "  logs [service]  - View logs"
        echo "  restart [service] - Restart services"
        echo "  stop            - Stop all services"
        echo "  update          - Update and restart services"
        exit 1
        ;;
esac