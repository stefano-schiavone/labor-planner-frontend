# Labor Planner – Frontend

Frontend application for the **Labor Planner** system, built with a focus on **modern React practices, type safety, and clean UI architecture**.

This project demonstrates my experience with **React, TypeScript, component-driven design, API integration, and modern frontend tooling**.

## Repository Origin

> ℹ️ This repository was originally developed within a university environment and later
> **imported from the university's private GitLab instance**.
> It is published here on GitHub for **portfolio and demonstration purposes**, allowing recruiters to review the technologies, structure, and frontend practices used.

## Tech Stack

**Core**
- React
- TypeScript
- Vite

**UI & Styling**
- Material UI (MUI)
- Emotion (CSS-in-JS)
- Responsive layout design

**State & Data**
- React hooks
- API-based state management
- Typed DTO consumption from backend

**Tooling & Quality**
- ESLint
- TypeScript strict mode
- Modular component structure

**Build & Dev**
- Vite dev server
- Production-optimized builds
- Environment-based configuration

## What This Frontend Does

The frontend is responsible for:
- Providing a clean and intuitive UI for the Labor Planner system
- Authenticating users and handling JWT-based sessions
- Managing jobs, machines, and schedules via backend APIs
- Visualizing planning and scheduling data
- Validating user input before submission
- Communicating with the backend REST API in a type-safe way

## Project Structure

The project follows a **component-based structure** with clear separation of concerns.

```text
src/
├── api/            # API clients & backend integration
├── components/     # Reusable UI components
├── pages/          # Page-level components
├── hooks/          # Custom React hooks
├── types/          # Shared TypeScript types & interfaces
├── utils/          # Utility functions
├── theme/          # MUI theme configuration
├── App.tsx         # Root application component
└── main.tsx        # Application entry point
```

Note: Build output (`dist`) and dependencies (`node_modules`) are excluded from version control.

### Key Architectural Decisions

- **TypeScript-first development** for safety and maintainability
- **Component-driven UI design** using reusable components
- **Material UI** for consistent styling and accessibility
- **Separation of API logic** from UI components
- **Vite** for fast development and optimized production builds
- **Environment variables** for backend URL configuration

## Backend Integration

This frontend consumes the REST API provided by:
[labor-planner-backend](https://github.com/stefano-schiavone/labor-planner-backend)

Key integration points:
- JWT authentication
- Job and machine management
- Schedule generation and visualization
- Constraint-aware scheduling results

## Configuration

Environment-specific configuration is supported via Vite:

```
VITE_API_BASE_URL=http://localhost:8080
```

This mirrors real-world frontend deployment setups.

## Running the Project

### Prerequisites
- Node.js (18+ recommended)
- npm or pnpm

### Install dependencies
```bash
npm install
```

### Run in development
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

## Why This Project Matters

This frontend showcases:
- Modern React + TypeScript development
- Real-world API-driven UI design
- Clean component architecture
- Integration with a non-trivial backend system
- Production-aware tooling and configuration

Together with the backend, this project reflects how I build full-stack applications beyond coursework, using industry-relevant technologies and patterns.
