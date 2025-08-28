# Shadow Bind - Messaging App

A modern, secure messaging application built with **Next.js**, **Firebase**, and **PWA** support. This project provides a foundational structure for building real-time messaging applications with authentication, offline capabilities, and cross-platform compatibility.

## ✨ Features

- 🔐 **Firebase Authentication** - Email/password and Google OAuth support
- 💬 **Real-time Messaging** - Powered by Firestore (API routes provided as stubs)
- 📱 **Progressive Web App (PWA)** - Install on mobile and desktop devices
- 🎨 **Modern UI/UX** - Responsive design with Tailwind-inspired styling
- ⚡ **Next.js Framework** - Server-side rendering and optimal performance
- 🔒 **Secure by Default** - Environment-based configuration

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18
- **Backend**: Next.js API Routes, Firebase
- **Database**: Firestore (Firebase)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **PWA**: next-pwa
- **Styling**: CSS3 with custom properties

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Firebase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RayBen445/Shadow-Bind-.git
   cd Shadow-Bind-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

   > **How to get Firebase config:**
   > 1. Go to [Firebase Console](https://console.firebase.google.com/)
   > 2. Create a new project or select existing one
   > 3. Go to Project Settings (⚙️) → General tab
   > 4. Scroll down to "Your apps" and click "Add app" → Web
   > 5. Register your app and copy the configuration values
   > 6. **Important**: Enable Google sign-in in Firebase Console:
   >    - Go to Authentication → Sign-in method
   >    - Enable "Email/Password" and "Google" providers
   >    - For Google provider, add your domain to authorized domains

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

### Deployment Configuration

#### For Render.com (or similar platforms):

1. **Set Environment Variables:**
   In your deployment platform, add these environment variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

2. **Update Firebase Console:**
   - Add your deployment domain (e.g., `shadow-bind.onrender.com`) to Firebase Console:
   - Go to Authentication → Settings → Authorized domains
   - Add your production domain

3. **Build Configuration:**
   ```bash
   npm run build && npm start
   ```

> **Note:** The app will show a configuration error if Firebase environment variables are not set, but it won't crash. This allows for graceful handling of missing configuration.
   > 3. Go to Project Settings → General
   > 4. Scroll down to "Your apps" → Web apps
   > 5. Add a new web app or select existing one
   > 6. Copy the config values to your `.env.local`

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Firebase Setup

1. **Enable Authentication**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Email/Password and Google providers
   - **Important for Google Sign-in:**
     - Add your domain(s) to authorized domains (localhost:3000 for development, your-domain.com for production)
     - Configure OAuth consent screen if using custom domain

2. **Create Firestore Database**
   - Go to Firebase Console → Firestore Database
   - Create database in production mode
   - Set up security rules as needed

3. **Configure Storage (Optional)**
   - Go to Firebase Console → Storage
   - Set up storage bucket for file uploads

> **Error Handling:** The app includes graceful error handling for missing Firebase configuration. If environment variables are not set, authentication will show an appropriate error message instead of crashing the application.

### PWA Configuration

The app is configured as a PWA with the following features:
- Offline support
- Install prompts
- Service worker caching
- App manifest for native app-like experience

To customize PWA settings, edit:
- `public/manifest.json` - App manifest
- `next.config.js` - PWA configuration

## 📱 Usage

### Authentication
- Users can sign up with email/password
- Google OAuth sign-in available
- Authentication state persisted across sessions

### Messaging (Development Ready)
- API routes are set up at `/api/messages`
- Component structure ready for real-time messaging
- Firebase integration prepared

### PWA Features
- Install the app on mobile/desktop
- Offline functionality
- Native app-like experience

## 🚀 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all your Firebase configuration variables

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify
- Google Cloud Run

### Build for Production

```bash
npm run build
npm run start
```

## 🗂️ Project Structure

```
/
├── components/
│   └── AuthStatus.js          # Authentication component
├── lib/
│   └── firebase.js            # Firebase configuration
├── pages/
│   ├── api/
│   │   └── messages.js        # API routes for messages
│   ├── _app.js                # Next.js app wrapper
│   └── index.js               # Homepage
├── public/
│   └── manifest.json          # PWA manifest
├── styles/
│   └── globals.css            # Global styles
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## 🔑 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Firebase documentation](https://firebase.google.com/docs)
2. Verify your environment variables
3. Ensure Firebase services are enabled
4. Check the console for error messages

## 🔮 Next Steps

To extend this application:

- [ ] Implement real-time messaging with Firestore
- [ ] Add file upload functionality
- [ ] Create user profiles and settings
- [ ] Add push notifications
- [ ] Implement message encryption
- [ ] Add group chat functionality
- [ ] Create admin dashboard
- [ ] Add message search and filtering

---

**Built with ❤️ by the Shadow Bind team**