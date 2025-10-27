// New: src/components/BookCard.jsx
import React from 'react';

const DEFAULT_COVER_URL = "https://via.placeholder.com/200x300.png?text=No+Cover";

function BookCard({ book, onSelect }) {
  // Use the larger thumbnail if available
  const imageUrl = (book.large_thumbnail || book.thumbnail) && book.large_thumbnail !== 'cover-not-found.jpg'
                   ? (book.large_thumbnail || book.thumbnail)
                   : DEFAULT_COVER_URL;

  const handleImageError = (e) => {
    e.target.onerror = null; // Prevents infinite loops
    e.target.src = DEFAULT_COVER_URL;
  };

  const title = book.title || 'Unknown Title';
  const author = Array.isArray(book.authors)
    ? book.authors[0] || 'Unknown Author'
    : book.authors || 'Unknown Author';
  const normalizedCategories = Array.isArray(book.categories)
    ? book.categories
    : book.categories
      ? String(book.categories)
          .split(',')
          .map((cat) => cat.trim())
          .filter(Boolean)
      : [];
  const primaryCategory = normalizedCategories[0] || book.category;
  const moodTag = book.emotion || book.tone || book.mood;
  const synopsis = book.description || book.summary;

  return (
    <button
      onClick={() => onSelect(book)}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left shadow-lg shadow-slate-900/40 transition-transform duration-200 ease-out hover:-translate-y-1 hover:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
      aria-label={`View details for ${title} by ${author}`}
    >
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent opacity-80 transition group-hover:opacity-60" />
        <img
          src={imageUrl}
          alt={`Cover of ${title}`}
          onError={handleImageError}
          className="w-full aspect-[2/3] object-cover"
        />
        {(primaryCategory || moodTag) && (
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white">
            {primaryCategory && (
              <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 backdrop-blur-sm">
                {primaryCategory}
              </span>
            )}
            {moodTag && (
              <span className="rounded-full border border-white/20 bg-sky-500/30 px-3 py-1 backdrop-blur-sm">
                {moodTag}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-sm font-semibold leading-snug text-white line-clamp-2">
          {title}
        </p>
        <p className="text-xs text-slate-400 line-clamp-1">{author}</p>
        {synopsis && (
          <p className="mt-1 text-[11px] text-slate-400/80 line-clamp-3">
            {synopsis}
          </p>
        )}
      </div>
    </button>
  );
}

export default BookCard;