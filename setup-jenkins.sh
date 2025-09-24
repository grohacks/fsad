#!/bin/bash

# Jenkins CI/CD Setup Script
# This script sets up Jenkins with necessary plugins and configurations

set -e

echo "🚀 Setting up Jenkins CI/CD Environment for Health Records System"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_header "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_status "Docker is installed: $(docker --version)"
}

# Check if Docker Compose is installed
check_docker_compose() {
    print_header "Checking Docker Compose installation..."
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_status "Docker Compose is installed: $(docker-compose --version)"
}

# Create necessary directories
create_directories() {
    print_header "Creating necessary directories..."
    
    mkdir -p jenkins/init.groovy.d
    mkdir -p jenkins/casc
    mkdir -p nginx/ssl
    mkdir -p backups
    mkdir -p monitoring/prometheus
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    print_status "Directories created successfully"
}

# Generate SSL certificates for development
generate_ssl_certificates() {
    print_header "Generating SSL certificates for development..."
    
    if [ ! -f nginx/ssl/nginx.crt ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/nginx.key \
            -out nginx/ssl/nginx.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
            2>/dev/null || {
                print_warning "OpenSSL not found. Creating dummy SSL files..."
                touch nginx/ssl/nginx.key nginx/ssl/nginx.crt
            }
        print_status "SSL certificates generated"
    else
        print_status "SSL certificates already exist"
    fi
}

# Create Jenkins plugins list
create_plugins_list() {
    print_header "Creating Jenkins plugins list..."
    
    cat > jenkins/plugins.txt << 'EOF'
# Essential plugins
blueocean:1.25.2
workflow-aggregator:2.6
pipeline-stage-view:2.21
build-timeout:1.24
timestamper:1.17
ws-cleanup:0.42
ant:1.13
gradle:1.36
maven-invoker-plugin:2.5
docker-workflow:1.28
docker-plugin:1.2.6

# SCM plugins
git:4.8.3
github:1.34.3
github-branch-source:2.11.4
bitbucket:1.1.27

# Notification plugins
slack:2.49
email-ext:2.84
mailer:1.34

# Security plugins
matrix-auth:2.6.8
ldap:2.7
active-directory:2.25
role-strategy:3.2.0

# Quality & Testing plugins
sonar:2.13.1
warnings-ng:9.7.0
junit:1.48
jacoco:3.3.0
performance:3.20
htmlpublisher:1.28

# Deployment plugins
kubernetes:1.30.1
ansible:1.1
ssh-agent:1.23
publish-over-ssh:1.22

# Utility plugins
credentials:2.6.1
credentials-binding:1.27
plain-credentials:1.8
ssh-credentials:1.19
build-name-setter:2.2.0
environment-injector:2.4.0
parameterized-trigger:2.43
conditional-buildstep:1.4.1
copyartifact:1.46
archive-artifacts:1.3
jobConfigHistory:2.27

# Pipeline plugins
pipeline-githubnotify-step:1.0.5
pipeline-npm:0.9.2
pipeline-utility-steps:2.8.0
lockable-resources:2.11

# Monitoring plugins
monitoring:1.86.0
metrics:4.0.2.8
prometheus:2.0.10

# Configuration as Code
configuration-as-code:1.54
EOF

    print_status "Jenkins plugins list created"
}

# Create Jenkins Configuration as Code
create_jenkins_casc() {
    print_header "Creating Jenkins Configuration as Code..."
    
    cat > jenkins/casc/jenkins.yaml << 'EOF'
jenkins:
  systemMessage: "Health Records System CI/CD Jenkins Controller"
  
  securityRealm:
    local:
      allowsSignup: false
      users:
        - id: "admin"
          password: "admin123"
          name: "Jenkins Administrator"
          
  authorizationStrategy:
    globalMatrix:
      permissions:
        - "Overall/Administer:admin"
        - "Overall/Read:authenticated"
        
  remotingSecurity:
    enabled: true
    
  crumbIssuer:
    standard:
      excludeClientIPFromCrumb: false
      
tool:
  maven:
    installations:
      - name: "Maven-3.9.4"
        properties:
          - installSource:
              installers:
                - maven:
                    id: "3.9.4"
                    
  nodejs:
    installations:
      - name: "NodeJS-18"
        properties:
          - installSource:
              installers:
                - nodeJSInstaller:
                    id: "18.17.0"
                    npmPackagesRefreshHours: 72
                    
  sonarRunnerInstallation:
    installations:
      - name: "SonarQubeScanner"
        properties:
          - installSource:
              installers:
                - sonarRunnerInstaller:
                    id: "4.8.0.2856"

credentials:
  system:
    domainCredentials:
      - credentials:
          - usernamePassword:
              scope: GLOBAL
              id: "docker-hub-credentials"
              username: "your-docker-username"
              password: "your-docker-password"
              description: "Docker Hub Credentials"
          - string:
              scope: GLOBAL
              id: "sonarqube-token"
              secret: "your-sonarqube-token"
              description: "SonarQube Authentication Token"

unclassified:
  sonarGlobalConfiguration:
    installations:
      - name: "SonarQube"
        serverUrl: "http://sonarqube:9000"
        credentialsId: "sonarqube-token"
        
  slackNotifier:
    baseUrl: "https://hooks.slack.com/services/"
    teamDomain: "your-team"
    tokenCredentialId: "slack-token"
    
  location:
    adminAddress: "admin@healthrecords.com"
    url: "https://jenkins.local"
    
jobs:
  - script: |
      multibranchPipelineJob('health-records-system') {
        branchSources {
          git {
            id('health-records-repo')
            remote('https://github.com/your-org/health-records-system.git')
          }
        }
        orphanedItemStrategy {
          discardOldItems {
            numToKeep(10)
          }
        }
        triggers {
          periodic(5)
        }
      }
EOF

    print_status "Jenkins Configuration as Code created"
}

# Create initial Groovy scripts
create_groovy_scripts() {
    print_header "Creating Jenkins initialization scripts..."
    
    cat > jenkins/init.groovy.d/01-basic-security.groovy << 'EOF'
#!groovy
import jenkins.model.*
import hudson.security.*

def instance = Jenkins.getInstance()

// Enable CSRF protection
instance.setCrumbIssuer(new DefaultCrumbIssuer(true))

// Set number of executors
instance.setNumExecutors(2)

// Save configuration
instance.save()

println "Basic security configuration completed"
EOF

    cat > jenkins/init.groovy.d/02-disable-cli.groovy << 'EOF'
#!groovy
import jenkins.model.Jenkins

// Disable Jenkins CLI over remoting
Jenkins.instance.getDescriptor("jenkins.CLI").get().setEnabled(false)

println "Jenkins CLI disabled for security"
EOF

    print_status "Jenkins initialization scripts created"
}

# Create monitoring configuration
create_monitoring_config() {
    print_header "Creating monitoring configuration..."
    
    cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'jenkins'
    metrics_path: '/prometheus'
    static_configs:
      - targets: ['jenkins:8080']

  - job_name: 'sonarqube'
    static_configs:
      - targets: ['sonarqube:9000']

  - job_name: 'nexus'
    static_configs:
      - targets: ['nexus:8081']
EOF

    cat > monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

    print_status "Monitoring configuration created"
}

# Start Jenkins services
start_services() {
    print_header "Starting Jenkins and supporting services..."
    
    # Stop any existing services
    docker-compose -f docker-compose.jenkins.yml down 2>/dev/null || true
    
    # Start services
    docker-compose -f docker-compose.jenkins.yml up -d
    
    print_status "Services started successfully"
    print_status "Jenkins will be available at: https://localhost (admin/admin123)"
    print_status "SonarQube will be available at: https://sonar.local (admin/admin)"
    print_status "Nexus will be available at: https://nexus.local (admin/admin123)"
    print_status "Grafana will be available at: https://grafana.local (admin/admin123)"
}

# Wait for Jenkins to be ready
wait_for_jenkins() {
    print_header "Waiting for Jenkins to be ready..."
    
    local retries=30
    local count=0
    
    while [ $count -lt $retries ]; do
        if docker-compose -f docker-compose.jenkins.yml exec -T jenkins curl -f http://localhost:8080/login > /dev/null 2>&1; then
            print_status "Jenkins is ready!"
            return 0
        fi
        
        print_status "Waiting for Jenkins... ($((count + 1))/$retries)"
        sleep 10
        count=$((count + 1))
    done
    
    print_error "Jenkins failed to start within expected time"
    return 1
}

# Add hosts entries
add_hosts_entries() {
    print_header "Adding hosts entries..."
    
    if command -v sudo &> /dev/null; then
        echo "127.0.0.1 jenkins.local" | sudo tee -a /etc/hosts > /dev/null 2>&1 || true
        echo "127.0.0.1 sonar.local" | sudo tee -a /etc/hosts > /dev/null 2>&1 || true
        echo "127.0.0.1 nexus.local" | sudo tee -a /etc/hosts > /dev/null 2>&1 || true
        echo "127.0.0.1 grafana.local" | sudo tee -a /etc/hosts > /dev/null 2>&1 || true
        print_status "Hosts entries added (you may need to manually add them on Windows)"
    else
        print_warning "Please add the following entries to your hosts file:"
        echo "127.0.0.1 jenkins.local"
        echo "127.0.0.1 sonar.local"
        echo "127.0.0.1 nexus.local"
        echo "127.0.0.1 grafana.local"
    fi
}

# Show final instructions
show_final_instructions() {
    print_header "Setup Complete!"
    
    echo ""
    echo "🎉 Jenkins CI/CD environment has been set up successfully!"
    echo ""
    echo "📋 Access Information:"
    echo "   Jenkins:  https://jenkins.local (admin/admin123)"
    echo "   SonarQube: https://sonar.local (admin/admin)"
    echo "   Nexus:    https://nexus.local (admin/admin123)"
    echo "   Grafana:  https://grafana.local (admin/admin123)"
    echo ""
    echo "🔧 Next Steps:"
    echo "   1. Configure your Git repository credentials in Jenkins"
    echo "   2. Update SonarQube and Nexus default passwords"
    echo "   3. Configure Slack/Email notifications"
    echo "   4. Set up your first pipeline job"
    echo ""
    echo "📁 Important Files:"
    echo "   - Jenkinsfile: Main pipeline configuration"
    echo "   - docker-compose.jenkins.yml: Services configuration"
    echo "   - jenkins/casc/jenkins.yaml: Jenkins Configuration as Code"
    echo ""
    echo "🛠 Management Commands:"
    echo "   Stop:    docker-compose -f docker-compose.jenkins.yml down"
    echo "   Start:   docker-compose -f docker-compose.jenkins.yml up -d"
    echo "   Logs:    docker-compose -f docker-compose.jenkins.yml logs -f"
    echo "   Backup:  docker-compose -f docker-compose.jenkins.yml run jenkins-backup"
    echo ""
}

# Main execution
main() {
    echo "🏥 Health Records System - Jenkins CI/CD Setup"
    echo "=============================================="
    echo ""
    
    check_docker
    check_docker_compose
    create_directories
    generate_ssl_certificates
    create_plugins_list
    create_jenkins_casc
    create_groovy_scripts
    create_monitoring_config
    start_services
    wait_for_jenkins
    add_hosts_entries
    show_final_instructions
    
    echo "✅ Setup completed successfully!"
}

# Check if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi