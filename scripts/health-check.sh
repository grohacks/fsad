#!/bin/bash

# Health Records System Health Check Script
# Comprehensive health checks for the deployed application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="health-records"
BACKEND_SERVICE="health-records-backend-service"
FRONTEND_SERVICE="health-records-frontend-service"
MYSQL_SERVICE="mysql-service"

# Default values
ENVIRONMENT="staging"
VERBOSE=false
TIMEOUT=30

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Perform comprehensive health checks on Health Records System

OPTIONS:
    -e, --environment ENV    Target environment (staging|production) [default: staging]
    -t, --timeout SECONDS   Timeout for health checks [default: 30]
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

EXAMPLES:
    $0 --environment production
    $0 --timeout 60 --verbose

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
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
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

# Check prerequisites
check_prerequisites() {
    print_header "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_error "Namespace '$NAMESPACE' does not exist"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Check namespace status
check_namespace() {
    print_header "Checking namespace status..."
    
    local namespace_status=$(kubectl get namespace "$NAMESPACE" -o jsonpath='{.status.phase}')
    
    if [[ "$namespace_status" == "Active" ]]; then
        print_status "Namespace '$NAMESPACE' is active"
    else
        print_error "Namespace '$NAMESPACE' status: $namespace_status"
        return 1
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        kubectl describe namespace "$NAMESPACE"
    fi
}

# Check deployments
check_deployments() {
    print_header "Checking deployment status..."
    
    local deployments=("health-records-backend" "health-records-frontend")
    local all_healthy=true
    
    for deployment in "${deployments[@]}"; do
        local available=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.availableReplicas}' 2>/dev/null || echo "0")
        local desired=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
        
        if [[ "$available" == "$desired" && "$available" -gt 0 ]]; then
            print_status "Deployment '$deployment': $available/$desired replicas available"
        else
            print_error "Deployment '$deployment': $available/$desired replicas available"
            all_healthy=false
        fi
        
        if [[ "$VERBOSE" == "true" ]]; then
            kubectl describe deployment "$deployment" -n "$NAMESPACE"
        fi
    done
    
    if [[ "$all_healthy" == "false" ]]; then
        return 1
    fi
}

# Check pods
check_pods() {
    print_header "Checking pod status..."
    
    local pods=$(kubectl get pods -n "$NAMESPACE" --no-headers)
    local total_pods=0
    local running_pods=0
    local ready_pods=0
    
    while IFS= read -r pod_line; do
        if [[ -n "$pod_line" ]]; then
            total_pods=$((total_pods + 1))
            local status=$(echo "$pod_line" | awk '{print $3}')
            local ready=$(echo "$pod_line" | awk '{print $2}')
            local pod_name=$(echo "$pod_line" | awk '{print $1}')
            
            if [[ "$status" == "Running" ]]; then
                running_pods=$((running_pods + 1))
                print_status "Pod '$pod_name': $status ($ready)"
                
                # Check if pod is ready
                if [[ "$ready" =~ ^[0-9]+/[0-9]+$ ]]; then
                    local ready_count=$(echo "$ready" | cut -d'/' -f1)
                    local total_count=$(echo "$ready" | cut -d'/' -f2)
                    if [[ "$ready_count" == "$total_count" ]]; then
                        ready_pods=$((ready_pods + 1))
                    fi
                fi
            else
                print_error "Pod '$pod_name': $status ($ready)"
            fi
            
            if [[ "$VERBOSE" == "true" ]]; then
                kubectl describe pod "$pod_name" -n "$NAMESPACE"
            fi
        fi
    done <<< "$pods"
    
    print_status "Pod summary: $running_pods/$total_pods running, $ready_pods/$total_pods ready"
    
    if [[ $running_pods -ne $total_pods || $ready_pods -ne $total_pods ]]; then
        return 1
    fi
}

# Check services
check_services() {
    print_header "Checking service status..."
    
    local services=("$BACKEND_SERVICE" "$FRONTEND_SERVICE" "$MYSQL_SERVICE")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        if kubectl get service "$service" -n "$NAMESPACE" &> /dev/null; then
            local endpoints=$(kubectl get endpoints "$service" -n "$NAMESPACE" -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)
            
            if [[ $endpoints -gt 0 ]]; then
                print_status "Service '$service': $endpoints endpoints available"
            else
                print_error "Service '$service': no endpoints available"
                all_healthy=false
            fi
        else
            print_error "Service '$service': not found"
            all_healthy=false
        fi
        
        if [[ "$VERBOSE" == "true" ]]; then
            kubectl describe service "$service" -n "$NAMESPACE"
        fi
    done
    
    if [[ "$all_healthy" == "false" ]]; then
        return 1
    fi
}

# Check persistent volumes
check_persistent_volumes() {
    print_header "Checking persistent volume status..."
    
    local pvcs=$(kubectl get pvc -n "$NAMESPACE" --no-headers 2>/dev/null || echo "")
    
    if [[ -z "$pvcs" ]]; then
        print_warning "No persistent volume claims found"
        return 0
    fi
    
    while IFS= read -r pvc_line; do
        if [[ -n "$pvc_line" ]]; then
            local pvc_name=$(echo "$pvc_line" | awk '{print $1}')
            local status=$(echo "$pvc_line" | awk '{print $2}')
            
            if [[ "$status" == "Bound" ]]; then
                print_status "PVC '$pvc_name': $status"
            else
                print_error "PVC '$pvc_name': $status"
                return 1
            fi
        fi
    done <<< "$pvcs"
}

# Check application health endpoints
check_application_health() {
    print_header "Checking application health endpoints..."
    
    # Check backend health
    local backend_pod=$(kubectl get pods -l app=health-records-backend -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$backend_pod" ]]; then
        print_header "Checking backend health endpoint..."
        
        if kubectl exec -n "$NAMESPACE" "$backend_pod" -- curl -f -s --max-time "$TIMEOUT" http://localhost:8080/actuator/health > /dev/null 2>&1; then
            print_status "Backend health endpoint: OK"
            
            # Get detailed health info if verbose
            if [[ "$VERBOSE" == "true" ]]; then
                kubectl exec -n "$NAMESPACE" "$backend_pod" -- curl -s http://localhost:8080/actuator/health | jq . 2>/dev/null || echo "Health data retrieved"
            fi
        else
            print_error "Backend health endpoint: Failed"
            return 1
        fi
        
        # Check backend metrics endpoint
        if kubectl exec -n "$NAMESPACE" "$backend_pod" -- curl -f -s --max-time "$TIMEOUT" http://localhost:8080/actuator/prometheus > /dev/null 2>&1; then
            print_status "Backend metrics endpoint: OK"
        else
            print_warning "Backend metrics endpoint: Failed"
        fi
    else
        print_error "No backend pods found"
        return 1
    fi
    
    # Check frontend health
    local frontend_pod=$(kubectl get pods -l app=health-records-frontend -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$frontend_pod" ]]; then
        print_header "Checking frontend health endpoint..."
        
        if kubectl exec -n "$NAMESPACE" "$frontend_pod" -- curl -f -s --max-time "$TIMEOUT" http://localhost/health > /dev/null 2>&1; then
            print_status "Frontend health endpoint: OK"
        else
            print_error "Frontend health endpoint: Failed"
            return 1
        fi
    else
        print_error "No frontend pods found"
        return 1
    fi
}

# Check database connectivity
check_database() {
    print_header "Checking database connectivity..."
    
    local mysql_pod=$(kubectl get pods -l app=mysql -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$mysql_pod" ]]; then
        if kubectl exec -n "$NAMESPACE" "$mysql_pod" -- mysql -u root -p"$(kubectl get secret mysql-secret -n "$NAMESPACE" -o jsonpath='{.data.mysql-root-password}' | base64 -d)" -e "SELECT 1" > /dev/null 2>&1; then
            print_status "Database connectivity: OK"
            
            # Check database status
            if [[ "$VERBOSE" == "true" ]]; then
                kubectl exec -n "$NAMESPACE" "$mysql_pod" -- mysql -u root -p"$(kubectl get secret mysql-secret -n "$NAMESPACE" -o jsonpath='{.data.mysql-root-password}' | base64 -d)" -e "SHOW STATUS LIKE 'Uptime'" 2>/dev/null || true
            fi
        else
            print_error "Database connectivity: Failed"
            return 1
        fi
    else
        print_error "No MySQL pods found"
        return 1
    fi
}

# Check resource usage
check_resource_usage() {
    print_header "Checking resource usage..."
    
    # Check if metrics server is available
    if ! kubectl top nodes &> /dev/null; then
        print_warning "Metrics server not available, skipping resource usage check"
        return 0
    fi
    
    print_status "Node resource usage:"
    kubectl top nodes
    
    echo ""
    print_status "Pod resource usage:"
    kubectl top pods -n "$NAMESPACE"
}

# Check ingress
check_ingress() {
    print_header "Checking ingress status..."
    
    local ingresses=$(kubectl get ingress -n "$NAMESPACE" --no-headers 2>/dev/null || echo "")
    
    if [[ -z "$ingresses" ]]; then
        print_warning "No ingress resources found"
        return 0
    fi
    
    while IFS= read -r ingress_line; do
        if [[ -n "$ingress_line" ]]; then
            local ingress_name=$(echo "$ingress_line" | awk '{print $1}')
            local hosts=$(echo "$ingress_line" | awk '{print $3}')
            local address=$(echo "$ingress_line" | awk '{print $4}')
            
            if [[ -n "$address" && "$address" != "<none>" ]]; then
                print_status "Ingress '$ingress_name': $hosts -> $address"
            else
                print_warning "Ingress '$ingress_name': no address assigned"
            fi
            
            if [[ "$VERBOSE" == "true" ]]; then
                kubectl describe ingress "$ingress_name" -n "$NAMESPACE"
            fi
        fi
    done <<< "$ingresses"
}

# Generate health report
generate_health_report() {
    print_header "Health Check Summary"
    
    local timestamp=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
    
    echo ""
    echo "📊 Health Check Report"
    echo "======================"
    echo "Timestamp: $timestamp"
    echo "Environment: $ENVIRONMENT"
    echo "Namespace: $NAMESPACE"
    echo ""
    
    # Overall status
    if [[ $? -eq 0 ]]; then
        print_status "Overall Status: HEALTHY ✅"
    else
        print_error "Overall Status: UNHEALTHY ❌"
    fi
    
    echo ""
    echo "🔍 Detailed Status:"
    kubectl get all -n "$NAMESPACE"
    
    echo ""
    echo "📋 Recent Events:"
    kubectl get events -n "$NAMESPACE" --sort-by=.metadata.creationTimestamp | tail -5
}

# Main health check function
main() {
    echo "🏥 Health Records System - Health Check"
    echo "======================================="
    echo ""
    
    parse_args "$@"
    
    if [[ "$VERBOSE" == "true" ]]; then
        set -x
    fi
    
    local overall_status=0
    
    check_prerequisites || overall_status=$?
    check_namespace || overall_status=$?
    check_deployments || overall_status=$?
    check_pods || overall_status=$?
    check_services || overall_status=$?
    check_persistent_volumes || overall_status=$?
    check_application_health || overall_status=$?
    check_database || overall_status=$?
    check_resource_usage || overall_status=$?
    check_ingress || overall_status=$?
    
    generate_health_report
    
    if [[ $overall_status -eq 0 ]]; then
        echo ""
        print_status "✅ All health checks passed!"
        exit 0
    else
        echo ""
        print_error "❌ Some health checks failed!"
        exit 1
    fi
}

# Handle script interruption
trap 'print_error "Health check interrupted"; exit 1' INT TERM

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi