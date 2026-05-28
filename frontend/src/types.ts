export type Role = 'ADMIN' | 'USER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    recipes: number;
  };
}

export interface Recipe {
  id: number;
  title: string;
  slug: string;
  description: string;
  ingredients: string;
  instructions: string;
  imageUrl?: string | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  servings?: number | null;
  averageRating: number;
  ratingCount: number;
  categoryId: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  createdBy?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  _count?: {
    favorites: number;
    reviews: number;
  };
}

export interface Favorite {
  id: number;
  userId: number;
  recipeId: number;
  createdAt: string;
  recipe: Recipe;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string | null;
  userId: number;
  recipeId: number;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  recipe?: Pick<Recipe, 'id' | 'title' | 'slug' | 'averageRating'> & {
    category?: Pick<Category, 'id' | 'name'>;
  };
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
}

export interface RecipePayload {
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  imageUrl?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  categoryId: number;
}

export interface CategoryPayload {
  name: string;
  description?: string;
}
