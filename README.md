# Confirmation App 🎉

A full-stack RSVP application with Brazilian Portuguese interface, built with React + Vite (frontend) and Node.js + Express (backend).

## ✨ Features

- **Host Dashboard**: Create, edit, and manage events with images
- **Guest RSVP**: Simple invitation page with plus-ones support
- **Brazilian Portuguese**: Complete localization including date/time formatting
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Image Support**: Upload and display event images with automatic compression
- **Export Functionality**: Download guest lists as CSV
- **QR Code Generation**: Generate QR codes for easy event sharing

## 🚀 Live Demo

- **Frontend**: [Deployed on Netlify](https://your-app.netlify.app)
- **Backend API**: [Ready for deployment](https://your-backend-platform.com)

## 🛠️ Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- shadcn/ui for components
- React Query for data fetching
- React Hook Form + Zod for validation
- date-fns with Brazilian Portuguese locale

**Backend:**
- Node.js + Express
- TypeScript
- MongoDB database with Mongoose ODM
- JWT authentication
- bcrypt for password hashing
- Express rate limiting and security

## 📦 Project Structure

```
confirmationapp/
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express backend
├── MONGODB_SETUP.md   # MongoDB setup guide
├── netlify.toml       # Netlify deployment config
└── README.md
```

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- Yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/biancamontesanti/confirmationapp.git
cd confirmationapp
```

2. Install dependencies:
```bash
yarn install:all
```

3. Set up environment variables:
```bash
# Backend
cp backend/env.example backend/.env
# Edit backend/.env with your values
```

4. Start development servers:
```bash
./start-dev.sh
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🚀 Deployment

### Backend (Railway)

1. Push to GitHub
2. Connect Railway to your GitHub repo
3. Set environment variables in Railway dashboard:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secure-jwt-secret`
   - `PORT=3001`

### Frontend (Netlify)

1. Push to GitHub
2. Connect Netlify to your GitHub repo
3. Set build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
4. Add environment variable:
   - `VITE_API_URL=https://your-railway-backend.railway.app`

## 📱 Usage

1. **Host Registration**: Sign up as an event host
2. **Create Events**: Add event details with optional images
3. **Manage Guests**: Add guests manually or let them self-register via link
4. **Share Links**: Send invitation links or QR codes to guests
5. **Track RSVPs**: Monitor responses and export guest lists

## 🌍 Localization

The app is fully localized in Brazilian Portuguese:
- Date formatting with proper Brazilian format
- Time display in 24-hour format with "Horário de Brasília"
- All UI text translated to Portuguese
- Proper currency and number formatting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Bianca Montesanti**
- GitHub: [@biancamontesanti](https://github.com/biancamontesanti)

---

Made with ❤️ in Brazil 🇧🇷