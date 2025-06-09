# Real-Time Whiteboard Application

A collaborative real-time whiteboard application built with React, Node.js, and Socket.IO that allows multiple users to draw and interact on a canvas simultaneously. Users can communicate with each other through real-time chat and voice communication features.

## Features mapped with Conversations

- **Conversation 1** - Collaborative Whiteboard Implementation
- **Conversation 2** - User Identification and Participant Listing
- **Conversation 3** - Brush Customization (Color & Width)
- **Conversation 4** - Real-Time Chat using Socket.IO
- **Conversation 5** - Canvas Locking and User ID Management on Server
- **Conversation 6** - Real-Time Voice Chat with WebRTC
- **Conversation 7** - UI Enhancement – Home and Room Pages
- **Conversation 8** - Deployment with Jenkins & Data Persistence with MongoDB

## Project Structure

```
├── client/                 # Frontend React application
│   ├── public/           
│   ├── src/              
│   │   ├── components/   # React components
│   │   ├── services/     
│   │   ├── index.js      # Application entry point
│   │   ├── index.css     
│   │   └── setupTests.js # Test configuration
│   ├── package.json      # Frontend dependencies
│   └── webpack.config.js # Webpack configuration
│
└── server/                # Backend Node.js application
    ├── src/              
    │   ├── controllers/ # Route controllers
    │   ├── models/      # Database models
    │   ├── routes/      # API routes
    │   ├── services/    
    │   ├── utils/       # Utility functions
    │   ├── tests/       # Unit Test files
    │   └── index.js     # Server entry point
    └── package.json     # Backend dependencies
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (for data persistence)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd real-time-whiteboard
```

2. Install frontend dependencies:
```bash
cd client
npm install
```

3. Install backend dependencies:
```bash
cd ../server
npm install
```

## Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. In a new terminal, start the frontend development server:
```bash
cd client
npm start
```

The application will be available at `http://localhost:8080`

## Testing

Run frontend tests:
```bash
cd client
npm test
```

Run backend tests:
```bash
cd server
npm test
```

## Unit Test Screenshots

1. [Colaborative Whiteboard Test Unit test](https://drive.google.com/file/d/1MEKVvnFXe7ro7ZNUM0qjX1kdCnLmUfYy/view?usp=share_link)
2. [User Identification and Listing Unit test](https://drive.google.com/file/d/1ZZGmd49zqXUmqn4uIiCgFt9yynnZoHJR/view?usp=share_link)
3. [Brush customization Unit test](https://drive.google.com/file/d/1x6Q6VpAA_S4dMGMUPQY_j8Dtrk8NFyZU/view?usp=share_link)
4. [Real time Chat Unit test](https://drive.google.com/file/d/1FWgxJBZlgqXIJP282VJylT_DnDe9fHma/view?usp=share_link)
5. [User ID management and Canvas Locking Unit test](https://drive.google.com/file/d/1ywBP_p3fvSaeyH6djysJYo9WdwmFo3uT/view?usp=share_link)
6. [Real Time voice chat Unit test](https://drive.google.com/file/d/1iiXSf_Sf1tbreBaw9VTq6QXXH2yHufxi/view?usp=share_link)
7. [UI enhancements Unit test](https://drive.google.com/file/d/1vZM61H-_T6nsawgdGZp2F6CwfDKwf5CX/view?usp=share_link)
8. [Data Persistence Unit test](https://drive.google.com/file/d/1C_Mt-t9k7g5eG4SY_-SgYLU_JAHJLa-C/view?usp=share_link)

## Project Demo

[Link to Screen Recording](https://drive.google.com/file/d/1fWKy8hNHFU-LGNV9lQjKyfXKqUFvOi3P/view?usp=sharing)

## Technologies Used

- Frontend:
  - React
  - Socket.IO Client
  - Canvas API
  - WebRTC for voice communication
  - Webpack
  - Jest for testing

- Backend:
  - Node.js
  - Express
  - Socket.IO
  - MongoDB
  - WebRTC signaling server
  - Jest for testing