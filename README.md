# 🤖 Baileys WhatsApp Bot

A powerful, customizable WhatsApp bot built using [Baileys](https://github.com/WhiskeySockets/Baileys).  
Supports modular commands, admin systems, and CID retrieval automation.

## ✨ Features

- 📤 Command-based interaction
- 🛠️ Admin & Master Admin roles
- 💰 Balance system for `.getcid`
- 📷 OCR with `.ocr` for Installation ID
- 🔑 PIDKey API integration for `.getcid`
- 👥 Group-only commands and user listing
- 💾 JSON-based storage (admins, balances, cooldowns)
- 🔄 PM2 support for persistent running and restart

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/base-sn3vil/baileys-bot.git
cd baileys-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure

- Set your PIDKey API key in `getcid.js`
- Set your Master Admin number in `config.json`
- Adjust any cooldowns or features as needed

### 4. Run the bot

```bash
node index.js
```

Or use [PM2](https://pm2.keymetrics.io/) for background running:

```bash
pm2 start index.js --name baileys-bot
```

## 🛠 Commands

| Command         | Description                                     | Access Level      |
|-----------------|-------------------------------------------------|-------------------|
| `.ocr`          | Extract Installation ID from image              | Everyone          |
| `.getcid`       | Get Confirmation ID from Installation ID        | Admins / Master   |
| `.balance`      | Check your balance                              | Admins / Master   |
| `.addbalance`   | Add balance to an admin                         | Master Only       |
| `.setbalance`   | Set balance for an admin                        | Master Only       |
| `.addadmin`     | Promote a user to admin                         | Master Only       |
| `.removeadmin`  | Remove admin privileges                         | Master Only       |
| `.restart`      | Restart the bot via PM2                         | Master Only       |
| `.listusers`    | Show members of the group with roles/balance    | Master Only       |
| `.help`         | Show all available commands                     | Everyone          |

## 📦 JSON Files

- `admins.json` — Stores admin numbers
- `balances.json` — Tracks balances for each admin
- `cooldowns.json` — Cooldown system
- `config.json` — Master Admin and bot config

## 📷 OCR Setup

Uses `tesseract.js` and `jimp` to extract Installation IDs from images. The bot detects IDs in standard Office phone activation screenshots.

## 🔐 Security Notes

- Only the Master Admin can promote/demote admins or adjust balances.
- `.getcid` is restricted and requires a valid balance.

## 🙌 Credits

Built with:
- [Baileys](https://github.com/WhiskeySockets/Baileys)
- [PIDKey API](https://pidkey.com/)
- [Tesseract.js](https://github.com/naptha/tesseract.js)

---

## 💬 License

MIT — feel free to use, fork, or improve!
