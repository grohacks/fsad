#!/bin/bash

# Health Records System Rollback Script
# Supports rolling back deployments in Kubernetes

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
APP_NAME="health-records-system"
NAMESPACE="health-records"

# Default values
ENVIRONMENT="staging"
DRY_RUN=false
VERBOSE=false
REVISION=""
COMPONENT="all"

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

Rollback Health Records System deployment in Kubernetes

OPTIONS:
    -e, --environment ENV    Target environment (staging|production) [default: staging]
    -r, --revision REV       Specific revision to rollback to [default: previous]
    -c, --component COMP     Component to rollback (backend|frontend|all) [default: all]
    -d, --dry-run           Show what would be rolled back without actually doing it
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

EXAMPLES:
    $0 --environment production --component backend
    $0 --revision 3 --component all
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
            -r|--revision)
                REVISION="$2"
                shift 2
                ;;
            -c|--component)
                COMPONENT="$2"
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

# Validate inputs
validate_inputs() {
    print_header "Validating inputs..."
    
    # Validate environment
    case $ENVIRONMENT in
        staging|production)
            print_status "Environment '$ENVIRONMENT' is valid"
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
            exit 1
            ;;
    esac
    
    # Validate component
    case $COMPONENT in
        backend|frontend|all)
            print_status "Component '$COMPONENT' is valid"
            ;;
        *)
            print_error "Invalid component: $COMPONENT. Must be 'backend', 'frontend', or 'all'"
            exit 1
            ;;
    esac
    
    # Validate revision if provided
    if [[ -n "$REVISION" && ! "$REVISION" =~ ^[0-9]+$ ]]; then
        print_error "Invalid revision: $REVISION. Must be a number"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_error "Namespace '$NAMESPACE' does not exist"
        exit 1
    fi
    
    print_status "Prerequisites check completed"
}

# Show rollout history
show_rollout_history() {
    print_header "Current rollout history..."
    
    if [[ "$COMPONENT" == "backend" || "$COMPONENT" == "all" ]]; then
        echo ""
        print_status "Backend deployment history:"
        kubectl rollout history deployment/health-records-backend -n "$NAMESPACE"
    fi
    
    if [[ "$COMPONENT" == "frontend" || "$COMPONENT" == "all" ]]; then
        echo ""
        print_status "Frontend deployment history:"
        kubectl rollout history deployment/health-records-frontend -n "$NAMESPACE"
    fi
}

# Get current deployment status
get_current_status() {
    print_header "Current deployment status..."
    
    if [[ "$COMPONENT" == "backend" || "$COMPONENT" == "all" ]]; then
        echo ""
        print_status "Backend deployment status:"
        kubectl get deployment health-records-backend -n "$NAMESPACE" -o wide
    fi
    
    if [[ "$COMPONENT" == "frontend" || "$COMPONENT" == "all" ]]; then
        echo ""
        print_status "Frontend deployment status:"
        kubectl get deployment health-records-frontend -n "$NAMESPACE" -o wide
    fi
}

# Perform rollback
perform_rollback() {
    print_header "Performing rollback..."
    
    local rollback_cmd_suffix=""
    if [[ -n "$REVISION" ]]; then
        rollback_cmd_suffix="--to-revision=$REVISION"
    fi
    
    if [[ "$COMPONENT" == "backend" || "$COMPONENT" == "all" ]]; then
        print_status "Rolling back backend deployment..."
        
        if [[ "$DRY_RUN" == "true" ]]; then
            print_status "Dry run: Would execute: kubectl rollout undo deployment/health-records-backend -n $NAMESPACE $rollback_cmd_suffix"
        else
            kubectl rollout undo deployment/health-records-backend -n "$NAMESPACE" $rollback_cmd_suffix
            print_status "Backend rollback initiated"
        fi
    fi
    
    if [[ "$COMPONENT" == "frontend" || "$COMPONENT" == "all" ]]; then
        print_status "Rolling back frontend deployment..."
        
        if [[ "$DRY_RUN" == "true" ]]; then
            print_status "Dry run: Would execute: kubectl rollout undo deployment/health-records-frontend -n $NAMESPACE $rollback_cmd_suffix"
        else
            kubectl rollout undo deployment/health-records-frontend -n "$NAMESPACE" $rollback_cmd_suffix
            print_status "Frontend rollback initiated"
        fi
    fi
}

# Wait for rollback completion
wait_for_rollback() {
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run: Would wait for rollback completion"
        return 0
    fi
    
    print_header "Waiting for rollback to complete..."
    
    if [[ "$COMPONENT" == "backend" || "$COMPONENT" == "all" ]]; then
        print_status "Waiting for backend rollback..."
        kubectl rollout status deployment/health-records-backend -n "$NAMESPACE" --timeout=300s
    fi
    
    if [[ "$COMPONENT" == "frontend" || "$COMPONENT" == "all" ]]; then
        print_status "Waiting for frontend rollback..."
        kubectl rollout status deployment/health-records-frontend -n "$NAMESPACE" --timeout=300s
    fi
    
    print_status "Rollback completed successfully"
}

# Verify rollback
verify_rollback() {
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run: Would verify rollback"
        return 0
    fi
    
    print_header "Verifying rollback..."
    
    # Check pod status
    local total_pods=$(kubectl get pods -l 'app in (health-records-backend,health-records-frontend)' -n "$NAMESPACE" --no-headers | wc -l)
    local running_pods=$(kubectl get pods -l 'app in (health-records-backend,health-records-frontend)' -n "$NAMESPACE" --field-selector=status.phase=Running --no-headers | wc -l)
    
    print_status "Total pods: $total_pods, Running pods: $running_pods"
    
    if [[ $running_pods -eq $total_pods && $total_pods -gt 0 ]]; then
        print_status "✅ All pods are running successfully"
    else
        print_error "❌ Some pods are not running properly"
        kubectl get pods -l 'app in (health-records-backend,health-records-frontend)' -n "$NAMESPACE"
        exit 1
    fi
    
    # Basic health check
    print_status "Running basic health checks..."
    
    if [[ "$COMPONENT" == "backend" || "$COMPONENT" == "all" ]]; then
        local backend_pod=$(kubectl get pods -l app=health-records-backend -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
        if [[ -n "$backend_pod" ]]; then
            kubectl exec -n "$NAMESPACE" "$backend_pod" -- curl -f http://localhost:8080/actuator/health > /dev/null 2>&1 && \
                print_status "✅ Backend health check passed" || \
                print_warning "⚠️  Backend health check failed"
        fi
    fi
    
    print_status "Rollback verification completed"
}

# Show post-rollback status
show_post_rollback_status() {
    print_header "Post-rollback status"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run completed. No actual rollback was performed."
        return 0
    fi
    
    echo ""
    echo "📊 Rollback Summary:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Component: $COMPONENT"
    echo "  Namespace: $NAMESPACE"
    if [[ -n "$REVISION" ]]; then
        echo "  Rolled back to revision: $REVISION"
    else
        echo "  Rolled back to: previous revision"
    fi
    echo ""
    
    echo "🚀 Current Deployment Status:"
    kubectl get deployments -n "$NAMESPACE" -o wide
    
    echo ""
    echo "📋 Current Pods:"
    kubectl get pods -l 'app in (health-records-backend,health-records-frontend)' -n "$NAMESPACE" -o wide
    
    echo ""
    echo "📋 Recent Events:"
    kubectl get events -n "$NAMESPACE" --sort-by=.metadata.creationTimestamp | tail -10
}

# Confirmation prompt
confirm_rollback() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo ""
        print_warning "⚠️  You are about to rollback PRODUCTION environment!"
        echo "Environment: $ENVIRONMENT"
        echo "Component: $COMPONENT"
        echo "Namespace: $NAMESPACE"
        if [[ -n "$REVISION" ]]; then
            echo "Target revision: $REVISION"
        else
            echo "Target: Previous revision"
        fi
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            print_status "Rollback cancelled by user"
            exit 0
        fi
    fi
}

# Main rollback function
main() {
    echo "🏥 Health Records System - Kubernetes Rollback"
    echo "=============================================="
    echo ""
    
    parse_args "$@"
    validate_inputs
    check_prerequisites
    
    if [[ "$VERBOSE" == "true" ]]; then
        set -x
    fi
    
    show_rollout_history
    get_current_status
    confirm_rollback
    perform_rollback
    wait_for_rollback
    verify_rollback
    show_post_rollback_status
    
    echo ""
    print_status "✅ Rollback completed successfully!"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo ""
        print_status "🎯 Production rollback completed!"
        print_status "📧 Don't forget to notify the team about the rollback"
        print_status "🔍 Please investigate the root cause of the issue"
    fi
}

# Handle script interruption
trap 'print_error "Rollback interrupted"; exit 1' INT TERM

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi