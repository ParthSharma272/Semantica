// New: src/components/BookGallery.jsx
import React from 'react';
import BookCard from './BookCard';

function BookGallery({ books, onBookSelect }) {
  if (!books || books.length === 0) {
    return null; // App.jsx handles the main "no results" message
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
      {books.map((book) => (
        <li key={book.isbn13} className="h-full">
          <BookCard book={book} onSelect={onBookSelect} />
        </li>
      ))}
    </ul>
  );
}

export default BookGallery;