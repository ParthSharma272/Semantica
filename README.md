# Semantic Book Recommender

A personalized book recommendation system that combines semantic search and advanced filtering to suggest books based on natural language queries.

## Screenshot

<img width="613" alt="Screenshot 2025-05-22 at 11 23 51 AM" src="https://github.com/user-attachments/assets/dee61a1f-8ec2-4536-8d37-50e2e62617a0" />


## Features

- **Natural Language Search**: Describe the kind of book you're looking for in plain English.
- **Semantic Understanding**: Utilizes OpenAI embeddings for intelligent book matching.
- **Emotional Analysis**: Books are classified by emotional tone (Happy, Surprising, Angry, Suspenseful, Sad).
- **Category Filtering**: Filter recommendations by fiction or non-fiction.
- **Interactive UI**: Clean, modern interface built with Gradio.
- **Large Dataset**: Powered by a curated dataset of over 5,000 books with rich metadata.

## Technical Stack

- **Backend**: Python with LangChain for vector search
- **Embeddings**: HuggingFace Embeddings
- **Vector Store**: Chroma DB
- **Emotion Analysis**: DistilRoBERTa for text classification
- **UI Framework**: Gradio
- **Data Processing**: Pandas & NumPy

## Data Pipeline

1. Initial data cleaning and preprocessing
2. Fiction/Non-fiction classification using zero-shot learning
3. Emotional tone analysis using DistilRoBERTa
4. Vector embeddings generation for semantic search
5. Integration with Chroma vector store

## Key Components

- **Data Processing**
- **Sentiment Analysis**
- **Recommendation Engine**

