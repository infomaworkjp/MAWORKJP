# Build Project Workflow

This workflow details the step-by-step commands to install dependencies, run static typechecks, and build the production-ready Next.js application.

## Prerequisites

- Node.js version 20 or higher (Current: v24.16.0)
- npm (Node Package Manager)

## Step 1: Install Dependencies

To ensure all required packages are installed, execute:

```bash
npm install
```

## Step 2: Run Typecheck

Run static analysis using TypeScript to check for type errors:

```bash
npm run typecheck
```

## Step 3: Build the Application

Compile the production build of the Next.js application:

```bash
npm run build
```
