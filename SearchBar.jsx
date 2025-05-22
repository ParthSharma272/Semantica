// src/components/SearchBar.jsx (Reverted to use standard HTML)
import React, { useState } from 'react';

function SearchBar({
  onSearch,
  categories = [],
  tones = [],
  selectedCategory,
  onCategoryChange,
  selectedTone,
  onToneChange
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

  // No changes needed for handlers - they work with standard select event
  const handleCategorySelectChange = (event) => {
    onCategoryChange(event.target.value);
  };

  const handleToneSelectChange = (event) => {
    onToneChange(event.target.value);
  };

  return (
    // Add className for CSS targeting
    <form onSubmit={handleSubmit} className="search-bar-container">
      <h2>Find Your Next Read</h2>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Describe the kind of book you're looking for..."
        rows="3"
        required
      />
      {/* Add className for CSS targeting */}
      <div className="filters">
        {/* Add className for CSS targeting */}
        <div className="filter-group">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={handleCategorySelectChange} // Use direct handler
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        {/* Add className for CSS targeting */}
        <div className="filter-group">
          <label htmlFor="tone">Tone:</label>
          <select
            id="tone"
            value={selectedTone}
            onChange={handleToneSelectChange} // Use direct handler
          >
            {tones.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit">✨ Find Recommendations</button>
    </form>
  );
}

export default SearchBar;