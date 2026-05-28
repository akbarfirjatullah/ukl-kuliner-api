# UKL Recipe API

Backend API for a culinary / recipe app built with NestJS, Prisma, and MySQL.

This project already includes:

- JWT authentication with bcrypt password hashing
- Role-based authorization (`ADMIN` and `USER`)
- CRUD for recipes
- CRUD for categories
- Favorites feature (user can save / remove favorite recipes)
- Rating and review feature
- Automatic recipe average rating update
- Swagger API documentation
- Prisma schema, seed script, Docker MySQL setup, and deployment-ready Dockerfile

## 1. Tech stack

- Framework: NestJS
- Language: TypeScript
- ORM: Prisma
- Database: MySQL
- Auth: JWT + Passport + bcrypt
- API Docs: Swagger

## 2. Project structure

```text
src/
  auth/
  users/
  categories/
  recipes/
  favorites/
  reviews/
  prisma/
  common/
prisma/
  schema.prisma
  seed.ts
docker-compose.yml
Dockerfile
```

## 3. Step-by-step local setup

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Start MySQL with Docker

```bash
docker compose up -d
```

This creates a MySQL database with:

- Database name: `ukl_recipe_app`
- Username: `nestuser`
- Password: `nestpass`
- Port: `3306`

### Step 3: Check the environment file

The project already contains a local `.env` for development.

If you need to recreate it manually, use this:

```env
PORT=3000
DATABASE_URL="mysql://nestuser:nestpass@localhost:3306/ukl_recipe_app"
JWT_SECRET="super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="1d"
ADMIN_NAME="UKL Admin"
ADMIN_EMAIL="admin@uklrecipe.com"
ADMIN_PASSWORD="Admin12345"
```

### Step 4: Run Prisma migration

```bash
npx prisma migrate dev --name init
```

This will:

- Create the tables in MySQL
- Generate Prisma Client
- Save the first migration files

### Step 5: Seed the admin user

```bash
npm run seed
```

Default seeded admin:

- Email: `admin@uklrecipe.com`
- Password: `Admin12345`

You can change those values in `.env`.

### Step 6: Start the backend

```bash
npm run start:dev
```

Base URL:

```text
http://localhost:3000/api
```

Swagger docs:

```text
http://localhost:3000/api/docs
```

## 4. Authentication and roles

### Roles

- `ADMIN`
  - Can create, update, and delete recipes
  - Can create, update, and delete categories
- `USER`
  - Can register and login
  - Can read recipes and categories
  - Can manage their own favorites
  - Can manage their own reviews

### Auth flow

1. Register a regular user at `POST /api/auth/register`
2. Login at `POST /api/auth/login`
3. Copy the returned `accessToken`
4. In Swagger, click `Authorize`
5. Paste:

```text
Bearer YOUR_TOKEN_HERE
```

## 5. Main API endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Users

- `GET /api/users/me`
- `GET /api/users` - admin only
- `GET /api/users/:id` - admin only

### Categories

- `POST /api/categories` - admin only
- `GET /api/categories`
- `GET /api/categories/:id`
- `PATCH /api/categories/:id` - admin only
- `DELETE /api/categories/:id` - admin only

### Recipes

- `POST /api/recipes` - admin only
- `GET /api/recipes`
- `GET /api/recipes/:id`
- `PATCH /api/recipes/:id` - admin only
- `DELETE /api/recipes/:id` - admin only

Optional query for recipe list:

- `search`
- `categoryId`

### Favorites

- `GET /api/favorites`
- `POST /api/favorites/:recipeId`
- `DELETE /api/favorites/:recipeId`

### Reviews

- `GET /api/reviews/me`
- `GET /api/reviews/recipe/:recipeId`
- `POST /api/reviews/recipe/:recipeId`
- `PATCH /api/reviews/recipe/:recipeId`
- `DELETE /api/reviews/recipe/:recipeId`

## 6. Transaction logic explained

### Favorites

When a user adds a recipe to favorites:

1. The API checks whether the recipe exists
2. The API checks whether the user already saved it
3. The favorite is inserted inside a Prisma transaction

When a user removes a favorite:

1. The API checks whether that favorite exists for the user
2. The favorite is deleted inside a Prisma transaction

### Reviews and average rating

Each user can only review one recipe once.

When a review is created, updated, or deleted:

1. The API runs the review change inside a transaction
2. It recalculates the recipe rating summary using Prisma aggregate
3. It updates:
   - `averageRating`
   - `ratingCount`

This ensures the value stored in the `Recipe` table is always synced with real reviews.

## 7. Prisma data model

Main entities:

- `User`
- `Category`
- `Recipe`
- `Favorite`
- `Review`

Relations:

- One `Category` has many `Recipe`
- One `User` can create many `Recipe`
- One `User` can favorite many `Recipe` through `Favorite`
- One `User` can review many `Recipe` through `Review`
- One `Recipe` can have many favorites and reviews

Important unique rules:

- User email must be unique
- Category name must be unique
- Recipe slug must be unique
- Favorite has unique pair: `(userId, recipeId)`
- Review has unique pair: `(userId, recipeId)`

## 8. Useful commands

### Start development server

```bash
npm run start:dev
```

### Build project

```bash
npm run build
```

### Open Prisma Studio

```bash
npm run prisma:studio
```

### Stop database container

```bash
docker compose down
```

## 9. Deployment guide

Recommendation:

- Use Railway if you want the easiest setup for a school project
- Use Render if you want a public backend plus a separate private MySQL service

### Option A: Deploy to Railway

Official docs used:

- [Railway NestJS deployment guide](https://docs.railway.com/guides/nest)
- [Railway MySQL docs](https://docs.railway.com/databases/mysql)

Steps:

1. Push this project to GitHub.
2. In Railway, create a new project.
3. Add a MySQL service to the project.
4. Add your GitHub repo as the application service.
5. Set environment variables for the app service:

```env
PORT=3000
JWT_SECRET=your-production-secret
JWT_EXPIRES_IN=1d
DATABASE_URL=<use the MySQL service connection URL>
ADMIN_NAME=UKL Admin
ADMIN_EMAIL=admin@yourapp.com
ADMIN_PASSWORD=StrongPassword123
```

6. Because this project includes a `Dockerfile`, Railway can deploy it as a Docker-based app.
7. After deploy finishes, open the service settings and generate a public domain.
8. Your Swagger docs will be available at:

```text
https://your-domain.up.railway.app/api/docs
```

Notes:

- Railway docs show that MySQL service variables include `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, and `MYSQL_URL`
- You can use the MySQL URL from that service directly for `DATABASE_URL`

### Option B: Deploy to Render

Official docs used:

- [Render Web Services docs](https://render.com/docs/web-services/)
- [Render Docker docs](https://render.com/docs/docker)
- [Render MySQL deployment docs](https://render.com/docs/deploy-mysql)
- [Render environment variable docs](https://render.com/docs/environment-variables)

Steps:

1. Push this project to GitHub.
2. In Render, create a new private service for MySQL.
3. Use the MySQL Docker setup described in Render docs.
4. Make sure the MySQL private service uses a persistent disk mounted at:

```text
/var/lib/mysql
```

5. Create a new Web Service for this NestJS repo.
6. Render can build from the included `Dockerfile`.
7. Add environment variables to the web service:

```env
PORT=10000
JWT_SECRET=your-production-secret
JWT_EXPIRES_IN=1d
DATABASE_URL=mysql://USERNAME:PASSWORD@MYSQL_INTERNAL_HOST:3306/DATABASE_NAME
ADMIN_NAME=UKL Admin
ADMIN_EMAIL=admin@yourapp.com
ADMIN_PASSWORD=StrongPassword123
```

8. Deploy the web service.
9. Render gives your app a public URL like:

```text
https://your-service.onrender.com
```

10. Swagger docs will be:

```text
https://your-service.onrender.com/api/docs
```

Important:

- Render docs say web services must bind to `0.0.0.0` and use the provided port
- Nest already does that correctly when you set the `PORT` environment variable

## 10. What to do after this

After your backend is running, your next normal steps would be:

1. Test all endpoints in Swagger
2. Create a few categories as admin
3. Create a few recipes as admin
4. Register a normal user
5. Test favorites
6. Test reviews and confirm `averageRating` changes
7. Deploy to Railway or Render

## 11. Verified in this workspace

The following checks were completed successfully in this workspace:

- `npm install`
- `npm run build`
- `npx prisma validate`

## 12. Important note

This repository is backend only.

You do not need to build the frontend for your UKL assessment if your task is only the backend API. The frontend can later consume this API using the documented endpoints.
