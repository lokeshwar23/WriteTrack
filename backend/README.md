# Complete MERN Stack Blog & Task Management Application

A full-featured web application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) that includes a blog system, task management, and comprehensive user authentication with advanced security features.

## 🚀 Features

### 🔐 Authentication & Security
- **User Registration & Login** with email verification
- **Password Reset** via email with secure tokens
- **OTP (One-Time Password)** verification system
- **JWT Token Authentication** with refresh tokens
- **Account Lockout** protection against brute force attacks
- **Email Verification** for new accounts
- **Session Management** with secure cookies
- **Password Strength Validation**
- **Two-Factor Authentication** support

### 👤 User Management
- **Profile Management** with avatar upload
- **User Preferences** (theme, notifications, timezone)
- **Password Change** functionality
- **Account Deletion** with password confirmation
- **User Roles** (user, admin)
- **Account Verification** status tracking

### 📝 Blog System
- **Create, Read, Update, Delete** blog posts
- **Rich Text Content** support
- **Post Categories & Tags**
- **Like/Unlike** posts
- **View Count** tracking
- **Author Information** display
- **Pagination** for post lists
- **Search & Filter** capabilities

### 📋 Task Management
- **Create & Manage Tasks**
- **Task Assignment** to users
- **Priority Levels** (high, medium, low)
- **Status Tracking** (pending, in-progress, completed)
- **Due Date Management**
- **Task Categories**
- **Progress Tracking**

### 📧 Email System
- **Email Templates** for various notifications
- **Password Reset Emails**
- **Account Verification Emails**
- **OTP Code Delivery**
- **Task Assignment Notifications**
- **Bulk Email Support**

### 🎨 User Interface
- **Responsive Design** for all devices
- **Modern UI/UX** with smooth animations
- **Dark/Light Theme** support
- **Dashboard** with statistics and quick actions
- **User-friendly Forms** with validation
- **Loading States** and error handling

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **nodemailer** - Email sending
- **express-validator** - Input validation
- **multer** - File uploads
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **cors** - Cross-origin resource sharing

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **Context API** - State management
- **Axios** - HTTP client
- **CSS3** - Styling with modern features
- **Responsive Design** - Mobile-first approach

### Development Tools
- **Vite** - Build tool and dev server
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mern-blog-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mern-blog
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   SESSION_SECRET=your-session-secret
   
   # Email Configuration (Gmail example)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Client URL
   CLIENT_URL=http://localhost:5173
   ```

4. **Start the server**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Email Setup
For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in EMAIL_PASS

### Database Setup
The application will automatically create the necessary collections and indexes when it starts.

### File Uploads
Create the following directories:
```bash
mkdir uploads
mkdir uploads/avatars
mkdir uploads/tasks
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/update-preferences` - Update preferences
- `DELETE /api/auth/delete-account` - Delete account

### Posts
- `GET /api/posts` - Get all posts (with pagination)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Toggle like

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/toggle` - Toggle completion
- `POST /api/tasks/:id/assign` - Assign task

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🔒 Security Features

### Password Security
- Bcrypt hashing with salt rounds of 12
- Minimum 6 characters with complexity requirements
- Account lockout after 5 failed attempts
- Secure password reset tokens

### Authentication Security
- JWT tokens with expiration
- Refresh token rotation
- Secure HTTP-only cookies
- CSRF protection
- Rate limiting on auth endpoints

### Data Protection
- Input validation and sanitization
- SQL injection prevention (MongoDB)
- XSS protection
- Helmet security headers
- CORS configuration

## 🎯 Usage Examples

### User Registration Flow
1. User fills registration form
2. System validates input
3. Password is hashed
4. Verification email is sent
5. User clicks verification link
6. Account is activated

### Password Reset Flow
1. User requests password reset
2. System generates secure token
3. Reset email is sent
4. User clicks reset link
5. User enters new password
6. Password is updated

### OTP Verification Flow
1. User requests OTP
2. System generates 6-digit code
3. OTP is sent via email
4. User enters OTP
5. System verifies and clears OTP

## 🚀 Deployment

### Backend Deployment (Heroku)
1. Create Heroku app
2. Set environment variables
3. Deploy with Git
4. Configure MongoDB Atlas

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables
4. Configure custom domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔄 Updates & Maintenance

### Regular Maintenance Tasks
- Update dependencies regularly
- Monitor security advisories
- Backup database regularly
- Monitor application logs
- Update SSL certificates

### Performance Optimization
- Implement caching strategies
- Optimize database queries
- Use CDN for static assets
- Enable compression
- Monitor performance metrics

---

**Built with ❤️ using the MERN stack** 