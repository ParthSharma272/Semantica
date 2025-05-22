// src/components/BookCard.jsx (Reverted to use div, img, p and className)
import React from 'react';

const DEFAULT_COVER_URL = "https://via.placeholder.com/150x220.png?text=No+Cover";

function BookCard({ book, onSelect }) {
  const imageUrl = book.large_thumbnail && book.large_thumbnail !== 'cover-not-found.jpg'
                   ? book.large_thumbnail
                   : DEFAULT_COVER_URL;

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_COVER_URL;
  };

  const title = book.title || 'Unknown Title';

  return (
    // Add className for CSS targeting
    <div className="book-card" onClick={() => onSelect(book)}>
      <img
        src={imageUrl}
        alt={`Cover of ${title}`}
        onError={handleImageError}
      />
      {/* Add className for CSS targeting */}
      <p className="book-card-title">{title ? (title.length > 40 ? `${title.substring(0, 37)}...` : title) : 'Unknown Title'}</p>
    </div>
  );
}

export default BookCard;