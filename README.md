# 🩸 BloodLink — Smart Blood Donor Connectivity Platform

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**BloodLink** is a mission-critical MERN stack application designed to bridge the gap between blood donors and those in urgent need. By leveraging real-time tracking, automated notifications, and a robust verification system, BloodLink ensures that help is always just a few clicks away.

---

## ✨ Key Features

### 🔍 For Requesters
- **Real-Time Donor Tracking**: Visualize active donors on an interactive Mapbox-powered map.
- **Smart Matching**: Connect with the nearest compatible donors based on location and blood group.
- **Urgent Broadcasts**: Send emergency alerts to all eligible donors in the vicinity.

### 🛡️ For Donors
- **Availability Toggle**: Easily switch your status to available or unavailable.
- **Trust Badges**: Earn badges for successful donations and verified certificates.
- **Impact Dashboard**: Track your donation history and the lives you've helped save.

### 🏥 For Hospitals & Admins
- **Inventory Management**: Track blood stock levels and manage bulk requests.
- **Donor Verification**: Securely verify medical certificates and donation eligibility.
- **Advanced Analytics**: Generate PDF and Excel reports on donation trends and regional needs.

---

## 🚀 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS 4.0, Redux Toolkit, Framer Motion, Recharts, Mapbox GL JS |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose), Redis, BullMQ (Background Jobs) |
| **Real-Time** | Socket.io (Live tracking & In-app alerts) |
| **Integrations** | Twilio (SMS/WhatsApp), Nodemailer (SMTP), Cloudinary (Image Storage) |

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** 18+ 
- **MongoDB** (Local or Atlas)
- **Redis** (Required for background jobs & rate limiting)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/aadhithianm/blood-donor.git
   cd blood-connect
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example server/.env
   # Update server/.env with your actual credentials
   ```

3. **Start Redis Server**
   If you are on Windows, you can use the included binaries:
   ```powershell
   Start-Process -FilePath ".\redis-bin\redis-server.exe" -WindowStyle Hidden
   ```

4. **Install Dependencies & Start Development Servers**

   **Server:**
   ```bash
   cd server
   npm install
   npm run dev
   ```

   **Client:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

---

## 📂 Project Structure

```text
blood-connect/
├── client/              # React + Vite Frontend
│   └── src/
│       ├── app/        # Redux Store & RTK Query
│       ├── modules/    # Feature-based components (auth, donor, etc.)
│       └── pages/      # Main application routes
├── server/              # Express.js API Backend
│   ├── config/         # Database, Redis, & Service configs
│   ├── modules/        # Modular API logic (auth, user, donor, etc.)
│   ├── jobs/           # BullMQ background workers
│   └── sockets/        # Real-time event handlers
└── redis-bin/           # Portable Redis binaries for Windows
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Developed with ❤️ for the community.**
