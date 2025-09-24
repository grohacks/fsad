# Jenkins CI/CD Implementation for Health Records System

This document provides comprehensive instructions for setting up and using Jenkins CI/CD for the Health Records System.

## 🏗️ Architecture Overview

Our CI/CD pipeline includes:
- **Jenkins Master**: Main orchestration server
- **Jenkins Agent**: Docker-based build agent with all necessary tools
- **SonarQube**: Code quality analysis
- **Nexus Repository**: Artifact management
- **PostgreSQL**: Database for SonarQube
- **Prometheus & Grafana**: Monitoring and metrics
- **Nginx**: Reverse proxy with SSL termination

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git repository with your code
- 8GB+ RAM recommended
- 20GB+ disk space

### Setup Instructions

1. **Clone and Navigate to Project**
   ```bash
   cd /path/to/health-records-system
   ```

2. **Run Setup Script**
   ```bash
   chmod +x setup-jenkins.sh
   ./setup-jenkins.sh
   ```

3. **Access Services**
   - Jenkins: https://jenkins.local (admin/admin123)
   - SonarQube: https://sonar.local (admin/admin)
   - Nexus: https://nexus.local (admin/admin123)
   - Grafana: https://grafana.local (admin/admin123)

## 📋 Pipeline Features

### Automated Stages
1. **Checkout**: Source code retrieval
2. **Pre-build Setup**: Parallel dependency installation
3. **Code Quality Analysis**: ESLint, Checkstyle, PMD, SonarQube
4. **Quality Gate**: Automated quality checks
5. **Testing**: Unit tests for backend and frontend
6. **Security Scanning**: OWASP dependency check, npm audit
7. **Build Application**: Maven package and npm build
8. **Docker Build & Push**: Container image creation
9. **Deploy to Staging**: Automated staging deployment
10. **Integration Tests**: End-to-end testing
11. **Deploy to Production**: Manual approval required
12. **Post-Deployment Verification**: Health checks

### Branch Strategy
- **main**: Production deployments (manual approval)
- **develop**: Staging deployments (automatic)
- **feature/***: Build and test only
- **release/***: Staging deployment for testing

## 🔧 Configuration

### Jenkins Configuration

#### Credentials Setup
1. Navigate to Jenkins → Manage Jenkins → Manage Credentials
2. Add the following credentials:
   - `docker-hub-credentials`: Docker Hub username/password
   - `sonarqube-token`: SonarQube authentication token
   - `slack-token`: Slack webhook URL (optional)

#### Tool Configuration
Tools are automatically configured via Configuration as Code:
- Maven 3.9.4
- Node.js 18.17.0
- SonarQube Scanner 4.8.0
- Docker

### SonarQube Setup
1. Access SonarQube at https://sonar.local
2. Login with admin/admin
3. Change default password
4. Create a new project for "health-records-system"
5. Generate authentication token
6. Add token to Jenkins credentials

### Environment Variables

#### Required Environment Variables
```bash
# Application
APP_NAME=health-records-system
APP_VERSION=1.0.0

# Docker Registry
DOCKER_REGISTRY=docker.io
DOCKER_REPO=healthrecords

# Database (for testing)
TEST_DB_URL=jdbc:h2:mem:testdb
TEST_DB_USERNAME=sa
TEST_DB_PASSWORD=

# Notifications
SLACK_CHANNEL=#health-records-ci
EMAIL_RECIPIENTS=dev-team@healthrecords.com
```

## 🐳 Docker Configuration

### Production Images
- **Backend**: `Dockerfile.prod` - Optimized Spring Boot container
- **Frontend**: `frontend/Dockerfile.prod` - Nginx-based React serving

### Image Tagging Strategy
Images are tagged with: `{version}-{build-number}-{git-commit-short}`

Example: `healthrecords/health-records-system-backend:1.0.0-42-a1b2c3d`

## 🧪 Testing Strategy

### Backend Testing
- Unit tests with JUnit 5
- Integration tests with TestContainers
- Code coverage with JaCoCo (minimum 80%)
- Static analysis with Checkstyle, PMD, SpotBugs

### Frontend Testing
- Unit tests with Jest and React Testing Library
- Linting with ESLint
- Type checking with TypeScript
- End-to-end tests with Cypress (in staging)

### Quality Gates
- Code coverage ≥ 80%
- No blocker or critical issues in SonarQube
- All unit tests must pass
- No high/critical security vulnerabilities

## 📊 Monitoring

### Jenkins Metrics
- Build success/failure rates
- Build duration trends
- Queue times
- Agent utilization

### Application Metrics
- Deployment frequency
- Lead time for changes
- Mean time to recovery
- Change failure rate

### Grafana Dashboards
Pre-configured dashboards for:
- Jenkins build metrics
- Application performance
- Infrastructure monitoring

## 🔒 Security

### Pipeline Security
- Non-root containers
- Secret management via Jenkins credentials
- OWASP dependency scanning
- Container image vulnerability scanning

### Network Security
- HTTPS termination at Nginx
- Internal network isolation
- Security headers configured

## 🚀 Deployment Strategies

### Staging Deployment
- Automatic deployment from `develop` branch
- Docker Compose based
- Smoke tests included
- Rollback capability

### Production Deployment
- Manual approval required
- Blue-green deployment recommended
- Health checks and monitoring
- Automated rollback on failure

## 📝 Customization

### Adding New Pipeline Steps
1. Edit `Jenkinsfile` in your repository
2. Use the shared library functions from `jenkins/shared-library/`
3. Test in feature branch first

### Custom Quality Gates
Modify the quality gate configuration in `buildHealthRecordsApp.groovy`:
```groovy
def runQualityGates(Map config) {
    // Add your custom quality checks here
}
```

### Notification Customization
Update notification settings in the pipeline post actions:
```groovy
post {
    success {
        // Custom success notifications
    }
    failure {
        // Custom failure notifications
    }
}
```

## 🔧 Maintenance

### Backup
Automated Jenkins backup runs via Docker Compose:
```bash
docker-compose -f docker-compose.jenkins.yml run jenkins-backup
```

### Updates
Update service versions in `docker-compose.jenkins.yml`:
```yaml
jenkins:
  image: jenkins/jenkins:lts-jdk17  # Update version here
```

### Log Management
View logs for services:
```bash
# All services
docker-compose -f docker-compose.jenkins.yml logs -f

# Specific service
docker-compose -f docker-compose.jenkins.yml logs -f jenkins
```

## 🐛 Troubleshooting

### Common Issues

#### Jenkins Won't Start
1. Check Docker daemon is running
2. Verify port 8080 is available
3. Check Jenkins logs: `docker-compose logs jenkins`

#### Pipeline Fails at Docker Build
1. Verify Docker-in-Docker is running
2. Check Docker Hub credentials
3. Ensure Dockerfile syntax is correct

#### SonarQube Quality Gate Fails
1. Check SonarQube is accessible
2. Verify authentication token
3. Review code quality issues in SonarQube UI

#### Tests Fail
1. Check test database configuration
2. Verify test dependencies are installed
3. Review test logs in Jenkins

### Debug Commands
```bash
# Check service status
docker-compose -f docker-compose.jenkins.yml ps

# Enter Jenkins container
docker-compose -f docker-compose.jenkins.yml exec jenkins bash

# View Jenkins logs
docker-compose -f docker-compose.jenkins.yml logs jenkins

# Restart services
docker-compose -f docker-compose.jenkins.yml restart
```

## 📚 Additional Resources

### Documentation
- [Jenkins User Documentation](https://www.jenkins.io/doc/)
- [Docker Documentation](https://docs.docker.com/)
- [SonarQube Documentation](https://docs.sonarqube.org/)

### Best Practices
- Use declarative pipelines
- Implement proper error handling
- Keep pipeline files in version control
- Regular security updates
- Monitor pipeline performance

### Support
For issues specific to this implementation:
1. Check the troubleshooting section above
2. Review Jenkins and service logs
3. Consult the pipeline documentation in the shared library

## 🎯 Performance Optimization

### Jenkins Performance
- Increase Java heap size if needed
- Use parallel stages where possible
- Clean up old builds regularly
- Monitor disk usage

### Build Performance
- Use Docker layer caching
- Parallel test execution
- Incremental builds where possible
- Optimize dependency downloads

### Resource Requirements
- **Minimum**: 4GB RAM, 2 CPU cores
- **Recommended**: 8GB RAM, 4 CPU cores
- **Production**: 16GB RAM, 8 CPU cores

---

This CI/CD implementation provides a robust, scalable foundation for the Health Records System development workflow. Regular maintenance and monitoring will ensure optimal performance and reliability.