// New: src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import BookGallery from './components/BookGallery';
import BookDetail from './components/BookDetail';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// A new, small component for our Logo
function Logo() {
  return (
    <a href="/" className="flex items-center space-x-2 text-lg font-semibold text-slate-200 transition-colors hover:text-white">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
      </svg>
      <span className="tracking-tight">Semantica</span>
    </a>
  );
}

function Alert({ type, message }) {
  const baseClasses = "flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg";
  const typeClasses = {
    error: "border-rose-400/70 bg-rose-500/15 text-rose-100",
    info: "border-sky-400/70 bg-sky-500/15 text-sky-100",
    loading: "border-slate-200/30 bg-slate-500/10 text-slate-200 animate-pulse",
  };
  
  const icon = {
    error: '⚠️',
    info: '✨',
    loading: '⏳'
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="text-xl">{icon[type]}</span>
      <p className="text-sm font-medium leading-relaxed tracking-tight">
        {message}
      </p>
    </div>
  );
}


function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ categories: ["All"], tones: ["All"] });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTone, setSelectedTone] = useState('All');

  useEffect(() => {
    const fetchFilters = async () => {
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/filters`);
        setFilterOptions(response.data);
      } catch (err) {
        console.error("Error fetching filters:", err);
        setError("Could not load filter options. Please ensure the backend is running.");
      }
    };
    fetchFilters();
  }, []);

  const handleSearch = async (query) => {
    setIsLoading(true);
    setError(null);
    setInfo(null);
    setSelectedBook(null);
    setRecommendations([]);

    try {
      const response = await axios.post(`${API_BASE_URL}/recommendations`, {
        query: query,
        category: selectedCategory,
        tone: selectedTone,
      });
      const newRecs = response.data.recommendations || [];
      setRecommendations(newRecs);
      
      if (newRecs.length === 0) {
        setInfo("No specific recommendations found. Try broadening your search!");
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError(err.response?.data?.detail || "Failed to fetch recommendations. Is the backend running?");
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setError(null);
    setInfo(null);
  };

  const activeBook = selectedBook || (recommendations.length === 1 ? recommendations[0] : null);
  const hasMultipleResults = recommendations.length > 1;
  const noResults = !isLoading && !error && !info && recommendations.length === 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-48 right-[-8rem] h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-sky-400/40 via-fuchsia-500/20 to-transparent blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-6rem] h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-purple-500/30 via-sky-400/30 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950/80" />
      </div>
      <div className="absolute inset-0 -z-10 bg-noise opacity-30" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-10 sm:px-6 lg:px-10">
        <header className="mb-12 flex flex-col gap-10 border-b border-white/10 pb-12">
          <nav className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Logo />
            <div className="-mx-1 flex w-full items-center justify-start gap-2 overflow-x-auto pb-1 text-xs font-medium text-slate-200 sm:mx-0 sm:w-auto sm:justify-center sm:gap-4 sm:text-sm">
              <a className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:text-white flex-shrink-0" href="#discover">Discover</a>
              <a className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:text-white flex-shrink-0" href="#moods">Moods</a>
              <a className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:text-white flex-shrink-0" href="#collections">Collections</a>
            </div>
          </nav>

          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              AI-Curated Reading Guide
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find stories aligned with your&nbsp;curiosity.
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              Describe the kind of journey you want and let semantic search uncover books that resonate. Filter by vibe, pacing, or genre to refine what’s next on your shelf.
            </p>
            <div className="mx-auto mt-10 w-full max-w-3xl" id="discover">
              <div className="glass-panel relative px-6 py-8">
                <div className="gradient-ring pointer-events-none" aria-hidden="true" />
                <div className="relative z-10">
                  <SearchBar
                    onSearch={handleSearch}
                    categories={filterOptions.categories}
                    tones={filterOptions.tones}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedTone={selectedTone}
                    onToneChange={setSelectedTone}
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-4 text-left text-sm text-slate-200 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-slate-300">Catalog</p>
                <p className="mt-1 text-xl font-semibold text-white">5k+ titles</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-slate-300">Mood tagging</p>
                <p className="mt-1 text-xl font-semibold text-white">Emotion-aware</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-slate-300">Recommendations</p>
                <p className="mt-1 text-xl font-semibold text-white">Instant &amp; smart</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-12">
          {(isLoading || error || info) && (
            <section className="mx-auto w-full max-w-3xl">
              <div className="space-y-4">
                {isLoading && <Alert type="loading" message="Searching across the catalog..." />}
                {error && <Alert type="error" message={error} />}
                {info && <Alert type="info" message={info} />}
              </div>
            </section>
          )}

          <section className="space-y-6" id="moods">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Tailored recommendations</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Tap a card to explore the synopsis, tone, and related picks.
                </p>
              </div>
              {recommendations.length > 0 && (
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-slate-300">
                  {recommendations.length} {recommendations.length === 1 ? 'match' : 'matches'}
                </span>
              )}
            </div>

            {hasMultipleResults ? (
              <div className="space-y-8">
                <BookGallery books={recommendations} onBookSelect={handleBookSelect} />
                <div className="flex justify-center">
                  <div className="glass-panel relative w-full overflow-hidden px-6 py-8 sm:px-10 sm:py-12" id="collections">
                    <div className="absolute inset-x-12 -top-32 h-56 rounded-full bg-gradient-to-br from-sky-400/30 via-fuchsia-500/30 to-transparent blur-3xl" aria-hidden="true" />
                    <div className="relative z-10">
                      <BookDetail book={activeBook} layout="full" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {noResults ? (
                  <Alert type="info" message="Describe a vibe, theme, or storyline above to see suggestions." />
                ) : (
                  <div className="flex justify-center">
                    <div className="glass-panel relative w-full max-w-4xl overflow-hidden px-6 py-8 sm:px-10 sm:py-12" id="collections">
                      <div className="absolute inset-x-12 -top-32 h-56 rounded-full bg-gradient-to-br from-sky-400/30 via-fuchsia-500/30 to-transparent blur-3xl" aria-hidden="true" />
                      <div className="relative z-10">
                        <BookDetail book={activeBook} layout="single" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        <footer className="mt-16 border-t border-white/10 pt-8 text-sm text-slate-400">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p>© {new Date().getFullYear()} Semantic Book Recommender. Built with semantic search &amp; sentiment analysis.</p>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
              <span>React</span>
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span>FastAPI</span>
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span>ChromaDB</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
