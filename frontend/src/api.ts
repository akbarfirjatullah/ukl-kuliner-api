import type {
  AuthResponse,
  Category,
  CategoryPayload,
  Favorite,
  Recipe,
  RecipePayload,
  Review,
  User
} from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {};

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message ?? 'Terjadi kesalahan saat menghubungi server.';
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, response.status);
  }

  return data as T;
}

export const api = {
  baseUrl: API_URL,

  register(name: string, email: string, password: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { name, email, password }
    });
  },

  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },

  me(token: string) {
    return request<User>('/users/me', { token });
  },

  getRecipes(search = '', categoryId = '') {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryId) params.set('categoryId', categoryId);

    return request<Recipe[]>(`/recipes${params.toString() ? `?${params}` : ''}`);
  },

  getRecipe(id: number) {
    return request<Recipe>(`/recipes/${id}`);
  },

  createRecipe(token: string, payload: RecipePayload) {
    return request<Recipe>('/recipes', {
      method: 'POST',
      token,
      body: payload
    });
  },

  updateRecipe(token: string, id: number, payload: RecipePayload) {
    return request<Recipe>(`/recipes/${id}`, {
      method: 'PATCH',
      token,
      body: payload
    });
  },

  deleteRecipe(token: string, id: number) {
    return request<{ message: string }>(`/recipes/${id}`, {
      method: 'DELETE',
      token
    });
  },

  getCategories() {
    return request<Category[]>('/categories');
  },

  createCategory(token: string, payload: CategoryPayload) {
    return request<Category>('/categories', {
      method: 'POST',
      token,
      body: payload
    });
  },

  updateCategory(token: string, id: number, payload: CategoryPayload) {
    return request<Category>(`/categories/${id}`, {
      method: 'PATCH',
      token,
      body: payload
    });
  },

  deleteCategory(token: string, id: number) {
    return request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
      token
    });
  },

  getFavorites(token: string) {
    return request<Favorite[]>('/favorites', { token });
  },

  addFavorite(token: string, recipeId: number) {
    return request<Favorite>(`/favorites/${recipeId}`, {
      method: 'POST',
      token
    });
  },

  removeFavorite(token: string, recipeId: number) {
    return request<{ message: string }>(`/favorites/${recipeId}`, {
      method: 'DELETE',
      token
    });
  },

  getRecipeReviews(recipeId: number) {
    return request<Review[]>(`/reviews/recipe/${recipeId}`);
  },

  getMyReviews(token: string) {
    return request<Review[]>('/reviews/me', { token });
  },

  createReview(token: string, recipeId: number, rating: number, comment: string) {
    return request<Review>(`/reviews/recipe/${recipeId}`, {
      method: 'POST',
      token,
      body: { rating, comment }
    });
  },

  updateReview(token: string, recipeId: number, rating: number, comment: string) {
    return request<Review>(`/reviews/recipe/${recipeId}`, {
      method: 'PATCH',
      token,
      body: { rating, comment }
    });
  },

  deleteReview(token: string, recipeId: number) {
    return request<{ message: string }>(`/reviews/recipe/${recipeId}`, {
      method: 'DELETE',
      token
    });
  }
};
