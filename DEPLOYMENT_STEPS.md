# 🚀 Health Records System - Deployment Steps

## Prerequisites Checklist
- [ ] Jenkins running on localhost:9090
- [ ] Java 17+ installed
- [ ] Maven installed
- [ ] Node.js installed
- [ ] MySQL running locally
- [ ] Git installed

## Step 1: Update Configuration Files

### 1.1 Update Database Configuration
Edit `src/main/resources/application-production.properties`:
```properties
# Update these with your actual database details
spring.datasource.url=jdbc:mysql://localhost:3306/healthrecords
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### 1.2 Update Deployment Paths in Jenkinsfile.simple
Edit these lines in `Jenkinsfile.simple`:
```groovy
DEPLOY_DIR = 'C:\\health-records-deploy'  // Change to your preferred path
JAVA_HOME = 'C:\\Program Files\\Java\\jdk-17'  // Change to your Java path
```

## Step 2: Setup GitHub Repository

### 2.1 Create GitHub Repository
1. Go to github.com
2. Click "New repository"
3. Name: `health-records-system`
4. Set to Public or Private
5. Don't initialize with README (we have files)
6. Click "Create repository"

### 2.2 Push Your Code
Run these commands in your project directory:
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Health Records System"

# Add remote origin (replace with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/health-records-system.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 3: Configure Jenkins

### 3.1 Access Jenkins
1. Open browser: http://localhost:9090
2. Login with your Jenkins credentials

### 3.2 Install Required Plugins
1. Go to **Manage Jenkins** → **Manage Plugins**
2. Click **Available** tab
3. Search and install these plugins:
   - [ ] Git plugin
   - [ ] Pipeline plugin
   - [ ] Maven Integration plugin
   - [ ] NodeJS plugin
   - [ ] Workspace Cleanup plugin
4. Restart Jenkins if required

### 3.3 Configure Global Tools
1. Go to **Manage Jenkins** → **Global Tool Configuration**

#### Maven Configuration:
- [ ] Name: `Maven`
- [ ] ✅ Install automatically
- [ ] Version: Latest (3.9.x)

#### NodeJS Configuration:
- [ ] Name: `NodeJS`  
- [ ] ✅ Install automatically
- [ ] Version: 18.x or latest LTS

#### Git Configuration:
- [ ] Should be auto-detected
- [ ] If not, set path to git.exe

### 3.4 Create Jenkins Job
1. Click **New Item**
2. Enter name: `health-records-deploy`
3. Select **Pipeline**
4. Click **OK**

#### Pipeline Configuration:
1. **General Tab:**
   - [ ] Description: "Health Records System Deployment"
   - [ ] ✅ GitHub project: `https://github.com/YOUR_USERNAME/health-records-system`

2. **Build Triggers:**
   - [ ] ✅ GitHub hook trigger for GITScm polling (optional)
   - [ ] ✅ Poll SCM: `H/5 * * * *` (checks every 5 minutes)

3. **Pipeline Tab:**
   - [ ] Definition: `Pipeline script from SCM`
   - [ ] SCM: `Git`
   - [ ] Repository URL: `https://github.com/YOUR_USERNAME/health-records-system.git`
   - [ ] Credentials: Add if private repo
   - [ ] Branch: `*/main`
   - [ ] Script Path: `Jenkinsfile.simple`

4. Click **Save**

## Step 4: Setup Local Environment

### 4.1 Create Deployment Directory
```cmd
mkdir C:\health-records-deploy
mkdir C:\health-records-deploy\logs
```

### 4.2 Setup Database
1. Start MySQL service
2. Create database:
```sql
CREATE DATABASE healthrecords;
```

### 4.3 Verify Paths
Check these paths exist on your system:
- [ ] Java: `C:\Program Files\Java\jdk-17` (or your Java path)
- [ ] Maven: Should be auto-installed by Jenkins
- [ ] Node.js: Should be auto-installed by Jenkins

## Step 5: Test Deployment

### 5.1 Manual Build Test
Before Jenkins, test locally:
```cmd
# Build backend
mvn clean package -DskipTests

# Build frontend
cd frontend
npm install
npm run build
cd ..
```

### 5.2 Run Jenkins Pipeline
1. Go to your Jenkins job: `health-records-deploy`
2. Click **Build Now**
3. Click on build number (e.g., #1) to see progress
4. Click **Console Output** to see detailed logs

### 5.3 Monitor Build Process
Watch for these stages:
- [ ] 🔄 Checkout
- [ ] 🔨 Build Backend  
- [ ] 🎨 Build Frontend
- [ ] 🛑 Stop Previous Instance
- [ ] 📦 Deploy Application
- [ ] 🚀 Start Application
- [ ] ✅ Health Check

## Step 6: Verify Deployment

### 6.1 Check Application Status
1. **Application URL:** http://localhost:8080
2. **Health Check:** http://localhost:8080/actuator/health
3. **API Docs:** http://localhost:8080/swagger-ui.html (if enabled)

### 6.2 Check Deployment Files
Verify these files exist:
- [ ] `C:\health-records-deploy\health-records-system.jar`
- [ ] `C:\health-records-deploy\static\` (frontend files)
- [ ] `C:\health-records-deploy\logs\` (log directory)

### 6.3 Check Process
Open Task Manager and look for:
- [ ] Java process running health-records application

## Step 7: Ongoing Usage

### 7.1 Making Updates
1. Make changes to your code
2. Commit and push to GitHub:
```bash
git add .
git commit -m "Your update message"
git push origin main
```
3. Go to Jenkins and click **Build Now** (or wait for automatic trigger)

### 7.2 Monitoring
- **Jenkins Build History:** Check build status and logs
- **Application Logs:** Check `C:\health-records-deploy\logs\health-records.log`
- **Application Health:** Monitor http://localhost:8080/actuator/health

## Troubleshooting

### Common Issues:
1. **Port 8080 already in use:**
   - Stop Tomcat if running on 8080
   - Or change APP_PORT in Jenkinsfile.simple

2. **Database connection failed:**
   - Verify MySQL is running
   - Check credentials in application-production.properties

3. **Build fails:**
   - Check Console Output in Jenkins
   - Verify Maven and Node.js are configured

4. **Application won't start:**
   - Check deployment directory permissions
   - Verify Java path in Jenkinsfile.simple

### Getting Help:
- Check Jenkins Console Output for detailed error messages
- Check application logs in deployment directory
- Verify all paths and credentials are correct

---

## ✅ Success Criteria
- [ ] Jenkins build completes successfully
- [ ] Application accessible at http://localhost:8080
- [ ] Frontend loads properly
- [ ] Backend APIs respond
- [ ] Database connections work
- [ ] Health check passes

**Once all steps are complete, you'll have a fully automated CI/CD pipeline! 🎉**