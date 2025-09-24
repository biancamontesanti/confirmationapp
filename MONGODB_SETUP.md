# MongoDB Setup Guide

## 🚀 **Migration Complete: SQLite → MongoDB**

Your RSVP app has been successfully migrated from SQLite to MongoDB! Here's everything you need to know:

## 📋 **What Changed**

✅ **Deployment ready**: Compatible with any hosting platform  
✅ **Database**: SQLite → MongoDB with Mongoose ODM  
✅ **Dependencies**: `sqlite3` → `mongoose`  
✅ **Models**: Created proper MongoDB schemas for Hosts, Events, and Guests  
✅ **API**: Updated all routes to use MongoDB ObjectIds  
✅ **Frontend**: Updated interfaces to work with MongoDB `_id` fields  

## 🛠 **MongoDB Setup Options**

### **Option 1: Local MongoDB (Development)**
```bash
# Install MongoDB on macOS
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# MongoDB will run on: mongodb://localhost:27017
```

### **Option 2: MongoDB Atlas (Cloud - Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free M0 tier available)
4. Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/rsvp_app`)

### **Option 3: Docker MongoDB**
```bash
# Run MongoDB in Docker
docker run -d --name mongodb -p 27017:27017 mongo:latest
```

## ⚙️ **Environment Setup**

Create your `.env` file in the `backend` folder:

```bash
# Copy the example
cp backend/env.example backend/.env
```

Edit `backend/.env`:
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MONGODB_URI=mongodb://localhost:27017/rsvp_app  # or your Atlas URI
FRONTEND_URL=http://localhost:5173
```

## 🚦 **Testing the Migration**

1. **Start MongoDB** (if using local):
   ```bash
   brew services start mongodb/brew/mongodb-community
   ```

2. **Start your app**:
   ```bash
   # From root directory
   yarn dev
   ```

3. **Test the flow**:
   - Create a host account
   - Create an event
   - Add guests
   - Test the guest RSVP page

## 🔄 **Key Differences from SQLite**

### **Database IDs**
- **Before**: Numeric IDs (`id: 1, 2, 3...`)
- **Now**: MongoDB ObjectIds (`_id: "507f1f77bcf86cd799439011"`)

### **Data Structure**
- **Automatic timestamps**: `created_at` and `updated_at` handled by Mongoose
- **Schema validation**: Built-in data validation and type checking
- **Indexes**: Optimized queries with automatic indexing

### **Scalability**
- **Horizontal scaling**: MongoDB can scale across multiple servers
- **Cloud-ready**: Easy deployment to MongoDB Atlas
- **Performance**: Better performance for large datasets

## 🌟 **Benefits of MongoDB**

- **Scalable**: Handles millions of records effortlessly
- **Cloud-native**: Easy deployment to any cloud provider
- **Flexible schema**: Easy to add new fields without migrations
- **Rich queries**: Powerful aggregation and search capabilities
- **Production-ready**: Used by major companies worldwide

## 🚀 **Deployment**

### **Backend Deployment (Any Platform)**
Set these environment variables:
```env
NODE_ENV=production
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-production-secret
FRONTEND_URL=https://your-frontend-domain.com
```

### **Recommended Platforms**
- **Backend**: Render, Heroku, or Vercel
- **Database**: MongoDB Atlas (free tier available)
- **Frontend**: Netlify, Vercel, or GitHub Pages

## 🔧 **Troubleshooting**

### **Connection Issues**
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/rsvp_app"
```

### **Common Errors**
- **"MongooseServerSelectionError"**: MongoDB not running or wrong URI
- **"Authentication failed"**: Wrong username/password in Atlas URI
- **"Network timeout"**: Check firewall/network settings

## 📊 **Database Management**

### **View your data**
```bash
# Connect to local MongoDB
mongosh rsvp_app

# View collections
show collections

# View hosts
db.hosts.find()

# View events
db.events.find()

# View guests
db.guests.find()
```

### **MongoDB Compass (GUI)**
Download [MongoDB Compass](https://www.mongodb.com/products/compass) for a visual interface to your database.

---

🎉 **Your app is now running on MongoDB!** Enjoy the improved scalability and performance!
