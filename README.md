# Semantic Book Recommender 📚
A book recommendation system that combines semantic search with to provide personalized book suggestions based on natural language queries and filtering.

# Features:
- Natural Language Search: Users can describe the kind of book they're looking for in plain English
- Semantic Understanding: Utilizes OpenAI embeddings for intelligent book matching
- Emotional Analysis: Books are classified by emotional tone (Happy, Surprising, Angry, Suspenseful, Sad)
- Category Filtering: Filter recommendations by fiction/non-fiction categories
- Interactive UI: Clean, modern interface built with Gradio
- Large Dataset: Powered by a curated dataset of over 5,000 books with rich metadata

# Technical Stack:
- Backend: Python with LangChain for vector search
- Embeddings: OpenAI Embeddings
- Vector Store: Chroma DB
- Emotion Analysis: DistilRoBERTa for text classification
- UI Framework: Gradio
- Data Processing: Pandas & NumPy

# Data Pipeline:
1.Initial data cleaning and preprocessing
2.Fiction/Non-fiction classification using zero-shot learning
3.Emotional tone analysis using DistilRoBERTa
4.Vector embeddings generation for semantic search
5.Integration with Chroma vector store

# Key Components
- Data Processing
- Sentiment Analysis
- Recommendation Engine


# Getting Started:
- Clone the repository
- Install dependencies: pip install -r requirements.txt
- Create a .env file with your OpenAI API key
- Run the dashboard: python gradio-dashboard.py

Acknowledgments
Tutorial from freecodecamp.org: https://www.youtube.com/watch?v=Q7mS1VHm3Yw&ab_channel=freeCodeCamp.org
Book metadata sourced from Kaggle dataset: https://www.kaggle.com/datasets/dylanjcastillo/7k-books-with-metadata
Emotion analysis model by J. Hartmann
Built with OpenAI's embedding technology
