# PLANIT - Productivity & Task Management App

## 📋 Overview

PLANIT is a full-stack web application designed to help users manage tasks, categorize work, and stay motivated through gamification features. The app provides an intuitive interface for task management with rewards and progress tracking.

## 🚀 Features

### ✨ Core Functionality
- **User Authentication** - Secure login and registration
- **Task Management** - Create, update, and organize tasks
- **Categories** - Group tasks by projects or contexts
- **Dashboard** - Overview of productivity and progress

### 🎮 Gamification
- **Points System** - Earn rewards for completing tasks
- **Achievements** - Unlock badges and milestones
- **Progress Tracking** - Visualize your productivity journey

## 🏗️ Project Structure

```
PLANIT/
├── 📁 backend/
│   ├── 📁 config/
│   │   └── 🗃️ database.js
│   ├── 📁 middleware/
│   │   └── 🔐 auth.js
│   ├── 📁 routes/
│   │   ├── 🔐 auth.js
│   │   ├── 📂 categories.js
│   │   ├── 🎮 gamification.js
│   │   └── ✅ tasks.js
│   ├── 🗃️ database/
│   │   └── 📄 schema.sql
│   ├── ⚙️ .env
│   ├── 📦 package.json
│   └── 🚀 server.js
├── 📁 frontend/
│   ├── 📁 css/
│   │   └── 🎨 style.css
│   ├── 📁 js/
│   │   ├── 🔐 auth.js
│   │   ├── 📊 dashboard.js
│   │   └── 🎮 gamification.js
│   ├── 📁 pages/
│   │   ├── 🏠 index.html
│   │   └── 📊 dashboard.html
└── 📄 README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **MySQL** or compatible database
- **Modern web browser**

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/planit.git
   cd planit
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create database from schema
   mysql -u root -p < database/schema.sql
   ```

4. **Environment Configuration**
   Create `.env` file in backend directory:
   ```env
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=planit_db
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

5. **Start the Application**
   ```bash
   # From backend directory
   npm start
   ```

6. **Access the Application**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 🎯 Usage Guide

### Getting Started
1. **Register** a new account or **Login** with existing credentials
2. **Create Categories** to organize your tasks (Work, Personal, Projects, etc.)
3. **Add Tasks** with due dates and priorities
4. **Complete Tasks** to earn points and unlock achievements
5. **Track Progress** on your personalized dashboard

### Dashboard Features
- 📈 **Productivity Metrics** - View your completion rates
- 🏆 **Achievements** - See unlocked and upcoming rewards
- 📊 **Category Breakdown** - Understand where you're spending time
- 🔔 **Upcoming Deadlines** - Never miss important tasks

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/tasks` | Get user tasks |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/categories` | Get categories |
| GET | `/api/gamification/stats` | Get user gamification stats |

## 🎮 Gamification System

### Points Structure
- ✅ **Complete Basic Task**: +10 points
- ⏰ **Complete Task Early**: +15 points
- 🎯 **Complete High Priority**: +20 points
- 🔥 **Daily Streak**: Bonus points

### Achievement Levels
- 🥉 **Bronze**: 100 points
- 🥈 **Silver**: 500 points  
- 🥇 **Gold**: 1000 points
- 💎 **Platinum**: 5000 points

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
- Verify MySQL service is running
- Check `.env` file credentials
- Ensure database exists

**Port Already in Use**
```bash
# Kill process on port 3000
npx kill-port 3000
```

**Module Not Found**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 📞 Support

For support and questions:
- 📧 Email: support@planit.app
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/planit/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/planit/discussions)

---

**Made with ❤️ by the PLANIT Team**
