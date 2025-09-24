#!/usr/bin/env groovy

/**
 * Health Records Application Build Pipeline Shared Library
 * 
 * This shared library provides reusable functions for building and deploying
 * the Health Records System application.
 */

def call(Map config) {
    pipeline {
        agent any
        
        environment {
            APP_NAME = config.appName ?: 'health-records-system'
            APP_VERSION = config.appVersion ?: '1.0.0'
            DOCKER_REGISTRY = config.dockerRegistry ?: 'docker.io'
            DOCKER_REPO = config.dockerRepo ?: 'healthrecords'
        }
        
        stages {
            stage('Checkout') {
                steps {
                    checkoutCode()
                }
            }
            
            stage('Build') {
                parallel {
                    stage('Backend') {
                        steps {
                            buildBackend(config)
                        }
                    }
                    stage('Frontend') {
                        steps {
                            buildFrontend(config)
                        }
                    }
                }
            }
            
            stage('Test') {
                parallel {
                    stage('Backend Tests') {
                        steps {
                            testBackend(config)
                        }
                    }
                    stage('Frontend Tests') {
                        steps {
                            testFrontend(config)
                        }
                    }
                }
            }
            
            stage('Quality Gates') {
                steps {
                    runQualityGates(config)
                }
            }
            
            stage('Security Scan') {
                steps {
                    runSecurityScans(config)
                }
            }
            
            stage('Docker Build') {
                when {
                    anyOf {
                        branch 'main'
                        branch 'develop'
                    }
                }
                steps {
                    buildAndPushDockerImages(config)
                }
            }
            
            stage('Deploy') {
                steps {
                    deployApplication(config)
                }
            }
        }
        
        post {
            always {
                publishReports(config)
                sendNotifications(config)
            }
        }
    }
}

def checkoutCode() {
    echo "Checking out source code..."
    checkout scm
    
    script {
        env.GIT_COMMIT_SHORT = sh(
            script: "git rev-parse --short HEAD",
            returnStdout: true
        ).trim()
        
        env.BUILD_TIMESTAMP = sh(
            script: "date +%Y%m%d-%H%M%S",
            returnStdout: true
        ).trim()
    }
}

def buildBackend(Map config) {
    echo "Building Spring Boot backend..."
    
    dir('.') {
        sh '''
            echo "Validating Maven configuration..."
            mvn validate
            
            echo "Compiling backend application..."
            mvn clean compile -DskipTests
            
            echo "Backend build completed successfully"
        '''
    }
}

def buildFrontend(Map config) {
    echo "Building React frontend..."
    
    dir('frontend') {
        sh '''
            echo "Installing frontend dependencies..."
            npm ci
            
            echo "Running TypeScript compilation..."
            npx tsc --noEmit
            
            echo "Building production bundle..."
            npm run build
            
            echo "Frontend build completed successfully"
        '''
    }
}

def testBackend(Map config) {
    echo "Running backend tests..."
    
    dir('.') {
        sh '''
            echo "Running unit tests..."
            mvn test -Dspring.profiles.active=test
            
            echo "Generating test reports..."
            mvn jacoco:report
        '''
    }
    
    // Publish test results
    junit 'target/surefire-reports/*.xml'
    
    // Publish coverage report
    publishHTML([
        allowMissing: false,
        alwaysLinkToLastBuild: false,
        keepAll: true,
        reportDir: 'target/site/jacoco',
        reportFiles: 'index.html',
        reportName: 'Backend Coverage Report'
    ])
}

def testFrontend(Map config) {
    echo "Running frontend tests..."
    
    dir('frontend') {
        sh '''
            echo "Running frontend unit tests..."
            npm test -- --coverage --watchAll=false --passWithNoTests
            
            echo "Running ESLint..."
            npm run lint
        '''
    }
    
    // Publish frontend coverage
    publishHTML([
        allowMissing: false,
        alwaysLinkToLastBuild: false,
        keepAll: true,
        reportDir: 'frontend/coverage/lcov-report',
        reportFiles: 'index.html',
        reportName: 'Frontend Coverage Report'
    ])
}

def runQualityGates(Map config) {
    echo "Running quality gate checks..."
    
    script {
        def qualityGatePassed = true
        
        // Backend quality gates
        dir('.') {
            try {
                sh 'mvn checkstyle:check'
                echo "✅ Checkstyle passed"
            } catch (Exception e) {
                echo "❌ Checkstyle failed: ${e.getMessage()}"
                qualityGatePassed = false
            }
            
            try {
                sh 'mvn pmd:check'
                echo "✅ PMD analysis passed"
            } catch (Exception e) {
                echo "❌ PMD analysis failed: ${e.getMessage()}"
                qualityGatePassed = false
            }
        }
        
        // Frontend quality gates
        dir('frontend') {
            try {
                sh 'npm run lint'
                echo "✅ ESLint passed"
            } catch (Exception e) {
                echo "❌ ESLint failed: ${e.getMessage()}"
                qualityGatePassed = false
            }
        }
        
        if (!qualityGatePassed) {
            error "Quality gates failed. Please fix the issues before proceeding."
        }
    }
}

def runSecurityScans(Map config) {
    echo "Running security scans..."
    
    parallel(
        "Backend Security": {
            dir('.') {
                sh '''
                    echo "Running OWASP dependency check..."
                    mvn org.owasp:dependency-check-maven:check
                '''
                
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: false,
                    keepAll: true,
                    reportDir: 'target',
                    reportFiles: 'dependency-check-report.html',
                    reportName: 'OWASP Dependency Check'
                ])
            }
        },
        "Frontend Security": {
            dir('frontend') {
                sh '''
                    echo "Running npm audit..."
                    npm audit --audit-level=moderate
                '''
            }
        }
    )
}

def buildAndPushDockerImages(Map config) {
    echo "Building and pushing Docker images..."
    
    script {
        def imageTag = "${env.APP_VERSION}-${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
        def backendImageName = "${env.DOCKER_REPO}/${env.APP_NAME}-backend"
        def frontendImageName = "${env.DOCKER_REPO}/${env.APP_NAME}-frontend"
        
        // Build backend image
        def backendImage = docker.build("${backendImageName}:${imageTag}")
        
        // Build frontend image
        def frontendImage = docker.build("${frontendImageName}:${imageTag}", "./frontend")
        
        // Push images to registry
        docker.withRegistry("https://${env.DOCKER_REGISTRY}", 'docker-hub-credentials') {
            backendImage.push()
            backendImage.push('latest')
            
            frontendImage.push()
            frontendImage.push('latest')
            
            echo "✅ Docker images pushed successfully"
            echo "Backend image: ${backendImageName}:${imageTag}"
            echo "Frontend image: ${frontendImageName}:${imageTag}"
        }
        
        // Store image information for deployment
        env.BACKEND_IMAGE = "${backendImageName}:${imageTag}"
        env.FRONTEND_IMAGE = "${frontendImageName}:${imageTag}"
    }
}

def deployApplication(Map config) {
    echo "Deploying application..."
    
    script {
        def deploymentTarget = determineDeploymentTarget()
        
        switch(deploymentTarget) {
            case 'staging':
                deployToStaging(config)
                break
            case 'production':
                deployToProduction(config)
                break
            default:
                echo "No deployment for branch: ${env.BRANCH_NAME}"
        }
    }
}

def determineDeploymentTarget() {
    if (env.BRANCH_NAME == 'develop') {
        return 'staging'
    } else if (env.BRANCH_NAME == 'main') {
        return 'production'
    }
    return 'none'
}

def deployToStaging(Map config) {
    echo "Deploying to staging environment..."
    
    sh '''
        echo "Setting up staging environment..."
        # Add your staging deployment logic here
        # This could involve:
        # - kubectl apply for Kubernetes
        # - docker-compose up for Docker Compose
        # - Ansible playbooks
        # - Custom deployment scripts
        
        echo "Staging deployment completed"
    '''
    
    // Run smoke tests
    runSmokeTests('staging')
}

def deployToProduction(Map config) {
    echo "Preparing production deployment..."
    
    // Require manual approval for production
    input message: 'Deploy to Production?', 
          ok: 'Deploy',
          submitterParameter: 'APPROVER'
    
    echo "Production deployment approved by: ${env.APPROVER}"
    
    sh '''
        echo "Deploying to production environment..."
        # Add your production deployment logic here
        
        echo "Production deployment completed"
    '''
    
    // Run smoke tests
    runSmokeTests('production')
}

def runSmokeTests(String environment) {
    echo "Running smoke tests for ${environment}..."
    
    script {
        def healthCheckUrl = getHealthCheckUrl(environment)
        
        sh """
            echo "Running health check on ${healthCheckUrl}..."
            
            # Wait for application to be ready
            for i in {1..30}; do
                if curl -f ${healthCheckUrl}/actuator/health; then
                    echo "✅ Health check passed"
                    break
                else
                    echo "Waiting for application to be ready... (attempt \$i/30)"
                    sleep 10
                fi
            done
        """
    }
}

def getHealthCheckUrl(String environment) {
    switch(environment) {
        case 'staging':
            return 'http://staging.healthrecords.com'
        case 'production':
            return 'http://prod.healthrecords.com'
        default:
            return 'http://localhost:8080'
    }
}

def publishReports(Map config) {
    echo "Publishing build reports..."
    
    // Archive artifacts
    archiveArtifacts artifacts: 'target/*.jar', fingerprint: true, allowEmptyArchive: true
    archiveArtifacts artifacts: 'frontend/dist/**/*', fingerprint: true, allowEmptyArchive: true
    
    // Publish test results if they exist
    if (fileExists('target/surefire-reports/*.xml')) {
        junit 'target/surefire-reports/*.xml'
    }
}

def sendNotifications(Map config) {
    echo "Sending build notifications..."
    
    script {
        def buildStatus = currentBuild.result ?: 'SUCCESS'
        def color = getBuildColor(buildStatus)
        def emoji = getBuildEmoji(buildStatus)
        
        // Slack notification
        if (config.slackChannel) {
            slackSend(
                channel: config.slackChannel,
                color: color,
                message: """
                    ${emoji} *Build ${buildStatus}*
                    
                    *Project:* ${env.APP_NAME}
                    *Branch:* ${env.BRANCH_NAME}
                    *Build:* ${env.BUILD_NUMBER}
                    *Commit:* ${env.GIT_COMMIT_SHORT}
                    *Duration:* ${currentBuild.durationString}
                    
                    <${env.BUILD_URL}|View Build Details>
                """
            )
        }
        
        // Email notification for failures
        if (buildStatus != 'SUCCESS' && config.emailRecipients) {
            emailext(
                subject: "${emoji} Build ${buildStatus} - ${env.APP_NAME}",
                body: """
                    Build ${buildStatus} for ${env.APP_NAME}
                    
                    Branch: ${env.BRANCH_NAME}
                    Build Number: ${env.BUILD_NUMBER}
                    Commit: ${env.GIT_COMMIT_SHORT}
                    Duration: ${currentBuild.durationString}
                    
                    View details: ${env.BUILD_URL}
                """,
                to: config.emailRecipients
            )
        }
    }
}

def getBuildColor(String status) {
    switch(status) {
        case 'SUCCESS':
            return 'good'
        case 'FAILURE':
            return 'danger'
        case 'UNSTABLE':
            return 'warning'
        default:
            return 'warning'
    }
}

def getBuildEmoji(String status) {
    switch(status) {
        case 'SUCCESS':
            return '✅'
        case 'FAILURE':
            return '❌'
        case 'UNSTABLE':
            return '⚠️'
        default:
            return 'ℹ️'
    }
}