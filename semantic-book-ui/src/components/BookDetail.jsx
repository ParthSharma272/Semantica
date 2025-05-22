// src/components/BookDetail.jsx (Reverted to use div, img, headings, p and className)
import React from 'react';

const DEFAULT_COVER_URL = "https://via.placeholder.com/200x300.png?text=No+Cover";

function BookDetail({ book }) {
  if (!book) {
    // Add className for CSS targeting
    return <div className="book-detail placeholder">Select a book from the recommendations to see details.</div>;
  }

  const imageUrl = book.large_thumbnail && book.large_thumbnail !== 'cover-not-found.jpg'
                   ? book.large_thumbnail
                   : DEFAULT_COVER_URL;

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_COVER_URL;
  };

  const authors = book.authors ? book.authors.replace(/;/g, ', ') : 'N/A';

  return (
    // Add className for CSS targeting
    <div className="book-detail">
      <h2>Book Details</h2>
      {/* Add className for CSS targeting */}
      <div className="detail-content">
        {/* Add className for CSS targeting */}
        <img
          src={imageUrl}
          alt={`Cover of ${book.title}`}
          onError={handleImageError}
          className="detail-cover"
         />
         {/* Add className for CSS targeting */}
        <div className="detail-text">
          <h3>{book.title || 'N/A'}</h3>
          <p><strong>Authors:</strong> {authors}</p>
          <p><strong>Category:</strong> {book.simpler_categories || 'N/A'}</p>
          <p><strong>ISBN:</strong> {book.isbn13}</p>
          <hr />
          <p><strong>Description:</strong></p>
          <p>{book.description || 'No description available.'}</p>
        </div>
      </div>
    </div>
  );
}

export default BookDetail;