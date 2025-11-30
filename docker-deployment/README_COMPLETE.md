# 🚀 QuickQueue Complete Docker Production Deployment

## 🎯 **What You Get**

A **complete, production-ready QuickQueue platform** with all integrations:

### ✅ **Included Services & Features**
- **Frontend**: React app with premium dark theme
- **Backend**: FastAPI with all integrations
- **Database**: MongoDB with optimization
- **Cache**: Redis for performance
- **Reverse Proxy**: Nginx with SSL
- **Monitoring**: Prometheus + Grafana dashboards
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Backup**: Automated database backups to S3
- **Security**: SSL certificates, rate limiting, firewall

### 🔧 **Production Integrations Ready**
- ✅ **Razorpay** payment processing
- ✅ **WhatsApp Business API** for ticket delivery
- ✅ **Email notifications** (Gmail/SendGrid/AWS SES)
- ✅ **AWS S3** file storage and backups
- ✅ **Emergent Google OAuth** authentication
- ✅ **QR code generation** and ticket management
- ✅ **Multi-role access** (admin, organizer, user)
- ✅ **Real-time monitoring** and alerting
- ✅ **Automated SSL** with Let's Encrypt

---

## 🚀 **One-Command Deployment**

```bash
# Download and deploy QuickQueue
wget -O - https://raw.githubusercontent.com/your-repo/quickqueue/main/deploy-prod.sh | bash
```

**OR Manual Steps:**

```bash
# 1. Clone the deployment package
git clone https://github.com/your-repo/quickqueue-docker.git
cd quickqueue-docker

# 2. Run the deployment script
chmod +x deploy.sh
./deploy.sh deploy

# 3. Configure your integrations
nano .env

# 4. Restart to apply changes
docker-compose restart backend
```

---

## 📋 **Prerequisites**

### **System Requirements**
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Any Docker-compatible Linux
- **RAM**: 8GB minimum (16GB recommended for high traffic)
- **CPU**: 4 cores minimum (8 cores for production)
- **Storage**: 50GB SSD minimum (100GB+ recommended)
- **Network**: Static IP, ports 80/443/22 accessible

### **Required Credentials**
1. **Domain name** pointing to your server IP
2. **Razorpay account** - [Get API keys](https://dashboard.razorpay.com/app/keys)
3. **WhatsApp Business API** - [Setup guide](https://developers.facebook.com/docs/whatsapp)
4. **Email service** - Gmail/SendGrid/AWS SES credentials
5. **AWS S3 bucket** for file storage and backups

---

## 🔧 **Integration Setup Guide**

### 1. **Razorpay Payment Integration**
```bash
# Get credentials from https://dashboard.razorpay.com
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Add webhook URL in Razorpay dashboard:
# https://yourdomain.com/api/payments/webhook
```

### 2. **WhatsApp Business API**
```bash
# Option A: Meta WhatsApp Business API (Recommended)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=your_permanent_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Option B: Twilio WhatsApp API
WHATSAPP_API_URL=https://api.twilio.com/2010-04-01
WHATSAPP_API_TOKEN=your_twilio_auth_token
WHATSAPP_ACCOUNT_SID=your_account_sid
```

### 3. **Email Configuration**
```bash
# Gmail (with App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_app_password

# SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key

# AWS SES
SMTP_HOST=email-smtp.us-west-2.amazonaws.com
SMTP_USER=your_aws_smtp_user
SMTP_PASSWORD=your_aws_smtp_password
```

### 4. **AWS S3 Storage**
```bash
# Create S3 buckets and IAM user
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=quickqueue-uploads
AWS_REGION=us-west-2
BACKUP_S3_BUCKET=quickqueue-backups
```

---

## 🎛️ **Management Commands**

```bash
# Deployment & Updates
./deploy.sh deploy          # Full deployment
./deploy.sh update          # Update to latest version
./deploy.sh check           # Health check
./deploy.sh stop            # Stop all services

# SSL Management
./deploy.sh ssl yourdomain.com  # Setup SSL certificate

# Database Management
./deploy.sh backup          # Create database backup
./deploy.sh restore backup_name  # Restore from backup

# Service Management
docker-compose logs -f backend     # View backend logs
docker-compose restart nginx       # Restart specific service
docker-compose ps                  # Check service status
```

---

## 📊 **Monitoring & Access URLs**

After deployment, access these URLs:

```
🌐 Main Application:     https://yourdomain.com
📊 Grafana Monitoring:   https://yourdomain.com/grafana
📋 Kibana Logs:         https://yourdomain.com/kibana
🔧 API Health:           https://yourdomain.com/api/health
📖 API Documentation:    https://yourdomain.com/api/docs
```

**Default Monitoring Credentials:**
- Username: `admin`
- Password: Auto-generated (check `.env` file)

---

## 🔒 **Security Features**

- ✅ **SSL/TLS encryption** with auto-renewal
- ✅ **Rate limiting** and DDoS protection
- ✅ **Container security** hardening
- ✅ **Database encryption** at rest
- ✅ **API authentication** and authorization
- ✅ **Secure headers** and CORS policies
- ✅ **Firewall configuration**
- ✅ **Regular security updates**

---

## 📈 **Performance Optimization**

- ✅ **Redis caching** for fast response times
- ✅ **Database indexing** for optimized queries
- ✅ **CDN-ready** static file serving
- ✅ **Gzip compression** for reduced bandwidth
- ✅ **Connection pooling** for database efficiency
- ✅ **Load balancing** ready for horizontal scaling
- ✅ **Resource limits** and auto-restart

---

## 🔄 **Backup & Recovery**

```bash
# Automated daily backups
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
BACKUP_RETENTION=7         # Keep 7 days

# Manual backup
docker-compose exec backup /scripts/backup.sh

# Restore from backup
docker-compose exec backup /scripts/restore.sh backup_name

# List available backups
docker-compose exec backup ls -la /backup/storage/
```

---

## 🧪 **Testing All Features**

```bash
# Test payment integration
curl -X POST https://yourdomain.com/api/payments/test

# Test WhatsApp integration
curl -X POST https://yourdomain.com/api/test/whatsapp \
  -d '{"phone":"+1234567890"}'

# Test email integration
curl -X POST https://yourdomain.com/api/test/email \
  -d '{"email":"test@example.com"}'

# Test complete booking flow
curl -X POST https://yourdomain.com/api/bookings \
  -d '{"event_id":"test","buyer_name":"Test User"}'
```

---

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **Services not starting:**
   ```bash
   docker-compose logs -f [service_name]
   docker system prune -f  # Clean up
   ./deploy.sh deploy      # Redeploy
   ```

2. **SSL certificate issues:**
   ```bash
   # Check DNS resolution
   dig +short yourdomain.com
   
   # Regenerate SSL
   ./deploy.sh ssl yourdomain.com
   ```

3. **Payment/WhatsApp not working:**
   ```bash
   # Check API credentials in .env
   nano .env
   docker-compose restart backend
   ```

4. **Database connection issues:**
   ```bash
   docker-compose logs mongodb
   docker-compose restart mongodb backend
   ```

### **Support Channels:**
- 📧 Email: support@quickqueue.com
- 💬 Discord: [Join our community]
- 📖 Documentation: [Full docs]
- 🐛 Issues: [GitHub Issues]

---

## 💰 **Estimated Costs (Monthly)**

**Small Scale (< 1000 events/month):**
- Server: $20-50 (2-4GB RAM VPS)
- Domain + SSL: $10-15
- **Total: ~$30-65/month**

**Medium Scale (1000-10000 events/month):**
- Server: $50-100 (8GB RAM, 4 CPU)
- AWS S3: $5-20
- **Total: ~$55-120/month**

**Large Scale (10000+ events/month):**
- Server: $100-200 (16GB RAM, 8 CPU)
- AWS S3: $20-50
- CDN: $10-30
- **Total: ~$130-280/month**

---

## 🚀 **Ready to Deploy?**

```bash
# Quick start - one command deployment
wget -O - https://deploy.quickqueue.com/install.sh | bash

# Or manual deployment
git clone https://github.com/quickqueue/docker-deploy.git
cd docker-deploy
./deploy.sh deploy
```

**What happens during deployment:**
1. ✅ System requirements check
2. ✅ Docker installation
3. ✅ Firewall configuration
4. ✅ Application deployment
5. ✅ SSL certificate generation
6. ✅ Database initialization
7. ✅ Monitoring setup
8. ✅ Health checks

**Deployment time: ~15-30 minutes**

---

**🎉 That's it! You'll have a production-ready QuickQueue platform with all integrations working out of the box!**

**Next:** Configure your API credentials and start selling tickets! 🎫