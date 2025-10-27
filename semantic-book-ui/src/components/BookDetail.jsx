// New: src/components/BookDetail.jsx
import React from 'react';

const DEFAULT_COVER_URL = "https://via.placeholder.com/200x300.png?text=No+Cover";

// A small, reusable component for detail items
function DetailItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</span>
      <span className="text-xs font-medium text-slate-100">{value}</span>
    </div>
  );
}

function BookDetail({ book, layout = 'split' }) {
  // This is the "placeholder" state
  if (!book) {
    return (
      <div className="flex h-full min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-center text-sm text-slate-300">
        <p className="max-w-xs leading-relaxed">
          Explore the gallery and tap a book card to unlock synopsis, publication details, and similar vibes.
        </p>
      </div>
    );
  }

  // This is the "selected book" state
  const imageUrl = (book.large_thumbnail || book.thumbnail) && book.large_thumbnail !== 'cover-not-found.jpg'
                   ? (book.large_thumbnail || book.thumbnail)
                   : DEFAULT_COVER_URL;
  
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_COVER_URL;
  };
  
  const description = book.description || 'No description available.';
  const authors = Array.isArray(book.authors)
    ? (book.authors.length > 0 ? book.authors.join(', ') : null)
    : book.authors || 'Unknown Author';
  const resolvedAuthors = authors || 'Unknown Author';
  const categories = Array.isArray(book.categories)
    ? book.categories
    : book.categories
      ? String(book.categories)
          .split(',')
          .map((cat) => cat.trim())
          .filter(Boolean)
      : [];
  const purchaseLink =
    book.purchase_link ||
    book.buy_link ||
    book.amazon_url ||
    book.amazon_link ||
    (book.isbn13
      ? `https://www.amazon.com/s?k=${encodeURIComponent(book.isbn13)}`
      : book.isbn10
        ? `https://www.amazon.com/s?k=${encodeURIComponent(book.isbn10)}`
        : null);

  const isSplit = layout === 'split';
  const panelPadding = isSplit ? 'p-6 sm:p-8' : 'p-8 sm:p-10';
  const gridClasses = isSplit
    ? 'relative grid gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:gap-10 items-start'
    : 'relative grid gap-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-12 items-start';
  const coverClasses = isSplit
    ? 'relative mx-auto w-40 sm:w-48 overflow-hidden rounded-[26px] border border-white/20 bg-white/10 shadow-[0_25px_60px_-25px_rgba(15,23,42,0.8)] lg:mx-0'
    : 'relative mx-auto w-48 sm:w-56 lg:w-64 overflow-hidden rounded-[28px] border border-white/20 bg-white/10 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.85)] lg:mx-0';
  const headingClasses = isSplit
    ? 'text-2xl font-semibold tracking-tight text-white sm:text-[30px] sm:leading-tight'
    : 'text-3xl font-semibold tracking-tight text-white sm:text-[36px] sm:leading-tight';
  const metaGridClasses = isSplit
    ? 'grid grid-cols-2 gap-3 text-[11px] sm:text-sm'
    : 'grid grid-cols-2 gap-4 text-sm md:grid-cols-3';
  const buttonClasses = isSplit
    ? 'inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:shadow-rose-500/55 lg:w-auto'
    : 'inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-rose-500/35 transition hover:shadow-rose-500/55 sm:self-start';

  return (
    <div className="flex h-full flex-col gap-6">
      <div className={`relative overflow-hidden rounded-[32px] border border-white/12 bg-gradient-to-br from-indigo-500/25 via-slate-950/70 to-slate-950/40 ${panelPadding}`}>
        <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-white/20 opacity-40" aria-hidden="true" />
        <div className={gridClasses}>
          <div className={coverClasses}>
            <img
              src={imageUrl}
              alt={`Cover of ${book.title}`}
              onError={handleImageError}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-6 lg:gap-8">
            <div className={`space-y-4 ${isSplit ? 'text-center lg:text-left' : 'text-left'}`}>
              <h3 className={headingClasses}>
                {book.title || 'Unknown Title'}
              </h3>
              <p className={`${isSplit ? 'text-sm sm:text-base' : 'text-base'} font-medium text-slate-200`}>
                by {resolvedAuthors}
              </p>
              {categories.length > 0 && (
                <div className={`flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-200/85 ${isSplit ? 'justify-center lg:justify-start' : 'justify-start'}`}>
                  {categories.slice(0, 3).map((cat) => (
                    <span key={cat} className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={metaGridClasses}>
              <DetailItem label="ISBN-13" value={book.isbn13} />
              <DetailItem label="Published" value={book.published_date} />
              <DetailItem label="Publisher" value={book.publisher} />
              <DetailItem label="Pages" value={book.page_count} />
            </div>

            {purchaseLink && (
              <a
                href={purchaseLink}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses}
              >
                <span role="img" aria-label="shopping bag">🛒</span>
                Buy on Amazon
              </a>
            )}
          </div>
        </div>
      </div>

      <div className={`rounded-[28px] border border-white/12 bg-white/5 ${isSplit ? 'p-6 sm:p-7' : 'p-7 sm:p-9'}`}>
        <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Synopsis</h4>
        <p className={`mt-3 ${isSplit ? 'text-sm' : 'text-base leading-7'} text-slate-200/90 whitespace-pre-wrap` }>
          {description}
        </p>
      </div>
    </div>
  );
}

export default BookDetail;