pipeline {
    agent any
    
    environment {
        // Application Information
        APP_NAME = 'health-records-system'
        APP_VERSION = '1.0.0'
        
        // Docker Configuration
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_REPO = 'healthrecords'
        DOCKER_IMAGE_TAG = "${APP_VERSION}-${BUILD_NUMBER}"
        
        // Database Configuration for Testing
        TEST_DB_URL = 'jdbc:h2:mem:testdb'
        TEST_DB_USERNAME = 'sa'
        TEST_DB_PASSWORD = ''
        
        // SonarQube Configuration (configure in Jenkins)
        SONAR_HOST_URL = 'http://sonarqube:9000'
        SONAR_LOGIN = credentials('sonarqube-token')
        
        // Deployment Configuration
        STAGING_SERVER = 'staging.healthrecords.com'
        PROD_SERVER = 'prod.healthrecords.com'
        
        // Notification Configuration
        SLACK_CHANNEL = '#health-records-ci'
        EMAIL_RECIPIENTS = 'dev-team@healthrecords.com'
    }
    
    tools {
        maven 'Maven-3.9.4'
        nodejs 'NodeJS-18'
        dockerTool 'Docker'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 45, unit: 'MINUTES')
        retry(2)
        skipStagesAfterUnstable()
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.DOCKER_IMAGE_TAG = "${APP_VERSION}-${BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
                }
                
                checkout scm
                
                // Display build information
                echo "Building ${APP_NAME} version ${APP_VERSION}"
                echo "Git commit: ${GIT_COMMIT_SHORT}"
                echo "Docker image tag: ${DOCKER_IMAGE_TAG}"
            }
        }
        
        stage('Pre-build Setup') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('.') {
                            sh 'mvn clean compile -DskipTests'
                        }
                    }
                }
                
                stage('Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Code Quality Analysis') {
            parallel {
                stage('Backend Code Quality') {
                    steps {
                        dir('.') {
                            script {
                                // Run Maven checkstyle, PMD, SpotBugs
                                sh '''
                                    mvn checkstyle:check pmd:check spotbugs:check
                                '''
                            }
                        }
                    }
                    post {
                        always {
                            // Publish checkstyle results
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: false,
                                keepAll: true,
                                reportDir: 'target/site',
                                reportFiles: 'checkstyle.html',
                                reportName: 'Checkstyle Report'
                            ])
                        }
                    }
                }
                
                stage('Frontend Code Quality') {
                    steps {
                        dir('frontend') {
                            sh 'npm run lint'
                        }
                    }
                }
                
                stage('SonarQube Analysis') {
                    when {
                        anyOf {
                            branch 'main'
                            branch 'develop'
                            changeRequest()
                        }
                    }
                    steps {
                        script {
                            def scannerHome = tool 'SonarQubeScanner'
                            withSonarQubeEnv('SonarQube') {
                                sh """
                                    ${scannerHome}/bin/sonar-scanner \
                                    -Dsonar.projectKey=${APP_NAME} \
                                    -Dsonar.projectName='${APP_NAME}' \
                                    -Dsonar.projectVersion=${APP_VERSION} \
                                    -Dsonar.sources=src/main/java,frontend/src \
                                    -Dsonar.tests=src/test/java \
                                    -Dsonar.java.binaries=target/classes \
                                    -Dsonar.java.test.binaries=target/test-classes \
                                    -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
                                """
                            }
                        }
                    }
                }
            }
        }
        
        stage('Quality Gate') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    changeRequest()
                }
            }
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        stage('Testing') {
            parallel {
                stage('Backend Unit Tests') {
                    steps {
                        dir('.') {
                            sh '''
                                mvn test \
                                -Dspring.datasource.url=${TEST_DB_URL} \
                                -Dspring.datasource.username=${TEST_DB_USERNAME} \
                                -Dspring.datasource.password=${TEST_DB_PASSWORD} \
                                -Dspring.jpa.hibernate.ddl-auto=create-drop
                            '''
                        }
                    }
                    post {
                        always {
                            junit 'target/surefire-reports/*.xml'
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: false,
                                keepAll: true,
                                reportDir: 'target/site/jacoco',
                                reportFiles: 'index.html',
                                reportName: 'Code Coverage Report'
                            ])
                        }
                    }
                }
                
                stage('Frontend Unit Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm test -- --coverage --watchAll=false'
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: false,
                                keepAll: true,
                                reportDir: 'frontend/coverage/lcov-report',
                                reportFiles: 'index.html',
                                reportName: 'Frontend Coverage Report'
                            ])
                        }
                    }
                }
            }
        }
        
        stage('Security Scanning') {
            parallel {
                stage('Backend Security Scan') {
                    steps {
                        dir('.') {
                            // OWASP Dependency Check
                            sh 'mvn org.owasp:dependency-check-maven:check'
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: false,
                                keepAll: true,
                                reportDir: 'target',
                                reportFiles: 'dependency-check-report.html',
                                reportName: 'OWASP Dependency Check Report'
                            ])
                        }
                    }
                }
                
                stage('Frontend Security Scan') {
                    steps {
                        dir('frontend') {
                            sh 'npm audit --audit-level=moderate'
                        }
                    }
                }
            }
        }
        
        stage('Build Application') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('.') {
                            sh 'mvn package -DskipTests'
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
                        }
                    }
                }
                
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm run build'
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'frontend/dist/**/*', fingerprint: true
                        }
                    }
                }
            }
        }
        
        stage('Docker Build & Push') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    branch 'release/*'
                }
            }
            steps {
                script {
                    // Build Docker images
                    def backendImage = docker.build("${DOCKER_REPO}/${APP_NAME}-backend:${DOCKER_IMAGE_TAG}")
                    def frontendImage = docker.build("${DOCKER_REPO}/${APP_NAME}-frontend:${DOCKER_IMAGE_TAG}", "./frontend")
                    
                    // Push to registry
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-hub-credentials') {
                        backendImage.push()
                        backendImage.push('latest')
                        
                        frontendImage.push()
                        frontendImage.push('latest')
                    }
                    
                    // Clean up local images
                    sh "docker rmi ${DOCKER_REPO}/${APP_NAME}-backend:${DOCKER_IMAGE_TAG} || true"
                    sh "docker rmi ${DOCKER_REPO}/${APP_NAME}-frontend:${DOCKER_IMAGE_TAG} || true"
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'release/*'
                }
            }
            steps {
                script {
                    // Deploy to staging environment
                    sh """
                        echo 'Deploying to staging environment...'
                        # Add your deployment script here
                        # This could be kubectl apply, docker-compose, Ansible, etc.
                    """
                }
            }
        }
        
        stage('Integration Tests') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'release/*'
                }
            }
            steps {
                script {
                    // Run integration tests against staging
                    dir('frontend') {
                        sh 'npm run test:e2e || true'
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Manual approval for production deployment
                    input message: 'Deploy to Production?', ok: 'Deploy',
                          submitterParameter: 'APPROVER'
                    
                    echo "Deployment approved by: ${APPROVER}"
                    
                    // Deploy to production
                    sh """
                        echo 'Deploying to production environment...'
                        # Add your production deployment script here
                    """
                }
            }
        }
        
        stage('Post-Deployment Verification') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Health checks and smoke tests
                    sh """
                        echo 'Running post-deployment verification...'
                        # Add health check scripts here
                        # curl -f http://${PROD_SERVER}/actuator/health
                    """
                }
            }
        }
    }
    
    post {
        always {
            // Clean workspace
            cleanWs()
        }
        
        success {
            script {
                if (env.BRANCH_NAME == 'main') {
                    // Send success notification for main branch
                    slackSend(
                        channel: env.SLACK_CHANNEL,
                        color: 'good',
                        message: """
                            ✅ *Production Deployment Successful!*
                            
                            *Project:* ${APP_NAME}
                            *Version:* ${APP_VERSION}
                            *Build:* ${BUILD_NUMBER}
                            *Commit:* ${GIT_COMMIT_SHORT}
                            
                            *Deployed by:* ${APPROVER ?: 'System'}
                            *Duration:* ${currentBuild.durationString}
                            
                            <${BUILD_URL}|View Build Details>
                        """
                    )
                    
                    emailext(
                        subject: "✅ Production Deployment Successful - ${APP_NAME} v${APP_VERSION}",
                        body: """
                            Production deployment completed successfully!
                            
                            Build Details:
                            - Project: ${APP_NAME}
                            - Version: ${APP_VERSION}
                            - Build Number: ${BUILD_NUMBER}
                            - Git Commit: ${GIT_COMMIT_SHORT}
                            - Duration: ${currentBuild.durationString}
                            
                            View full details: ${BUILD_URL}
                        """,
                        to: env.EMAIL_RECIPIENTS
                    )
                }
            }
        }
        
        failure {
            script {
                slackSend(
                    channel: env.SLACK_CHANNEL,
                    color: 'danger',
                    message: """
                        ❌ *Build Failed!*
                        
                        *Project:* ${APP_NAME}
                        *Branch:* ${env.BRANCH_NAME}
                        *Build:* ${BUILD_NUMBER}
                        *Commit:* ${GIT_COMMIT_SHORT}
                        
                        *Duration:* ${currentBuild.durationString}
                        
                        <${BUILD_URL}|View Build Details>
                    """
                )
                
                emailext(
                    subject: "❌ Build Failed - ${APP_NAME} - ${env.BRANCH_NAME}",
                    body: """
                        Build failed for ${APP_NAME}
                        
                        Build Details:
                        - Branch: ${env.BRANCH_NAME}
                        - Build Number: ${BUILD_NUMBER}
                        - Git Commit: ${GIT_COMMIT_SHORT}
                        - Duration: ${currentBuild.durationString}
                        
                        View full details: ${BUILD_URL}
                        Console Output: ${BUILD_URL}console
                    """,
                    to: env.EMAIL_RECIPIENTS
                )
            }
        }
        
        unstable {
            script {
                slackSend(
                    channel: env.SLACK_CHANNEL,
                    color: 'warning',
                    message: """
                        ⚠️ *Build Unstable!*
                        
                        *Project:* ${APP_NAME}
                        *Branch:* ${env.BRANCH_NAME}
                        *Build:* ${BUILD_NUMBER}
                        *Commit:* ${GIT_COMMIT_SHORT}
                        
                        *Duration:* ${currentBuild.durationString}
                        
                        <${BUILD_URL}|View Build Details>
                    """
                )
            }
        }
    }
}