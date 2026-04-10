# MongoDB Connection Guide for DINE24

## ✅ Current Status
MongoDB database driver is now installed and integrated with your Flask backend.

---

## 🔧 Configuration Steps

### **Step 1: Choose Your MongoDB Option**

#### **Option A: MongoDB Atlas (Cloud - Recommended)**
Best for cloud deployment and production

1. **Create MongoDB Atlas Account**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Sign up for FREE account
   - Create new project

2. **Create a Cluster**
   - Click "Create Cluster"
   - Choose FREE tier (M0)
   - Select your region (closest to you)
   - Wait for cluster to deploy (5-10 minutes)

3. **Create Database User**
   - Go to "Security" → "Database Access"
   - Click "Add New Database User"
   - Username: `dine24_user`
   - Password: (save this securely!)
   - Click "Add User"

4. **Get Connection String**
   - Go to "Clusters" → Click "CONNECT"
   - Choose "Drivers"
   - Copy the connection string:
   ```
   mongodb+srv://dine24_user:PASSWORD@cluster.mongodb.net/dine24?retryWrites=true&w=majority
   ```
   - Replace `PASSWORD` with your actual password

5. **Add IP Whitelist**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (for development)
   - Or add your IP address for security

#### **Option B: Local MongoDB (Development Only)**
Simple local development setup

1. **Install MongoDB**
   - Download: https://www.mongodb.com/try/download/community
   - Or use Windows package manager:
     ```powershell
     winget install MongoDB.Server
     ```

2. **Start MongoDB**
   - Windows Services → find "MongoDB" → Start
   - Or run in terminal:
     ```powershell
     mongod
     ```

3. **Connection String**
   ```
   mongodb://localhost:27017/dine24_restaurant
   ```

---

### **Step 2: Update .env File**

Your `.env` file is already created at:
`flask_backend/.env`

**Update with your MongoDB URI:**

```env
# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://dine24_user:YOUR_PASSWORD@cluster.mongodb.net/dine24?retryWrites=true&w=majority

# Or for Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/dine24_restaurant
```

---

### **Step 3: Verify Connection**

The Flask backend will automatically:
1. ✅ Load the `.env` file
2. ✅ Connect to MongoDB on startup
3. ✅ Display: `[OK] MongoDB connected successfully!`

Check your terminal for confirmation message.

---

## 📊 Database Collections

Your MongoDB will automatically have these collections:

- **reservations** - Customer table reservations
- **menu_items** - Restaurant menu with dishes
- **customers** - Customer profiles
- **orders** - Food orders
- **reviews** - Customer reviews
- **chat_logs** - AI chatbot conversation logs
- **admin_users** - Admin accounts
- **tables** - Restaurant table management
- **specials** - Today's special offers

---

## 🔍 Test Your MongoDB Connection

### **Using Python Shell**
```python
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
uri = os.getenv('MONGODB_URI')

client = MongoClient(uri)
db = client['dine24_restaurant']

# Test the connection
client.admin.command('ping')
print("✅ MongoDB Connected!")

# View databases
print(client.list_database_names())

# Close connection
client.close()
```

### **Using MongoDB Compass (GUI)**
1. Download: https://www.mongodb.com/products/tools/compass
2. Paste your connection string
3. Click "Connect"
4. Browse your databases and collections visually

---

## 🛠️ Common Database Operations

### **Create Sample Data**
```python
db.menu_items.insert_one({
    'name': 'Butter Chicken',
    'category': 'Main Course',
    'price': 450,
    'is_veg': False,
    'rating': 4.5
})

db.reservations.insert_one({
    'full_name': 'John Doe',
    'email': 'john@example.com',
    'phone': '+91 9876543210',
    'num_people': 4,
    'arrival_date': '2024-12-25',
    'arrival_time': '19:00'
})
```

### **Query Data**
```python
# Find all menu items
all_items = db.menu_items.find()

# Find reservations by date
reservations = db.reservations.find({'arrival_date': '2024-12-25'})

# Find vegetarian items
veg_menu = db.menu_items.find({'is_veg': True})
```

---

## 🚀 Next Steps

1. ✅ Add your MongoDB URI to `.env`
2. ✅ Restart Flask backend (Ctrl+C and run again)
3. ✅ Verify you see "MongoDB connected successfully"
4. ✅ Test API endpoints from frontend
5. ✅ Use MongoDB Compass to view your data

---

## ⚠️ Troubleshooting

**Issue: "Connection refused"**
- Local MongoDB: Make sure `mongod` is running
- Atlas: Check IP whitelist and connection string

**Issue: "Authentication failed"**
- Verify username and password in connection string
- Check MongoDB Atlas database user credentials

**Issue: ".env file not loading"**
- Ensure `python-dotenv` is installed: `pip install python-dotenv`
- Verify `.env` is in the `flask_backend` folder

**Issue: "No module named 'pymongo'"**
- Install pymongo: `pip install pymongo`

---

## 📚 Useful Resources

- MongoDB Docs: https://docs.mongodb.com/
- MongoDB Atlas Setup: https://docs.atlas.mongodb.com/
- PyMongo Guide: https://pymongo.readthedocs.io/
- SQL to MongoDB Mapping: https://docs.mongodb.com/manual/reference/sql-comparison/

---

**Created for DINE24 - Restaurant Management System**
