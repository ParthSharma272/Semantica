// src/App.jsx (Reverted to use divs and classNames)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import BookGallery from './components/BookGallery';
import BookDetail from './components/BookDetail';
import './App.css'; // Make sure App.css contains your custom styles now

const API_BASE_URL = 'http://localhost:8000';

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
      setError(null); // Clear error on fetching filters
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
    console.log('Searching with:', { query, category: selectedCategory, tone: selectedTone });
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
      setRecommendations(response.data.recommendations || []);
       if (!response.data.recommendations || response.data.recommendations.length === 0) {
           setInfo("No specific recommendations found matching your criteria. Try broadening your search!");
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

  // Using regular divs and classNames now
  return (
    <div className="App">
      <header>
        <h1>📚 Semantic Book Recommender</h1>
      </header>
      <main>
        <SearchBar
          onSearch={handleSearch}
          categories={filterOptions.categories}
          tones={filterOptions.tones}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedTone={selectedTone}
          onToneChange={setSelectedTone}
        />

        {isLoading && <div className="loading-indicator">⏳ Searching for books...</div>}
        {error && <div className="error-message">⚠️ {error}</div>}
        {info && !isLoading && recommendations.length === 0 && (
            <div className="info-message">{info}</div>
        )}

        {!isLoading && !error && (
          <div className="results-container">
             <section className="gallery-section">
                <h2>Recommendations</h2>
                <BookGallery books={recommendations} onBookSelect={handleBookSelect} />
             </section>
             <aside className="detail-section">
                 <BookDetail book={selectedBook} />
             </aside>
          </div>
        )}
         {!isLoading && !error && !info && recommendations.length === 0 && !selectedBook && <p className="info-message">Enter a search above to find books!</p>}

      </main>
      <footer>
        <p>Powered by React, FastAPI, ChromaDB, and Gemini</p>
      </footer>
    </div>
  );
}

export default App;