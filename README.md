### Write-Track – Full Stack Productivity & Blogging Platform (MERN Stack)

### 🌟 Overview
Write-Track is a full-stack productivity and blogging web application built using the **MERN Stack** — MongoDB, Express.js, React.js, and Node.js.  
It helps users **write blogs, manage daily tasks, and track personal growth** — all in one intuitive platform.  

The project includes **secure user authentication, blog management, task tracking**, and a **personal dashboard**.  
It’s designed for simplicity, creativity, and productivity — perfect for writers, students, and professionals.

### 🚀 Live Demo
| Component | Link |
|------------|------|
| 🖥️ Frontend (React App) | [https://write-track.vercel.app/] |
| ⚙️ Backend (API Server) | [https://writetrack-zwxc.onrender.com/api]|

---

### 📌 Features

✅ **User Features**
-  Create, edit, and delete blog posts  
-  View post details with formatted content  
-  Secure login, registration, and password change  
-  Manage daily tasks with status tracking  
-  Personalized dashboard showing tasks and blog stats  
-  Responsive, clean UI with seamless navigation  

✅ **Task Management**
- Add, edit, and delete tasks  
- Set task completion status  
- View progress in an organized dashboard  

✅ **Blog Management**
- Create and edit posts with rich text support  
- View post details and list of all posts  
- Upload images to enhance blog content  

✅ **Authentication**
- JWT-based authentication system  
- Secure password hashing using bcrypt  
- Protected routes and middleware validation  

✅ **Backend Features**
- RESTful API architecture  
- Modular route structure (Auth, Posts, Tasks, Dashboard, Users)  
- Error handling and input validation  
- Image upload support (Multer)  

---

### 🛠️ Tech Stack

🖥️ **Frontend**
- React.js (Vite)
- Axios (for API communication)
- CSS Modules / Custom Styles (for styling)
- Lucide React Icons (for elegant icons)

⚙️ **Backend**
- Node.js & Express.js  
- MongoDB with Mongoose  
- JSON Web Tokens (JWT) for authentication  
- bcrypt.js for password hashing  
- Custom middleware for error handling and auth  

---

### Create a .env file inside the backend folder:

-PORT=5000
-MONGO_URI=your_mongodb_connection_string
-JWT_SECRET=your_secret_key

### Create a .env file inside the client folder:

-VITE_API_URL=http://localhost:5000/api

---


### Installation & Setup (Local Development)

### Clone the Repository
```bash
git clone https://github.com/your-username/Write-Track.git
cd Write-Track



### 2. Install Dependencies

### Backend
cd backend
npm install

### Frontend
cd client
npm install


### 3. Run the Application

# Backend
cd backend
npm run dev


# Frontend
cd client
npm run dev

