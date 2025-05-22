// src/components/BookGallery.jsx (Reverted to use div and className)
import React from 'react';
import BookCard from './BookCard';

function BookGallery({ books, onBookSelect }) {
  if (!books || books.length === 0) {
    // App.jsx handles the main "no results" message now
    return null;
  }

  return (
    // Add className for CSS targeting (e.g., for grid layout)
    <div className="book-gallery">
      {books.map((book) => (
        <BookCard key={book.isbn13} book={book} onSelect={onBookSelect} />
      ))}
    </div>
  );
}

export default BookGallery;