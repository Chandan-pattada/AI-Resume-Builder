# AI Resume Builder

A full-stack AI-powered Resume Builder designed to help users create professional, ATS-friendly resumes with AI-assisted content generation, resume analysis, and secure authentication.

## Features

- User registration and login
- Google authentication
- AI-powered resume content generation
- ATS resume scoring and analysis
- Resume keyword analysis
- AI-generated professional summaries
- AI-assisted bullet point improvement
- Resume sections:
  - Personal Information
  - Professional Summary
  - Experience
  - Education
  - Skills
  - Projects
  - Certifications
- Multiple resume templates
- Resume preview
- PDF resume generation
- Resume version management
- Job description analysis
- Real-time AI resume assistance

## Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Google OAuth

### AI
- Google Gemini API
- LangChain

### Tools
- Git
- GitHub
- Postman
- VS Code

## Project Structure

```text
AI-Resume-Builder/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── server.js
│   └── package.json
│
└── README.md
