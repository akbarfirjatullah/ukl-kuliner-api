import { FormEvent, useEffect, useState } from 'react';
import {
  BookOpen,
  ChefHat,
  Heart,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Star,
  Trash2,
  UserPlus,
  X
} from 'lucide-react';
import { api, ApiError } from './api';
import type { Category, CategoryPayload, Favorite, Recipe, RecipePayload, Review, User } from './types';

type View = 'recipes' | 'favorites' | 'admin';
type AuthMode = 'login' | 'register';

const emptyRecipeForm = {
  title: '',
  description: '',
  ingredients: '',
  instructions: '',
  imageUrl: '',
  prepTimeMinutes: '',
  cookTimeMinutes: '',
  servings: '',
  categoryId: ''
};

const emptyCategoryForm = {
  name: '',
  description: ''
};

function readStoredUser() {
  const stored = localStorage.getItem('user');
  return stored ? (JSON.parse(stored) as User) : null;
}

function App() {
  const [activeView, setActiveView] = useState<View>('recipes');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('admin@uklrecipe.com');
  const [authPassword, setAuthPassword] = useState('Admin12345');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [recipeForm, setRecipeForm] = useState(emptyRecipeForm);
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN';
  const favoriteRecipeIds = favorites.map((favorite) => favorite.recipeId);
  const selectedIsFavorite = selectedRecipeId ? favoriteRecipeIds.includes(selectedRecipeId) : false;
  const myReview = user ? reviews.find((review) => review.userId === user.id) : undefined;

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    void loadRecipes();
  }, [search, categoryFilter]);

  useEffect(() => {
    if (token) {
      void loadFavorites(token);
    } else {
      setFavorites([]);
    }
  }, [token]);

  useEffect(() => {
    if (selectedRecipeId) {
      void loadSelectedRecipe(selectedRecipeId);
      void loadReviews(selectedRecipeId);
    } else {
      setSelectedRecipe(null);
      setReviews([]);
    }
  }, [selectedRecipeId]);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? '');
    } else {
      setRating(5);
      setComment('');
    }
  }, [myReview?.id, selectedRecipeId]);

  async function runTask(task: () => Promise<void>, successMessage?: string) {
    setError('');
    setNotice('');
    setLoading(true);

    try {
      await task();
      if (successMessage) setNotice(successMessage);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan yang tidak terduga.');
    } finally {
      setLoading(false);
    }
  }

  async function loadInitialData() {
    await runTask(async () => {
      const [categoryData, recipeData] = await Promise.all([api.getCategories(), api.getRecipes()]);
      setCategories(categoryData);
      setRecipes(recipeData);
      setSelectedRecipeId((current) => current ?? recipeData[0]?.id ?? null);
    });
  }

  async function loadRecipes() {
    await runTask(async () => {
      const data = await api.getRecipes(search, categoryFilter);
      setRecipes(data);
      setSelectedRecipeId((current) => {
        if (current && data.some((recipe) => recipe.id === current)) return current;
        return data[0]?.id ?? null;
      });
    });
  }

  async function loadCategories() {
    const data = await api.getCategories();
    setCategories(data);
  }

  async function loadFavorites(authToken = token) {
    if (!authToken) return;
    const data = await api.getFavorites(authToken);
    setFavorites(data);
  }

  async function loadSelectedRecipe(recipeId: number) {
    const data = await api.getRecipe(recipeId);
    setSelectedRecipe(data);
  }

  async function loadReviews(recipeId: number) {
    const data = await api.getRecipeReviews(recipeId);
    setReviews(data);
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runTask(async () => {
      const data =
        authMode === 'login'
          ? await api.login(authEmail, authPassword)
          : await api.register(authName, authEmail, authPassword);

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);
      setNotice(data.message);
      await loadFavorites(data.accessToken);
    });
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setActiveView('recipes');
    setNotice('Anda sudah logout.');
  }

  async function toggleFavorite(recipeId: number) {
    if (!token) {
      setError('Silakan login terlebih dahulu untuk mengelola favorit.');
      return;
    }

    await runTask(async () => {
      if (favoriteRecipeIds.includes(recipeId)) {
        await api.removeFavorite(token, recipeId);
      } else {
        await api.addFavorite(token, recipeId);
      }

      await loadFavorites(token);
      await loadSelectedRecipe(recipeId);
    }, favoriteRecipeIds.includes(recipeId) ? 'Resep dihapus dari favorit.' : 'Resep ditambahkan ke favorit.');
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedRecipeId) {
      setError('Silakan login dan pilih resep terlebih dahulu.');
      return;
    }

    await runTask(async () => {
      if (myReview) {
        await api.updateReview(token, selectedRecipeId, rating, comment);
      } else {
        await api.createReview(token, selectedRecipeId, rating, comment);
      }

      await loadReviews(selectedRecipeId);
      await loadSelectedRecipe(selectedRecipeId);
      await loadRecipes();
    }, myReview ? 'Ulasan berhasil diperbarui.' : 'Ulasan berhasil ditambahkan.');
  }

  async function deleteMyReview() {
    if (!token || !selectedRecipeId) return;

    await runTask(async () => {
      await api.deleteReview(token, selectedRecipeId);
      await loadReviews(selectedRecipeId);
      await loadSelectedRecipe(selectedRecipeId);
      await loadRecipes();
    }, 'Ulasan berhasil dihapus.');
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !isAdmin) return;

    const payload: CategoryPayload = {
      name: categoryForm.name,
      description: categoryForm.description || undefined
    };

    await runTask(async () => {
      if (editingCategoryId) {
        await api.updateCategory(token, editingCategoryId, payload);
      } else {
        await api.createCategory(token, payload);
      }

      setCategoryForm(emptyCategoryForm);
      setEditingCategoryId(null);
      await loadCategories();
    }, editingCategoryId ? 'Kategori berhasil diperbarui.' : 'Kategori berhasil dibuat.');
  }

  async function deleteCategory(id: number) {
    if (!token || !isAdmin) return;

    await runTask(async () => {
      await api.deleteCategory(token, id);
      await loadCategories();
    }, 'Kategori berhasil dihapus.');
  }

  async function submitRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !isAdmin) return;

    const payload = toRecipePayload(recipeForm);

    await runTask(async () => {
      const savedRecipe = editingRecipeId
        ? await api.updateRecipe(token, editingRecipeId, payload)
        : await api.createRecipe(token, payload);

      setRecipeForm(emptyRecipeForm);
      setEditingRecipeId(null);
      await loadRecipes();
      setSelectedRecipeId(savedRecipe.id);
    }, editingRecipeId ? 'Resep berhasil diperbarui.' : 'Resep berhasil dibuat.');
  }

  async function deleteRecipe(id: number) {
    if (!token || !isAdmin) return;

    await runTask(async () => {
      await api.deleteRecipe(token, id);
      await loadRecipes();
    }, 'Resep berhasil dihapus.');
  }

  function startEditCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description ?? ''
    });
  }

  function startEditRecipe(recipe: Recipe) {
    setEditingRecipeId(recipe.id);
    setRecipeForm({
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      imageUrl: recipe.imageUrl ?? '',
      prepTimeMinutes: recipe.prepTimeMinutes?.toString() ?? '',
      cookTimeMinutes: recipe.cookTimeMinutes?.toString() ?? '',
      servings: recipe.servings?.toString() ?? '',
      categoryId: recipe.categoryId.toString()
    });
    setActiveView('admin');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <ChefHat size={25} />
          </span>
          <div className="brand-copy">
            <strong>UKL Kuliner</strong>
            <small>Recipe workspace</small>
          </div>
        </div>

        <nav className="nav">
          <button className={activeView === 'recipes' ? 'active' : ''} onClick={() => setActiveView('recipes')}>
            <BookOpen size={18} />
            Resep
          </button>
          <button className={activeView === 'favorites' ? 'active' : ''} onClick={() => setActiveView('favorites')}>
            <Heart size={18} />
            Favorit
          </button>
          <button className={activeView === 'admin' ? 'active' : ''} onClick={() => setActiveView('admin')}>
            <Shield size={18} />
            Admin
          </button>
        </nav>

        <section className="auth-box">
          {user ? (
            <div className="account-card">
              <span className="role-pill">{user.role}</span>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
              <button className="ghost-button" onClick={logout}>
                <LogOut size={17} />
                Logout
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="auth-form">
              <div className="segmented">
                <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
                  <LogIn size={16} />
                  Login
                </button>
                <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>
                  <UserPlus size={16} />
                  Daftar
                </button>
              </div>

              {authMode === 'register' && (
                <label>
                  Nama
                  <input value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Nama lengkap" required />
                </label>
              )}

              <label>
                Email
                <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} type="email" required />
              </label>

              <label>
                Password
                <input value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} type="password" required />
              </label>

              <button className="primary-button" type="submit" disabled={loading}>
                {authMode === 'login' ? <LogIn size={17} /> : <UserPlus size={17} />}
                {authMode === 'login' ? 'Login' : 'Daftar'}
              </button>
            </form>
          )}
        </section>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>Kelola dan uji resep dari API backend.</h1>
          </div>
          <button className="ghost-button" onClick={() => void loadInitialData()}>
            <RefreshCw size={17} />
            Refresh
          </button>
        </header>

        {(notice || error) && (
          <div className={`status-message ${error ? 'error' : ''}`}>
            <span>{error || notice}</span>
            <button onClick={() => (error ? setError('') : setNotice(''))} aria-label="Tutup pesan">
              <X size={16} />
            </button>
          </div>
        )}

        {activeView === 'recipes' && (
          <RecipesView
            categories={categories}
            recipes={recipes}
            selectedRecipe={selectedRecipe}
            selectedRecipeId={selectedRecipeId}
            reviews={reviews}
            search={search}
            categoryFilter={categoryFilter}
            rating={rating}
            comment={comment}
            isLoggedIn={Boolean(user)}
            isAdmin={isAdmin}
            selectedIsFavorite={selectedIsFavorite}
            myReview={myReview}
            onSearchChange={setSearch}
            onCategoryFilterChange={setCategoryFilter}
            onSelectRecipe={setSelectedRecipeId}
            onToggleFavorite={toggleFavorite}
            onRatingChange={setRating}
            onCommentChange={setComment}
            onSubmitReview={submitReview}
            onDeleteReview={deleteMyReview}
            onEditRecipe={startEditRecipe}
          />
        )}

        {activeView === 'favorites' && (
          <FavoritesView favorites={favorites} isLoggedIn={Boolean(user)} onSelectRecipe={(id) => {
            setSelectedRecipeId(id);
            setActiveView('recipes');
          }} onRemoveFavorite={toggleFavorite} />
        )}

        {activeView === 'admin' && (
          <AdminView
            isAdmin={isAdmin}
            categories={categories}
            recipes={recipes}
            categoryForm={categoryForm}
            recipeForm={recipeForm}
            editingCategoryId={editingCategoryId}
            editingRecipeId={editingRecipeId}
            onCategoryFormChange={setCategoryForm}
            onRecipeFormChange={setRecipeForm}
            onSubmitCategory={submitCategory}
            onSubmitRecipe={submitRecipe}
            onEditCategory={startEditCategory}
            onDeleteCategory={deleteCategory}
            onEditRecipe={startEditRecipe}
            onDeleteRecipe={deleteRecipe}
            onCancelCategory={() => {
              setCategoryForm(emptyCategoryForm);
              setEditingCategoryId(null);
            }}
            onCancelRecipe={() => {
              setRecipeForm(emptyRecipeForm);
              setEditingRecipeId(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

function RecipesView(props: {
  categories: Category[];
  recipes: Recipe[];
  selectedRecipe: Recipe | null;
  selectedRecipeId: number | null;
  reviews: Review[];
  search: string;
  categoryFilter: string;
  rating: number;
  comment: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  selectedIsFavorite: boolean;
  myReview?: Review;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onSelectRecipe: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onRatingChange: (value: number) => void;
  onCommentChange: (value: string) => void;
  onSubmitReview: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteReview: () => void;
  onEditRecipe: (recipe: Recipe) => void;
}) {
  return (
    <section className="workspace-grid">
      <div className="recipe-column">
        <div className="tool-row">
          <label className="search-box">
            <Search size={18} />
            <input value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Cari resep atau bahan..." />
          </label>

          <select value={props.categoryFilter} onChange={(event) => props.onCategoryFilterChange(event.target.value)}>
            <option value="">Semua kategori</option>
            {props.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="recipe-list">
          {props.recipes.length === 0 ? (
            <EmptyState title="Belum ada resep" body="Login sebagai admin, buat kategori, lalu tambah resep pertama." />
          ) : (
            props.recipes.map((recipe) => (
              <button
                key={recipe.id}
                className={`recipe-card ${recipe.id === props.selectedRecipeId ? 'active' : ''}`}
                onClick={() => props.onSelectRecipe(recipe.id)}
              >
                <div className="recipe-thumb">{recipe.imageUrl ? <img src={recipe.imageUrl} alt={recipe.title} /> : <ChefHat size={30} />}</div>
                <div>
                  <span>{recipe.category?.name ?? 'Tanpa kategori'}</span>
                  <strong>{recipe.title}</strong>
                  <small>
                    {recipe.averageRating.toFixed(1)} rating dari {recipe.ratingCount} ulasan
                  </small>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <article className="detail-panel">
        {!props.selectedRecipe ? (
          <EmptyState title="Pilih resep" body="Detail resep dan ulasan akan tampil di sini." />
        ) : (
          <>
            <div className="detail-hero">
              {props.selectedRecipe.imageUrl ? <img src={props.selectedRecipe.imageUrl} alt={props.selectedRecipe.title} /> : <ChefHat size={52} />}
            </div>

            <div className="detail-head">
              <div>
                <span className="category-chip">{props.selectedRecipe.category?.name ?? 'Tanpa kategori'}</span>
                <h2>{props.selectedRecipe.title}</h2>
                <p>{props.selectedRecipe.description}</p>
              </div>
              <div className="rating-badge">
                <Star size={18} />
                {props.selectedRecipe.averageRating.toFixed(1)}
              </div>
            </div>

            <div className="meta-row">
              <span>Prep {props.selectedRecipe.prepTimeMinutes ?? '-'} menit</span>
              <span>Masak {props.selectedRecipe.cookTimeMinutes ?? '-'} menit</span>
              <span>{props.selectedRecipe.servings ?? '-'} porsi</span>
            </div>

            <div className="button-row">
              <button className="primary-button" onClick={() => props.onToggleFavorite(props.selectedRecipe!.id)} disabled={!props.isLoggedIn}>
                <Heart size={17} fill={props.selectedIsFavorite ? 'currentColor' : 'none'} />
                {props.selectedIsFavorite ? 'Hapus Favorit' : 'Tambah Favorit'}
              </button>
              {props.isAdmin && (
                <button className="ghost-button" onClick={() => props.onEditRecipe(props.selectedRecipe!)}>
                  <Pencil size={17} />
                  Edit Resep
                </button>
              )}
            </div>

            <div className="content-split">
              <TextBlock title="Bahan" content={props.selectedRecipe.ingredients} />
              <TextBlock title="Langkah" content={props.selectedRecipe.instructions} />
            </div>

            <section className="reviews-section">
              <div className="section-title">
                <h3>Ulasan</h3>
                <span>{props.reviews.length} ulasan</span>
              </div>

              {props.isLoggedIn ? (
                <form className="review-form" onSubmit={props.onSubmitReview}>
                  <label>
                    Rating
                    <select value={props.rating} onChange={(event) => props.onRatingChange(Number(event.target.value))}>
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} bintang
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Komentar
                    <textarea value={props.comment} onChange={(event) => props.onCommentChange(event.target.value)} placeholder="Tulis ulasan singkat..." />
                  </label>
                  <div className="button-row">
                    <button className="primary-button" type="submit">
                      <Save size={17} />
                      {props.myReview ? 'Update Ulasan' : 'Kirim Ulasan'}
                    </button>
                    {props.myReview && (
                      <button className="danger-button" type="button" onClick={props.onDeleteReview}>
                        <Trash2 size={17} />
                        Hapus
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <p className="muted">Login untuk memberi rating dan ulasan.</p>
              )}

              <div className="review-list">
                {props.reviews.map((review) => (
                  <div className="review-card" key={review.id}>
                    <div>
                      <strong>{review.user?.name ?? 'User'}</strong>
                      <span>{review.rating} bintang</span>
                    </div>
                    <p>{review.comment || 'Tidak ada komentar.'}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </article>
    </section>
  );
}

function FavoritesView(props: {
  favorites: Favorite[];
  isLoggedIn: boolean;
  onSelectRecipe: (id: number) => void;
  onRemoveFavorite: (id: number) => void;
}) {
  if (!props.isLoggedIn) {
    return <EmptyState title="Belum login" body="Login dulu untuk melihat dan mengelola resep favorit." />;
  }

  return (
    <section className="panel-list">
      <div className="section-title">
        <h2>Favorit Saya</h2>
        <span>{props.favorites.length} resep</span>
      </div>

      {props.favorites.length === 0 ? (
        <EmptyState title="Belum ada favorit" body="Pilih resep lalu tekan tombol tambah favorit." />
      ) : (
        props.favorites.map((favorite) => (
          <div className="wide-card" key={favorite.id}>
            <div>
              <span>{favorite.recipe.category?.name ?? 'Tanpa kategori'}</span>
              <strong>{favorite.recipe.title}</strong>
              <p>{favorite.recipe.description}</p>
            </div>
            <div className="button-row">
              <button className="ghost-button" onClick={() => props.onSelectRecipe(favorite.recipeId)}>
                <BookOpen size={17} />
                Detail
              </button>
              <button className="danger-button" onClick={() => props.onRemoveFavorite(favorite.recipeId)}>
                <Trash2 size={17} />
                Hapus
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}

function AdminView(props: {
  isAdmin: boolean;
  categories: Category[];
  recipes: Recipe[];
  categoryForm: typeof emptyCategoryForm;
  recipeForm: typeof emptyRecipeForm;
  editingCategoryId: number | null;
  editingRecipeId: number | null;
  onCategoryFormChange: (value: typeof emptyCategoryForm) => void;
  onRecipeFormChange: (value: typeof emptyRecipeForm) => void;
  onSubmitCategory: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitRecipe: (event: FormEvent<HTMLFormElement>) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: number) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: number) => void;
  onCancelCategory: () => void;
  onCancelRecipe: () => void;
}) {
  if (!props.isAdmin) {
    return <EmptyState title="Akses admin dibutuhkan" body="Login menggunakan akun ADMIN untuk mengelola kategori dan resep." />;
  }

  return (
    <section className="admin-grid">
      <div className="admin-panel">
        <div className="section-title">
          <h2>Kategori</h2>
          <span>{props.categories.length} data</span>
        </div>

        <form className="stack-form" onSubmit={props.onSubmitCategory}>
          <label>
            Nama kategori
            <input
              value={props.categoryForm.name}
              onChange={(event) => props.onCategoryFormChange({ ...props.categoryForm, name: event.target.value })}
              placeholder="Contoh: Makanan Utama"
              required
            />
          </label>
          <label>
            Deskripsi
            <textarea
              value={props.categoryForm.description}
              onChange={(event) => props.onCategoryFormChange({ ...props.categoryForm, description: event.target.value })}
              placeholder="Deskripsi singkat kategori"
            />
          </label>
          <div className="button-row">
            <button className="primary-button" type="submit">
              {props.editingCategoryId ? <Save size={17} /> : <Plus size={17} />}
              {props.editingCategoryId ? 'Simpan' : 'Tambah'}
            </button>
            {props.editingCategoryId && (
              <button className="ghost-button" type="button" onClick={props.onCancelCategory}>
                <X size={17} />
                Batal
              </button>
            )}
          </div>
        </form>

        <div className="compact-list">
          {props.categories.map((category) => (
            <div className="compact-card" key={category.id}>
              <div>
                <strong>{category.name}</strong>
                <small>{category._count?.recipes ?? 0} resep</small>
              </div>
              <div className="icon-actions">
                <button onClick={() => props.onEditCategory(category)} aria-label="Edit kategori">
                  <Pencil size={16} />
                </button>
                <button onClick={() => props.onDeleteCategory(category.id)} aria-label="Hapus kategori">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-panel">
        <div className="section-title">
          <h2>Resep</h2>
          <span>{props.recipes.length} data</span>
        </div>

        <form className="stack-form" onSubmit={props.onSubmitRecipe}>
          <div className="form-grid">
            <label>
              Judul
              <input value={props.recipeForm.title} onChange={(event) => props.onRecipeFormChange({ ...props.recipeForm, title: event.target.value })} required />
            </label>
            <label>
              Kategori
              <select value={props.recipeForm.categoryId} onChange={(event) => props.onRecipeFormChange({ ...props.recipeForm, categoryId: event.target.value })} required>
                <option value="">Pilih kategori</option>
                {props.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Deskripsi
            <textarea value={props.recipeForm.description} onChange={(event) => props.onRecipeFormChange({ ...props.recipeForm, description: event.target.value })} required />
          </label>

          <label>
            Bahan
            <textarea value={props.recipeForm.ingredients} onChange={(event) => props.onRecipeFormChange({ ...props.recipeForm, ingredients: event.target.value })} required />
          </label>

          <label>
            Langkah
            <textarea value={props.recipeForm.instructions} onChange={(event) => props.onRecipeFormChange({ ...props.recipeForm, instructions: event.target.value })} required />
          </label>

          <label>
            URL gambar
            <input value={props.recipeForm.imageUrl} onChange={(event) => props.onRecipeFormChange({ ...props.recipeForm, imageUrl: event.target.value })} placeholder="https://..." />
          </label>

          <div className="form-grid three">
            <label>
              Prep
              <input type="number" min="1" value={props.recipeForm.prepTimeMinutes} onChange={(event) => props.onRecipeFormChange({ ...props.recipeForm, prepTimeMinutes: event.target.value })} />
            </label>
            <label>
              Masak
              <input type="number" min="1" value={props.recipeForm.cookTimeMinutes} onChange={(event) => props.onRecipeFormChange({ ...props.recipeForm, cookTimeMinutes: event.target.value })} />
            </label>
            <label>
              Porsi
              <input type="number" min="1" value={props.recipeForm.servings} onChange={(event) => props.onRecipeFormChange({ ...props.recipeForm, servings: event.target.value })} />
            </label>
          </div>

          <div className="button-row">
            <button className="primary-button" type="submit">
              {props.editingRecipeId ? <Save size={17} /> : <Plus size={17} />}
              {props.editingRecipeId ? 'Simpan Resep' : 'Tambah Resep'}
            </button>
            {props.editingRecipeId && (
              <button className="ghost-button" type="button" onClick={props.onCancelRecipe}>
                <X size={17} />
                Batal
              </button>
            )}
          </div>
        </form>

        <div className="compact-list">
          {props.recipes.map((recipe) => (
            <div className="compact-card" key={recipe.id}>
              <div>
                <strong>{recipe.title}</strong>
                <small>{recipe.category?.name ?? 'Tanpa kategori'}</small>
              </div>
              <div className="icon-actions">
                <button onClick={() => props.onEditRecipe(recipe)} aria-label="Edit resep">
                  <Pencil size={16} />
                </button>
                <button onClick={() => props.onDeleteRecipe(recipe.id)} aria-label="Hapus resep">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TextBlock({ title, content }: { title: string; content: string }) {
  return (
    <section className="text-block">
      <h3>{title}</h3>
      <p>{content}</p>
    </section>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <ChefHat size={32} />
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function toRecipePayload(form: typeof emptyRecipeForm): RecipePayload {
  return {
    title: form.title,
    description: form.description,
    ingredients: form.ingredients,
    instructions: form.instructions,
    imageUrl: form.imageUrl || undefined,
    prepTimeMinutes: form.prepTimeMinutes ? Number(form.prepTimeMinutes) : undefined,
    cookTimeMinutes: form.cookTimeMinutes ? Number(form.cookTimeMinutes) : undefined,
    servings: form.servings ? Number(form.servings) : undefined,
    categoryId: Number(form.categoryId)
  };
}

export default App;
