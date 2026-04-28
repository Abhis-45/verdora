# Full-Stack Next.js Application

This project consists of a Next.js frontend with React and a Node.js backend using MongoDB Atlas.

## Project Structure

- `frontend/` - Next.js application with React, TypeScript, Tailwind CSS
- `backend/` - Node.js Express server with MongoDB connection

## Setup Instructions

### Prerequisites

- Node.js (version 20.9 or higher)
- MongoDB Atlas account

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up MongoDB Atlas:
   - Create a MongoDB Atlas account at [mongodb.com](https://www.mongodb.com/atlas)
   - Create a new cluster
   - Get your connection string

4. Update the `.env` file in `backend/`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email_user
   EMAIL_PASS=your_email_app_password
   TWO_FACTOR_API_KEY=your_2factor_api_key
   TWO_FACTOR_SENDER_ID=your_approved_sender_id
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (already done):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

## API Endpoints

- `GET /` - Basic hello message from backend

## Connecting Frontend to Backend

In your Next.js components, you can fetch data from the backend:

```javascript
const response = await fetch('http://localhost:5000/api/endpoint');
const data = await response.json();
```

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, Mongoose
- **Database**: MongoDB Atlas
- **Authentication**: JWT + OTP (Email & SMS)
- **Services**: Nodemailer, 2Factor.in

---

## Recent Updates - Profile Page Enhancement ✅

### Features Implemented
1. **OTP-Based Password Update** - No current password required
2. **Auth Popup on Access** - Show login if not authenticated
3. **Default Address Auto-Selection** - Radio buttons with auto-select
4. **Unified Modal Styling** - Green-900 theme for all modals
5. **Logout with Redirect** - Clear token and go to home
6. **Responsive Design** - Mobile, tablet, and desktop layouts

### Key Files
- `frontend/src/pages/profile.tsx` - Profile page with all features
- `backend/src/routes/profile.js` - Updated password endpoint for OTP
- See `PROFILE_PAGE_UPDATES.md` for detailed documentation
- See `PROFILE_FEATURES.md` for visual guides
- See `PROFILE_TEST_CASES.md` for comprehensive testing

### Security Features
- OTP sent via email or SMS (2Factor.in for SMS)
- 10-minute OTP expiration
- bcryptjs password hashing
- JWT token validation
- Field matching for OTP operations

### What's New
- **Password Update**: Request OTP → Verify → Update (no current password needed)
- **Email/Mobile Update**: Same OTP-based flow with 2Factor SMS support
- **Address Selection**: Radio buttons with default auto-selection
- **Auth Flow**: Show login popup when accessing profile without token
- **Modal Theme**: All modals use green-900 theme with white text
- **Responsive**: Works seamlessly on mobile, tablet, and desktop
