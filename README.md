# CarStock

I built this application as a way of learning about C#, and .NET. It is a simple Car Dealership administration application that keeps track of cars in that dealership.

## Stack:

### Frontend:
Svelte.js 
SvelteStrap
Tailwind
vite.js (builtool)

## Backend:
C# (Dotnet framework)
SQLite
Dapper

## Installing the Application:

This application relies on C#, so .NET needs to be installed in order for it to run:  
[.NET Download Page](https://dotnet.microsoft.com/en-us/download)

Please clone the repository, then install the necessary packages in both the backend and frontend.

### Frontend:
To install frontend packages, `cd` into the frontend directory and run:

```bash
npm i
```

### Backend:
To install backend packages, `cd` into the backend directory and run:

```bash
dotnet restore
```

### Running the application:
- Add .env file to receive token secret variables for JWT

#### Frontend running:
cd into frontend directory
```bash
npm run dev
```

#### Backend running:
cd into backend directory
```bash
dotnet run
```
run both simultaneously and the frontend should be running on http://localhost:5173

For Documentation regarding the details of the application, see the document: Details.pdf
