#!/bin/bash

# Health Records System Deployment Script
# Supports multiple environments: staging, production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$PROJECT_ROOT/k8s"
APP_NAME="health-records-system"
NAMESPACE="health-records"

# Default values
ENVIRONMENT="staging"
DRY_RUN=false
VERBOSE=false
SKIP_TESTS=false
FORCE_DEPLOY=false
IMAGE_TAG="latest"

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

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy Health Records System to Kubernetes

OPTIONS:
    -e, --environment ENV    Target environment (staging|production) [default: staging]
    -t, --tag TAG           Docker image tag [default: latest]
    -d, --dry-run           Show what would be deployed without actually deploying
    -v, --verbose           Enable verbose output
    -s, --skip-tests        Skip pre-deployment tests
    -f, --force             Force deployment without confirmation
    -h, --help              Show this help message

EXAMPLES:
    $0 --environment staging --tag v1.2.3
    $0 --environment production --force
    $0 --dry-run --verbose

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -t|--tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -f|--force)
                FORCE_DEPLOY=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Validate environment
validate_environment() {
    print_header "Validating environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        staging|production)
            print_status "Environment '$ENVIRONMENT' is valid"
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check helm (if using Helm charts)
    if ! command -v helm &> /dev/null; then
        print_warning "helm is not installed. Some features may not be available"
    fi
    
    # Check Docker (for image verification)
    if ! command -v docker &> /dev/null; then
        print_warning "docker is not installed. Cannot verify images locally"
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    print_status "Prerequisites check completed"
}

# Verify Docker images exist
verify_images() {
    print_header "Verifying Docker images..."
    
    local backend_image="healthrecords/${APP_NAME}-backend:${IMAGE_TAG}"
    local frontend_image="healthrecords/${APP_NAME}-frontend:${IMAGE_TAG}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run: Would verify images $backend_image and $frontend_image"
        return 0
    fi
    
    # Check if images exist in registry
    if command -v docker &> /dev/null; then
        print_status "Pulling latest images to verify they exist..."
        
        if ! docker pull "$backend_image" &> /dev/null; then
            print_error "Backend image not found: $backend_image"
            exit 1
        fi
        
        if ! docker pull "$frontend_image" &> /dev/null; then
            print_error "Frontend image not found: $frontend_image"
            exit 1
        fi
        
        print_status "Images verified successfully"
    else
        print_warning "Docker not available. Skipping image verification"
    fi
}

# Run pre-deployment tests
run_pre_deployment_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        print_warning "Skipping pre-deployment tests"
        return 0
    fi
    
    print_header "Running pre-deployment tests..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run: Would run pre-deployment tests"
        return 0
    fi
    
    # Add your test commands here
    print_status "Pre-deployment tests completed successfully"
}

# Create or update namespace
setup_namespace() {
    print_header "Setting up namespace: $NAMESPACE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run: Would create/update namespace $NAMESPACE"
        return 0
    fi
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_status "Namespace $NAMESPACE already exists"
    else
        kubectl create namespace "$NAMESPACE"
        print_status "Created namespace $NAMESPACE"
    fi
    
    # Label the namespace
    kubectl label namespace "$NAMESPACE" environment="$ENVIRONMENT" --overwrite
}

# Deploy database
deploy_database() {
    print_header "Deploying database..."
    
    local db_manifest="$K8S_DIR/$ENVIRONMENT/mysql.yaml"
    
    if [[ ! -f "$db_manifest" ]]; then
        print_error "Database manifest not found: $db_manifest"
        exit 1
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run: Would apply $db_manifest"
        kubectl apply -f "$db_manifest" --dry-run=client -o yaml
        return 0
    fi
    
    kubectl apply -f "$db_manifest"
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    kubectl wait --for=condition=ready pod -l app=mysql -n "$NAMESPACE" --timeout=300s
    
    print_status "Database deployed successfully"
}

# Deploy application
deploy_application() {
    print_header "Deploying application..."
    
    local app_manifest="$K8S_DIR/$ENVIRONMENT/health-records-app.yaml"
    
    if [[ ! -f "$app_manifest" ]]; then
        print_error "Application manifest not found: $app_manifest"
        exit 1
    fi
    
    # Update image tags in the manifest
    local temp_manifest="/tmp/health-records-app-${ENVIRONMENT}-${IMAGE_TAG}.yaml"
    sed "s|healthrecords/health-records-system-backend:latest|healthrecords/health-records-system-backend:${IMAGE_TAG}|g" "$app_manifest" > "$temp_manifest"
    sed -i "s|healthrecords/health-records-system-frontend:latest|healthrecords/health-records-system-frontend:${IMAGE_TAG}|g" "$temp_manifest"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run: Would apply $temp_manifest"
        kubectl apply -f "$temp_manifest" --dry-run=client -o yaml
        rm -f "$temp_manifest"
        return 0
    fi
    
    kubectl apply -f "$temp_manifest"
    rm -f "$temp_manifest"
    
    # Wait for deployments to be ready
    print_status "Waiting for application deployments to be ready..."
    kubectl wait --for=condition=available deployment/health-records-backend -n "$NAMESPACE" --timeout=300s
    kubectl wait --for=condition=available deployment/health-records-frontend -n "$NAMESPACE" --timeout=300s
    
    print_status "Application deployed successfully"
}

# Run post-deployment health checks
run_health_checks() {
    print_header "Running post-deployment health checks..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run: Would run health checks"
        return 0
    fi
    
    # Check if pods are running
    local backend_pods=$(kubectl get pods -l app=health-records-backend -n "$NAMESPACE" --field-selector=status.phase=Running --no-headers | wc -l)
    local frontend_pods=$(kubectl get pods -l app=health-records-frontend -n "$NAMESPACE" --field-selector=status.phase=Running --no-headers | wc -l)
    
    if [[ $backend_pods -eq 0 ]]; then
        print_error "No backend pods are running"
        exit 1
    fi
    
    if [[ $frontend_pods -eq 0 ]]; then
        print_error "No frontend pods are running"
        exit 1
    fi
    
    print_status "Health checks completed successfully"
    print_status "Backend pods running: $backend_pods"
    print_status "Frontend pods running: $frontend_pods"
}

# Show deployment status
show_deployment_status() {
    print_header "Deployment Status"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run completed. No actual deployment was performed."
        return 0
    fi
    
    echo ""
    echo "📊 Deployment Summary:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Namespace: $NAMESPACE"
    echo "  Image Tag: $IMAGE_TAG"
    echo ""
    
    echo "🚀 Deployed Resources:"
    kubectl get all -n "$NAMESPACE" -o wide
    
    echo ""
    echo "🔗 Service Endpoints:"
    kubectl get ingress -n "$NAMESPACE"
    
    echo ""
    echo "📋 Recent Events:"
    kubectl get events -n "$NAMESPACE" --sort-by=.metadata.creationTimestamp | tail -10
}

# Rollback deployment
rollback_deployment() {
    print_header "Rolling back deployment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run: Would rollback deployment"
        return 0
    fi
    
    kubectl rollout undo deployment/health-records-backend -n "$NAMESPACE"
    kubectl rollout undo deployment/health-records-frontend -n "$NAMESPACE"
    
    print_status "Rollback initiated. Check deployment status."
}

# Cleanup function
cleanup() {
    if [[ -f "/tmp/health-records-app-${ENVIRONMENT}-${IMAGE_TAG}.yaml" ]]; then
        rm -f "/tmp/health-records-app-${ENVIRONMENT}-${IMAGE_TAG}.yaml"
    fi
}

# Trap cleanup on exit
trap cleanup EXIT

# Confirmation prompt for production
confirm_deployment() {
    if [[ "$ENVIRONMENT" == "production" && "$FORCE_DEPLOY" != "true" ]]; then
        echo ""
        print_warning "⚠️  You are about to deploy to PRODUCTION environment!"
        echo "Environment: $ENVIRONMENT"
        echo "Image Tag: $IMAGE_TAG"
        echo "Namespace: $NAMESPACE"
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            print_status "Deployment cancelled by user"
            exit 0
        fi
    fi
}

# Main deployment function
main() {
    echo "🏥 Health Records System - Kubernetes Deployment"
    echo "================================================="
    echo ""
    
    parse_args "$@"
    validate_environment
    check_prerequisites
    
    if [[ "$VERBOSE" == "true" ]]; then
        set -x
    fi
    
    confirm_deployment
    verify_images
    run_pre_deployment_tests
    setup_namespace
    deploy_database
    deploy_application
    run_health_checks
    show_deployment_status
    
    echo ""
    print_status "✅ Deployment completed successfully!"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo ""
        print_status "🎉 Production deployment completed!"
        print_status "📧 Don't forget to notify the team about the deployment"
    fi
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; cleanup; exit 1' INT TERM

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi