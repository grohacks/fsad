# 🚀 Complete Jenkins-to-Tomcat Deployment Guide

## 📋 **Overview**
This guide will help you set up Jenkins to automatically deploy your Health Records application to Tomcat 11, so it appears in the Tomcat Manager App at http://localhost:8080/manager.

---

## 🎯 **What We'll Achieve**

After following this guide:
- ✅ Jenkins will automatically deploy your app to Tomcat
- ✅ Your app will appear in Tomcat Manager at http://localhost:8080/manager  
- ✅ You can access your app at http://localhost:8080/health-records
- ✅ Every code change triggers automatic deployment via Jenkins

---

## 📋 **Prerequisites Check**

Let's verify what you have:
- ✅ **Tomcat 11.0** - Detected and installed
- ✅ **Java 21** - Available at C:\Program Files\Java\jdk-21
- ✅ **Jenkins** - Running on localhost:9090
- ✅ **MySQL Database** - health_records_db
- ✅ **GitHub Repository** - https://github.com/grohacks/fsad.git

---

## 🔧 **Step 1: Configure Tomcat for Manager Access**

### **1.1 Configure Tomcat Users**

You need to edit the Tomcat configuration to allow Jenkins to deploy applications.

**File to edit:** `C:\Program Files\Apache Software Foundation\Tomcat 11.0\conf\tomcat-users.xml`

1. **Open the file as Administrator** (Right-click Notepad → Run as Administrator)
2. **Add these lines before the closing `</tomcat-users>` tag:**

```xml
<!-- Add these users for Tomcat Manager access -->
<role rolename="manager-gui"/>
<role rolename="manager-script"/>
<role rolename="admin-gui"/>
<user username="admin" password="admin123" roles="manager-gui,manager-script,admin-gui"/>
```

3. **Save the file**

### **1.2 Allow Remote Access to Manager**

**File to edit:** `C:\Program Files\Apache Software Foundation\Tomcat 11.0\webapps\manager\META-INF\context.xml`

1. **Open the file as Administrator**
2. **Find the `<Valve>` section and comment it out:**

```xml
<!-- Comment out this section to allow access from any IP -->
<!--
<Valve className="org.apache.catalina.valves.RemoteAddrValve"
       allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1" />
-->
```

3. **Save the file**

### **1.3 Start Tomcat Service**

```cmd
net start Tomcat11
```

### **1.4 Verify Tomcat Manager Access**

1. **Open browser:** http://localhost:8080
2. **Click "Manager App"**
3. **Login with:**
   - Username: `admin`
   - Password: `admin123`
4. **You should see the Tomcat Web Application Manager**

---

## 🏗️ **Step 2: Create Jenkins Pipeline for Tomcat Deployment**

### **2.1 Create New Jenkins Job**

1. **Go to Jenkins:** http://localhost:9090
2. **Click "New Item"**
3. **Job Details:**
   - **Name:** `health-records-tomcat-deploy`
   - **Type:** Pipeline
   - **Click "OK"**

### **2.2 Configure the Pipeline**

**In the Pipeline Configuration:**

1. **Definition:** Pipeline script from SCM
2. **SCM:** Git
3. **Repository URL:** `https://github.com/grohacks/fsad.git`
4. **Credentials:** (if required for private repo)
5. **Branch:** `*/main`
6. **Script Path:** `Jenkinsfile.tomcat`

### **2.3 Save Configuration**

Click **"Save"** to create the pipeline.

---

## 🚀 **Step 3: Test the Complete Deployment**

### **3.1 Trigger the Jenkins Build**

1. **Go to your Jenkins job:** `health-records-tomcat-deploy`
2. **Click "Build Now"**
3. **Click on the build number** (e.g., #1) in Build History
4. **Click "Console Output"** to watch the deployment

### **3.2 Expected Build Process**

You'll see these stages in Jenkins:
```
🔧 Environment Setup - Setting up build environment
📦 Checkout Code - Getting latest code from GitHub  
🏗️ Build Backend WAR - Creating WAR file for Tomcat
🎨 Build Frontend - Building React application
📁 Prepare Deployment Directory - Organizing files
🛑 Stop Tomcat - Stopping Tomcat service
🗑️ Undeploy Previous Version - Removing old deployment
📦 Deploy to Tomcat - Copying WAR to webapps
🚀 Start Tomcat - Starting Tomcat service
✅ Health Check - Verifying deployment
```

### **3.3 Successful Deployment Indicators**

**Console Output should show:**
```
✅ WAR file created successfully
✅ Tomcat service stopped
✅ Old deployment removed
✅ WAR file deployed
✅ Tomcat service started
✅ Application is accessible
🎉 Deployment Successful!
```

---

## 🎯 **Step 4: Access Your Deployed Application**

### **4.1 Check Tomcat Manager**

1. **Open:** http://localhost:8080/manager
2. **Login:** admin / admin123
3. **Look for your application in the list:**
   ```
   Application Path: /health-records
   Status: Running
   Sessions: 0
   ```

### **4.2 Access Your Application**

1. **Open:** http://localhost:8080/health-records
2. **You should see:** Your Health Records System login page
3. **Test functionality:** Login, register, create appointments, etc.

---

## 🔄 **Step 5: Automated Deployment Workflow**

From now on, every time you make changes:

1. **Make code changes** in your IDE
2. **Commit and push to GitHub:**
   ```cmd
   git add .
   git commit -m "Ready for Jenkins deployment"
   git push origin main
   ```
3. **Trigger Jenkins build** manually or set up automatic triggers
4. **Jenkins automatically:**
   - Pulls latest code
   - Builds WAR file
   - Deploys to Tomcat
   - Your changes are live!

---

## 🛠️ **Troubleshooting Common Issues**

### **Problem: "Access denied to Manager"**
**Solution:**
- Check `tomcat-users.xml` configuration
- Restart Tomcat service: `net stop Tomcat11 && net start Tomcat11`

### **Problem: "Port 8080 already in use"**
**Solution:**
- Check what's using port 8080: `netstat -ano | findstr :8080`
- Stop conflicting services

### **Problem: "WAR file not deploying"**
**Solution:**
- Check Jenkins has permission to access Tomcat webapps folder
- Verify WAR file is created in `target/health-records.war`

### **Problem: "Database connection error"**
**Solution:**
- Ensure MySQL is running
- Check database credentials in `application-production.properties`

### **Problem: "Jenkins build fails"**
**Solution:**
- Check Java and Maven paths in `Jenkinsfile.tomcat`
- Verify GitHub repository access

---

## 📝 **Quick Reference Commands**

### **Tomcat Service Management:**
```cmd
# Start Tomcat
net start Tomcat11

# Stop Tomcat  
net stop Tomcat11

# Check Tomcat status
sc query Tomcat11
```

### **Manual WAR Deployment (for testing):**
```cmd
# Build WAR file
mvn clean package -DskipTests

# Deploy to Tomcat
copy "target\health-records.war" "C:\Program Files\Apache Software Foundation\Tomcat 11.0\webapps\"
```

### **Check Application Status:**
```cmd
# Check if port 8080 is listening
netstat -an | findstr :8080

# Test Tomcat response
curl http://localhost:8080
```

---

## 🎉 **Success Checklist**

Mark these off as you complete them:

- [ ] Tomcat Manager accessible at http://localhost:8080/manager
- [ ] Jenkins pipeline created and configured  
- [ ] First build completes successfully
- [ ] Application appears in Tomcat Manager as "health-records"
- [ ] Application accessible at http://localhost:8080/health-records
- [ ] Login/registration functionality works
- [ ] Database connectivity confirmed
- [ ] Automatic deployment from GitHub works

---

## 🔗 **Important URLs**

- **Jenkins Dashboard:** http://localhost:9090
- **Tomcat Manager:** http://localhost:8080/manager  
- **Your Application:** http://localhost:8080/health-records
- **Tomcat Home:** http://localhost:8080

---

**Ready to start? Let's begin with Step 1! 🚀**