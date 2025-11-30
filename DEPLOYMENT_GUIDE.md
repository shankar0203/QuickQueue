# QuickQueue AWS Deployment Guide

## Phase 1: EC2 Deployment (POC/Small Scale)

### Prerequisites
- AWS Account with appropriate permissions
- Domain name (optional but recommended)
- Basic understanding of AWS services

### Step 1: EC2 Instance Setup

#### 1.1 Launch EC2 Instance
```bash
# Launch Ubuntu 22.04 LTS instance
# Instance type: t3.medium (2 vCPU, 4GB RAM) - minimum for small scale
# Storage: 20GB gp3 SSD
# Security Group: Allow ports 22, 80, 443, 3000, 8001
```

#### 1.2 Security Group Configuration
```bash
# Create security group
aws ec2 create-security-group \
  --group-name quickqueue-sg \
  --description "QuickQueue Application Security Group"

# Add inbound rules
aws ec2 authorize-security-group-ingress \
  --group-name quickqueue-sg \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name quickqueue-sg \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name quickqueue-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name quickqueue-sg \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name quickqueue-sg \
  --protocol tcp \
  --port 8001 \
  --cidr 0.0.0.0/0
```

### Step 2: Server Configuration

#### 2.1 Connect to EC2 and Install Dependencies
```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.11 and pip
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2 yarn

# Install Git
sudo apt install -y git
```

### Step 3: Deploy Application

#### 3.1 Clone and Setup Project
```bash
# Clone your repository
git clone https://github.com/yourusername/quickqueue.git
cd quickqueue

# Setup Backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup Frontend
cd ../frontend
yarn install
```

#### 3.2 Configure Environment Variables

**Backend (.env)**
```bash
# /home/ubuntu/quickqueue/backend/.env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="quickqueue_prod"
CORS_ORIGINS="https://yourdomain.com,http://your-ec2-ip:3000"
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
```

**Frontend (.env)**
```bash
# /home/ubuntu/quickqueue/frontend/.env
REACT_APP_BACKEND_URL=https://yourdomain.com
# OR for testing: REACT_APP_BACKEND_URL=http://your-ec2-ip:8001
```

#### 3.3 Build Frontend
```bash
cd /home/ubuntu/quickqueue/frontend
yarn build
```

### Step 4: Configure Nginx Reverse Proxy

#### 4.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/quickqueue
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain or EC2 IP

    # Frontend
    location / {
        root /home/ubuntu/quickqueue/frontend/build;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /static {
        alias /home/ubuntu/quickqueue/frontend/build/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/quickqueue /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Configure PM2 for Process Management

#### 5.1 Create PM2 Configuration
```bash
# Create ecosystem file
nano /home/ubuntu/quickqueue/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'quickqueue-backend',
      script: '/home/ubuntu/quickqueue/backend/venv/bin/python',
      args: '-m uvicorn server:app --host 0.0.0.0 --port 8001',
      cwd: '/home/ubuntu/quickqueue/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

#### 5.2 Start Applications
```bash
cd /home/ubuntu/quickqueue
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### Step 6: SSL Configuration (Optional but Recommended)

#### 6.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 6.2 Get SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Step 7: Database Backup Script
```bash
# Create backup script
nano /home/ubuntu/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db quickqueue_prod --out /home/ubuntu/backups/mongodb_$DATE
find /home/ubuntu/backups -type d -mtime +7 -exec rm -rf {} +
```

```bash
chmod +x /home/ubuntu/backup-db.sh
# Add to crontab for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup-db.sh") | crontab -
```

---

## Phase 2: Docker Containerization

### Step 1: Create Dockerfiles

#### 1.1 Backend Dockerfile
```dockerfile
# /app/backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### 1.2 Frontend Dockerfile
```dockerfile
# /app/frontend/Dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code and build
COPY . .
RUN yarn build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 1.3 Frontend Nginx Config
```nginx
# /app/frontend/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    sendfile on;
    keepalive_timeout 65;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Step 2: Docker Compose for Local Testing
```yaml
# /app/docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: quickqueue-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: quickqueue
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - quickqueue-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: quickqueue-backend
    restart: unless-stopped
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=quickqueue
      - CORS_ORIGINS=http://localhost:3000,http://localhost:80
    depends_on:
      - mongodb
    networks:
      - quickqueue-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: quickqueue-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - quickqueue-network

volumes:
  mongodb_data:

networks:
  quickqueue-network:
    driver: bridge
```

### Step 3: Build and Test Docker Images
```bash
# Test locally
docker-compose up --build

# Build individual images
docker build -t quickqueue-backend:latest ./backend
docker build -t quickqueue-frontend:latest ./frontend

# Push to ECR (after setting up ECR)
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-west-2.amazonaws.com
docker tag quickqueue-backend:latest 123456789012.dkr.ecr.us-west-2.amazonaws.com/quickqueue-backend:latest
docker push 123456789012.dkr.ecr.us-west-2.amazonaws.com/quickqueue-backend:latest
```

---

## Phase 3: EKS Deployment (Production Scale)

### Step 1: EKS Cluster Setup

#### 1.1 Install kubectl and eksctl
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

#### 1.2 Create EKS Cluster
```yaml
# cluster-config.yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: quickqueue-cluster
  region: us-west-2
  version: "1.28"

nodeGroups:
  - name: quickqueue-workers
    instanceType: t3.medium
    desiredCapacity: 2
    minSize: 1
    maxSize: 4
    volumeSize: 20
    ssh:
      allow: true
    iam:
      withAddonPolicies:
        imageBuilder: true
        autoScaler: true
        certManager: true
        efs: true
        ebs: true

addons:
- name: vpc-cni
- name: coredns
- name: kube-proxy
- name: aws-ebs-csi-driver
```

```bash
# Create cluster
eksctl create cluster -f cluster-config.yaml

# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name quickqueue-cluster
```

### Step 2: Set Up ECR Repository
```bash
# Create ECR repositories
aws ecr create-repository --repository-name quickqueue-backend --region us-west-2
aws ecr create-repository --repository-name quickqueue-frontend --region us-west-2

# Get repository URIs
aws ecr describe-repositories --repository-names quickqueue-backend quickqueue-frontend --region us-west-2
```

### Step 3: MongoDB on EKS

#### 3.1 Install MongoDB using Helm
```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Add MongoDB Helm repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install MongoDB
helm install mongodb bitnami/mongodb \
  --set auth.enabled=false \
  --set persistence.size=10Gi \
  --set resources.requests.memory=512Mi \
  --set resources.requests.cpu=250m \
  --namespace default
```

### Step 4: Kubernetes Manifests

#### 4.1 Namespace and ConfigMap
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: quickqueue
---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: quickqueue-config
  namespace: quickqueue
data:
  MONGO_URL: "mongodb://mongodb:27017"
  DB_NAME: "quickqueue"
  CORS_ORIGINS: "https://quickqueue.yourdomain.com"
```

#### 4.2 Secrets
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: quickqueue-secrets
  namespace: quickqueue
type: Opaque
data:
  RAZORPAY_KEY_ID: <base64-encoded-key>
  RAZORPAY_KEY_SECRET: <base64-encoded-secret>
```

#### 4.3 Backend Deployment
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: quickqueue-backend
  namespace: quickqueue
spec:
  replicas: 2
  selector:
    matchLabels:
      app: quickqueue-backend
  template:
    metadata:
      labels:
        app: quickqueue-backend
    spec:
      containers:
      - name: backend
        image: 123456789012.dkr.ecr.us-west-2.amazonaws.com/quickqueue-backend:latest
        ports:
        - containerPort: 8001
        env:
        - name: MONGO_URL
          valueFrom:
            configMapKeyRef:
              name: quickqueue-config
              key: MONGO_URL
        - name: DB_NAME
          valueFrom:
            configMapKeyRef:
              name: quickqueue-config
              key: DB_NAME
        - name: CORS_ORIGINS
          valueFrom:
            configMapKeyRef:
              name: quickqueue-config
              key: CORS_ORIGINS
        - name: RAZORPAY_KEY_ID
          valueFrom:
            secretKeyRef:
              name: quickqueue-secrets
              key: RAZORPAY_KEY_ID
        - name: RAZORPAY_KEY_SECRET
          valueFrom:
            secretKeyRef:
              name: quickqueue-secrets
              key: RAZORPAY_KEY_SECRET
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/
            port: 8001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: quickqueue-backend-service
  namespace: quickqueue
spec:
  selector:
    app: quickqueue-backend
  ports:
  - port: 8001
    targetPort: 8001
  type: ClusterIP
```

#### 4.4 Frontend Deployment
```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: quickqueue-frontend
  namespace: quickqueue
spec:
  replicas: 2
  selector:
    matchLabels:
      app: quickqueue-frontend
  template:
    metadata:
      labels:
        app: quickqueue-frontend
    spec:
      containers:
      - name: frontend
        image: 123456789012.dkr.ecr.us-west-2.amazonaws.com/quickqueue-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: quickqueue-frontend-service
  namespace: quickqueue
spec:
  selector:
    app: quickqueue-frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

#### 4.5 Ingress with ALB
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: quickqueue-ingress
  namespace: quickqueue
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:123456789012:certificate/your-cert-arn
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
spec:
  rules:
  - host: quickqueue.yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: quickqueue-backend-service
            port:
              number: 8001
      - path: /
        pathType: Prefix
        backend:
          service:
            name: quickqueue-frontend-service
            port:
              number: 80
```

### Step 5: Install AWS Load Balancer Controller
```bash
# Install AWS Load Balancer Controller
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.6.0/docs/install/iam_policy.json

aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json

eksctl create iamserviceaccount \
  --cluster=quickqueue-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name "AmazonEKSLoadBalancerControllerRole" \
  --attach-policy-arn=arn:aws:iam::123456789012:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=quickqueue-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Step 6: Deploy Application
```bash
# Create namespace and configmap
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml

# Create secrets (encode values first)
echo -n "your-razorpay-key" | base64
echo -n "your-razorpay-secret" | base64
# Update secrets.yaml with encoded values
kubectl apply -f k8s/secrets.yaml

# Deploy application
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl get pods -n quickqueue
kubectl get svc -n quickqueue
kubectl get ingress -n quickqueue
```

### Step 7: Monitoring and Logging

#### 7.1 Install Prometheus and Grafana
```bash
# Add Prometheus Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin123
```

#### 7.2 Install AWS CloudWatch Container Insights
```bash
curl https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml | sed "s/{{cluster_name}}/quickqueue-cluster/;s/{{region_name}}/us-west-2/" | kubectl apply -f -
```

## Step 8: CI/CD Pipeline with GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to EKS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-west-2
  EKS_CLUSTER: quickqueue-cluster

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build and push backend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: quickqueue-backend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

    - name: Build and push frontend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: quickqueue-frontend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./frontend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

    - name: Update kubeconfig
      run: aws eks update-kubeconfig --region ${{ env.AWS_REGION }} --name ${{ env.EKS_CLUSTER }}

    - name: Deploy to EKS
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        sed -i.bak "s|123456789012.dkr.ecr.us-west-2.amazonaws.com/quickqueue-backend:latest|$ECR_REGISTRY/quickqueue-backend:$IMAGE_TAG|g" k8s/backend-deployment.yaml
        sed -i.bak "s|123456789012.dkr.ecr.us-west-2.amazonaws.com/quickqueue-frontend:latest|$ECR_REGISTRY/quickqueue-frontend:$IMAGE_TAG|g" k8s/frontend-deployment.yaml
        kubectl apply -f k8s/backend-deployment.yaml
        kubectl apply -f k8s/frontend-deployment.yaml
        kubectl rollout status deployment/quickqueue-backend -n quickqueue
        kubectl rollout status deployment/quickqueue-frontend -n quickqueue
```

## Summary

**EC2 Deployment**: Perfect for POC, quick setup, costs around $30-50/month
**EKS Deployment**: Production-ready, auto-scaling, costs around $80-150/month

Both deployments include:
- SSL/TLS encryption
- Database backups
- Process monitoring
- Load balancing
- Auto-restart on failure

The EKS deployment additionally provides:
- High availability
- Auto-scaling
- Zero-downtime deployments
- Container orchestration
- Advanced monitoring

Choose EC2 for quick POC and EKS when you need production-grade scalability and reliability.