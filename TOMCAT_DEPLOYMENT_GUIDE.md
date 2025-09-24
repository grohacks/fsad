# 🚀 Tomcat Deployment Guide for Health Records System

## 📋 Prerequisites Checklist

Before proceeding, ensure you have:

### ✅ **1. Apache Tomcat 10.0**
- Download from: https://tomcat.apache.org/download-10.cgi
- Install to: `C:\Program Files\Apache Software Foundation\Tomcat 10.0`
- Configure as Windows Service named `Tomcat10`

### ✅ **2. Java 21**
- Already installed at: `C:\Program Files\Java\jdk-21`

### ✅ **3. MySQL Database**
- Database name: `health_records_db`
- Username: `root`
- Password: `root`

### ✅ **4. Jenkins**
- Running on: http://localhost:9090

---

## 🔧 **Step 1: Configure Tomcat for Deployment**

### **1.1 Enable Tomcat Manager**

1. **Edit `tomcat-users.xml`:**
   - Location: `C:\Program Files\Apache Software Foundation\Tomcat 10.0\conf\tomcat-users.xml`
   - Add these lines before `</tomcat-users>`:

```xml
<role rolename="manager-gui"/>
<role rolename="manager-script"/>
<role rolename="admin-gui"/>
<user username="admin" password="admin123" roles="manager-gui,manager-script,admin-gui"/>
```

### **1.2 Configure Manager App Access**

1. **Edit `context.xml` for Manager:**
   - Location: `C:\Program Files\Apache Software Foundation\Tomcat 10.0\webapps\manager\META-INF\context.xml`
   - Comment out the Valve restriction:

```xml
<!--
<Valve className="org.apache.catalina.valves.RemoteAddrValve"
       allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1" />
-->
```

### **1.3 Start Tomcat Service**

```cmd
net start Tomcat10
```

### **1.4 Verify Tomcat Installation**

1. Open browser to: http://localhost:8080
2. Click "Manager App"
3. Login with username: `admin`, password: `admin123`
4. You should see the Tomcat Web Application Manager

---

## 🏗️ **Step 2: Configure Jenkins for Tomcat Deployment**

### **2.1 Create New Jenkins Pipeline**

1. Go to Jenkins: http://localhost:9090
2. Click "New Item"
3. Enter name: `health-records-tomcat`
4. Select "Pipeline"
5. Click "OK"

### **2.2 Configure Pipeline**

In the Pipeline section:
- **Definition:** Pipeline script from SCM
- **SCM:** Git
- **Repository URL:** Your GitHub repository URL
- **Script Path:** `Jenkinsfile.tomcat`

### **2.3 Save Configuration**

Click "Save" to create the pipeline.

---

## 🚀 **Step 3: Deploy Application**

### **3.1 Test WAR Build Locally**

```cmd
cd "e:\KLU BTECH CSE\2ND YEAR\2nd sem\FSD\hackathon\healthrecordsfsd - Copy"
mvn clean package -DskipTests
```

**Expected Output:**
- WAR file created at: `target\health-records.war`

### **3.2 Manual Tomcat Deployment (Optional)**

If you want to test manually first:

1. **Copy WAR file:**
   ```cmd
   copy "target\health-records.war" "C:\Program Files\Apache Software Foundation\Tomcat 10.0\webapps\"
   ```

2. **Restart Tomcat:**
   ```cmd
   net stop Tomcat10
   net start Tomcat10
   ```

3. **Check deployment:**
   - Wait 30 seconds for deployment
   - Go to: http://localhost:8080/manager
   - Your app should appear as `health-records`

### **3.3 Jenkins Automatic Deployment**

1. Go to Jenkins: http://localhost:9090
2. Click on `health-records-tomcat` project
3. Click "Build Now"
4. Monitor the build progress in "Console Output"

---

## 🎯 **Step 4: Access Your Application**

### **4.1 Tomcat Manager**
- URL: http://localhost:8080/manager
- Login: admin / admin123
- Your app should be listed as: `/health-records`

### **4.2 Your Application**
- URL: http://localhost:8080/health-records
- This is your Health Records System!

### **4.3 Application Features**
- Login/Register functionality
- Patient management
- Appointment scheduling
- Health records management

---

## 🔍 **Troubleshooting**

### **Problem: Tomcat Manager not accessible**
**Solution:**
1. Check if Tomcat service is running: `net start Tomcat10`
2. Verify `tomcat-users.xml` configuration
3. Check port 8080 is not blocked

### **Problem: WAR file not deploying**
**Solution:**
1. Check WAR file exists in webapps folder
2. Check Tomcat logs: `C:\Program Files\Apache Software Foundation\Tomcat 10.0\logs\catalina.out`
3. Verify database connection

### **Problem: Application not starting**
**Solution:**
1. Check database is running and accessible
2. Verify `application-production.properties` settings
3. Check application logs in Tomcat logs folder

### **Problem: Jenkins build fails**
**Solution:**
1. Verify all paths in `Jenkinsfile.tomcat` match your system
2. Check Maven and Java installations
3. Ensure Tomcat service can be stopped/started by Jenkins

---

## 📝 **Important Notes**

1. **Context Path**: Your application will be accessible at `/health-records`, not root
2. **Database**: Ensure MySQL is running and database exists before deployment
3. **Logs**: Check both Jenkins console and Tomcat logs for issues
4. **Permissions**: Jenkins needs permission to stop/start Tomcat service

---

## 🎉 **Success Criteria**

You've successfully deployed when:
- ✅ Tomcat Manager shows your application as "Running"
- ✅ http://localhost:8080/health-records loads your application
- ✅ You can login and use the application features
- ✅ Jenkins pipeline completes successfully

Ready to proceed? Let's start with Step 1! 🚀