// New: src/components/SearchBar.jsx
import React, { useState } from 'react';

function SearchBar({
  onSearch,
  categories = [],
  tones = [],
  selectedCategory,
  onCategoryChange,
  selectedTone,
  onToneChange,
}) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    } else {
      alert("Please enter a search query.");
    }
  };

  const handleCategorySelectChange = (event) => {
    onCategoryChange(event.target.value);
  };

  const handleToneSelectChange = (event) => {
    onToneChange(event.target.value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-6"
      role="search"
      aria-labelledby="search-heading"
    >
      <div className="text-center space-y-3">
        <h2 id="search-heading" className="text-3xl font-semibold tracking-tight text-white">
          Describe the experience you want to read
        </h2>
        <p className="text-sm text-slate-300">
          Mention themes, pacing, emotional tone, or even how you want to feel when you close the final chapter.
        </p>
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-5 top-5 text-xl">🔍</span>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Example: an atmospheric mystery set in a coastal town with vivid prose and reflective characters"
          rows="4"
          required
          className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-14 py-5 text-base text-slate-100 shadow-inner shadow-black/40 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 placeholder:text-slate-500"
        />
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/5" aria-hidden="true" />
      </div>

      <button
        type="submit"
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
      >
        <span className="absolute inset-0 scale-[1.02] bg-white/10 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
        <span className="relative">Find Books</span>
      </button>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-[0.8rem] font-semibold uppercase tracking-[0.3em] text-slate-200">
            Category
          </label>
          <div className="relative">
            <select
              id="category"
              value={selectedCategory}
              onChange={handleCategorySelectChange}
              className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-100 shadow-inner shadow-black/30 transition focus:border-sky-400 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">⌄</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="tone" className="text-[0.8rem] font-semibold uppercase tracking-[0.3em] text-slate-200">
            Tone
          </label>
          <div className="relative">
            <select
              id="tone"
              value={selectedTone}
              onChange={handleToneSelectChange}
              className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-100 shadow-inner shadow-black/30 transition focus:border-sky-400 focus:outline-none"
            >
              {tones.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">⌄</span>
          </div>
        </div>
      </div>
    </form>
  );
}

export default SearchBar;