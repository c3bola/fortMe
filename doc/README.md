
# 🎮 FortMeBot - Telegram Bot for Fortnite Communities

Interactive bot for Fortnite communities on Telegram, focused on engagement, competition, and group gamification.

---

## 🎯 About the Project

FortMeBot was created to increase engagement in Fortnite Telegram groups.

Instead of repetitive conversations, the bot transforms the group into an interactive experience with:
- daily challenges
- rankings
- voting system
- user duels

The idea is simple: **turn the group into a social mini-game inside Telegram**.

---

## ⚡ Key Features

### 👥 For Users

- `/fortme` → Submit a selfie and get rated by the community
- `/fortgirl` → Daily skin voting system
- `/jonesyme` → Alternative voting system
- `/tryhardme` → Performance evaluation in matches
- `/x1` → User duels system
- `/x1stats` → Detailed duel statistics
- `/ranking` → General and category rankings
- `/help` → Commands list and help

### 👑 For Administrators

- Group management
- Permission control
- Broadcast to multiple groups
- Cron jobs configuration
- Content management (skins/images)
- Database cleanup

---

## 🧠 Architecture & Technical Decisions

### 🔹 Modular Architecture

The project is structured with clear separation of responsibilities:
- commands organized by type (user/admin)
- reusable utilities
- well-defined layers

### 🔹 Data Persistence

The project evolved from a JSON-based approach to a relational database.

#### Before:
- Local JSON
- simple and fast for prototyping

#### Current:
- MySQL with connection pool
- better scalability
- support for complex queries
- improved data integrity

### 🔹 Automation (Cron Jobs)

Automated execution of tasks such as:
- daily ranking processing
- vote aggregation
- scheduled events

### 🔹 Permission System

- separation between users and administrators
- role-based access control

---

## 🗄️ Database

Main entities:

- users
- communities (groups)
- votes
- content (skins/images)
- statistics
- duels (X1)

Using MySQL provides:
- data consistency
- better performance at scale
- relational organization

---

## 📁 Project Structure

```
fortMe/
├── commands/
│   ├── user/
│   └── admin/
├── config/
├── database/
├── utils/
├── fortMe.js
└── package.json
```

---

## 🚀 Installation

### Requirements

- Node.js 14+
- MySQL 5.7+
- Telegram Bot Token

### Steps

```bash
# Clone the repository
git clone https://github.com/seu-repo/fortMe.git
cd fortMe

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start the bot
node fortMe.js
```

---

## 🔧 Configuration

Edit the `.env` file:

```env
TELEGRAM_API_KEY=your_token
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_DATABASE=fnbr_community
```

---

## 🛠️ Development

### Adding a New Command

1. Create a file in `commands/user/` or `commands/admin/`
2. Register it in the corresponding handler
3. Use database utilities

---

## 🤝 Contributing

1. Fork the project
2. Create a branch (`feature/new-feature`)
3. Commit your changes
4. Open a Pull Request

---

## 📜 License

MIT License

---

## 👨‍💻 Author

**C3bola**

---

## 💡 Notes

This project demonstrates:
- architectural evolution (JSON → MySQL)
- modular design
- practical use of Node.js bots
- integration with Telegram API
