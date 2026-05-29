# ConnectHub - Realtime Chat Platform

ConnectHub is a full-stack real-time chatting web application built with React.js (Vite), Spring Boot, PostgreSQL, and WebSocket (STOMP).

## Tech Stack
*   **Frontend**: React (Vite), Tailwind CSS, React Router, Axios, SockJS, STOMP.js
*   **Backend**: Spring Boot 3, Spring Security, JWT, WebSockets (STOMP), Spring Data JPA
*   **Database**: PostgreSQL
*   **Infrastructure**: Docker Compose

## Features Implemented
*   [x] JWT Authentication (Login / Register)
*   [x] Modern WhatsApp/Discord-inspired UI with Dark Mode Aesthetics
*   [x] Real-time 1-on-1 Messaging via WebSockets
*   [x] Real-time Group Chat Creation & Messaging
*   [x] Dynamic Sidebar with User Search & Chat selection
*   [x] Scalable Layered Architecture in Spring Boot

---

## Complete Setup Instructions

### Prerequisites
*   Node.js (v18+)
*   Java 17
*   Docker & Docker Compose

### 1. Database Setup
We use Docker to quickly spin up a PostgreSQL instance.
```bash
docker-compose up -d
```
This will start PostgreSQL on `localhost:5432` with username `postgres` and password `password`.

### 2. Backend Setup
The backend runs on Spring Boot on port `8080`.
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```
*(Hibernate `ddl-auto=update` will automatically generate the database schema tables for Users, Chats, Members, and Messages).*

### 3. Frontend Setup
The frontend runs on Vite on port `5173`.
```bash
cd frontend
npm install
npm run dev
```

---

## Deployment Guide

### Backend Deployment (AWS EC2 / DigitalOcean)
1.  Package the application: `./mvnw clean package`
2.  The resulting `connecthub-0.0.1-SNAPSHOT.jar` can be run on any server with Java 17: `java -jar target/connecthub-0.0.1-SNAPSHOT.jar`
3.  Set up an environment variable for `SPRING_DATASOURCE_URL` pointing to your production PostgreSQL database (e.g., AWS RDS).
4.  Use `nginx` as a reverse proxy to forward traffic from port 80/443 to port 8080.

### Frontend Deployment (Vercel / Netlify)
1.  Change the `baseURL` in `src/services/api.ts` to your deployed backend URL.
2.  Change the WebSocket connection URL in `src/context/WebSocketContext.tsx` to `wss://your-backend-url.com/ws`.
3.  Push your code to GitHub.
4.  Import the `frontend` folder into Vercel or Netlify.
5.  Set the build command to `npm run build` and output directory to `dist`.

### Docker (Optional Production Route)
You can create a `Dockerfile` for the Spring Boot application and a `Dockerfile` for the React application (using nginx), and deploy them via Docker Swarm or Kubernetes.
# Chat_Web
