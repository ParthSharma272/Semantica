import time
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
import html
import logging # Use logging instead of print for server messages

# --- FastAPI Imports ---
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# --- Core Imports ---
import chromadb
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

# --- Configuration & Security ---
load_dotenv(override=True)
logging.basicConfig(level=logging.INFO) # Configure logging
 
if not os.getenv("GOOGLE_API_KEY"):
    logging.critical("CRITICAL ERROR: GOOGLE_API_KEY environment variable not found.")
    # In a real API, you might handle this more gracefully, but exiting is fine for dev
    exit()

# --- Constants ---
BOOKS_CSV_PATH = "books_with_emotions.csv"
DEFAULT_COVER = "cover-not-found.jpg" # Ideally, host this image somewhere accessible online
PERSIST_DIRECTORY = "db-books"
COLLECTION_NAME = "books"
# Make sure this matches the model you used for embedding
GEMINI_MODEL_NAME = "models/gemini-embedding-exp-03-07" # Use the stable embedding model unless you have specific needs for exp

# --- Load Book Metadata ---
try:
    books = pd.read_csv(BOOKS_CSV_PATH)
    # Precompute large thumbnail URL if needed, handle NaNs
    books["large_thumbnail"] = books["thumbnail"].apply(lambda x: f"{x}&fife=w800" if pd.notna(x) else DEFAULT_COVER)
    books['isbn13'] = books['isbn13'].astype(str)

    # Ensure required columns exist
    required_cols = ['title', 'authors', 'description', 'large_thumbnail', 'isbn13', 'simpler_categories', 'joy', 'surprise', 'anger', 'fear', 'sadness']
    if not all(col in books.columns for col in required_cols):
        missing = [col for col in required_cols if col not in books.columns]
        logging.error(f"Error: CSV missing one or more required columns: {missing}")
        exit()
    logging.info(f"Successfully loaded book metadata from {BOOKS_CSV_PATH}")
except FileNotFoundError:
    logging.error(f"Error: Books metadata file not found at {BOOKS_CSV_PATH}")
    exit()
except Exception as e:
    logging.error(f"Error loading or processing {BOOKS_CSV_PATH}: {e}")
    exit()

# --- Initialize Embeddings and Connect to Vector Store ---
collections = None # Initialize collections to None
try:
    logging.info(f"Initializing Gemini Embeddings model: {GEMINI_MODEL_NAME}")
    gemini_embeddings = GoogleGenerativeAIEmbeddings(model=GEMINI_MODEL_NAME)

    logging.info(f"Connecting to persistent ChromaDB at: {PERSIST_DIRECTORY}")
    chroma_client = chromadb.PersistentClient(path=PERSIST_DIRECTORY)

    logging.info(f"Getting collection: {COLLECTION_NAME}")
    # Check if collection exists before creating Chroma object (Corrected for Chroma v0.6+)
    existing_collection_names = chroma_client.list_collections() # Get the list of names directly
    if COLLECTION_NAME in existing_collection_names:             # Check if our name is in the list
        collections = Chroma(
            client=chroma_client,
            collection_name=COLLECTION_NAME,
            embedding_function=gemini_embeddings,
        )
        logging.info(f"Successfully connected to collection '{COLLECTION_NAME}'.")
        # It's generally safer to access count via the client if the Chroma object might not be fully initialized
        # although accessing _collection should work once the Chroma object is created.
        try:
             chroma_collection_obj = chroma_client.get_collection(COLLECTION_NAME)
             count = chroma_collection_obj.count()
             # Alternatively, using the langchain object if confirmed safe:
             # count = collections._collection.count()
             if count > 0:
                 logging.info(f"Collection '{COLLECTION_NAME}' contains {count} documents.")
             else:
                 logging.warning(f"Warning: Collection '{COLLECTION_NAME}' exists but is empty.")
        except Exception as e:
             logging.error(f"Could not get count for collection '{COLLECTION_NAME}': {e}")

    else:
         logging.error(f"Error: Collection '{COLLECTION_NAME}' not found in ChromaDB. Please run the embedding script first.")
         exit() # Exit if collection is essential

except Exception as e:
    logging.error(f"Error initializing embeddings or connecting to Chroma DB: {e}")
    exit() # Exit if core components fail

# --- Recommendation Logic (Keep your core function) ---
def retrieve_semantic_recommendations(
    query: str,
    category: str = "All",
    tone: str = "All",
    initial_top_k: int = 50,
    final_top_k: int = 12,
) -> pd.DataFrame:
    if collections is None:
        logging.error("Chroma collection not available for search.")
        # Return empty DataFrame or raise an exception handled by the API layer
        return pd.DataFrame()
    if not query:
        return pd.DataFrame()

    logging.info(f"Retrieving recommendations for query: '{query}', category: '{category}', tone: '{tone}'")
    start_time = time.time()
    try:
        recs = collections.similarity_search(query, k=initial_top_k)
    except Exception as e:
        logging.error(f"Error during similarity search: {e}")
        # Re-raise or return empty df based on desired API behavior
        return pd.DataFrame() # Return empty on error

    if not recs:
        logging.info("No initial results from similarity search.")
        return pd.DataFrame()

    # --- Improved ID Parsing (More Robust) ---
    books_list = []
    for rec in recs:
        try:
            # Assuming the ID is the first 'word' in page_content
            # This might still need adjustment based on how you stored docs
            potential_id = rec.page_content.strip().split()[0]
            # Basic check if it looks like an ISBN13 (numeric, specific lengths)
            if potential_id.isdigit() and (len(potential_id) == 13 or len(potential_id) == 10):
                 books_list.append(potential_id)
            # Add more specific checks if needed based on your content format
        except IndexError:
            logging.warning(f"Could not parse ID from page_content: {rec.page_content[:50]}...")
            continue # Ignore if parsing fails

    if not books_list:
        logging.warning("No valid book IDs extracted from search results.")
        return pd.DataFrame()

    # Convert list to strings for matching (already done in CSV loading)
    book_recs = books[books["isbn13"].isin(books_list)].copy()

    if book_recs.empty:
        logging.info("No matching books found in metadata for the retrieved IDs.")
        return pd.DataFrame()

    # Apply category filter
    if category != "All" and 'simpler_categories' in book_recs.columns:
         # Handle potential missing category data gracefully
         original_count = len(book_recs)
         book_recs = book_recs[book_recs["simpler_categories"].fillna('') == category]
         logging.info(f"Filtered by category '{category}': {original_count} -> {len(book_recs)} results.")


    # Apply tone sorting
    sort_column = None
    if tone == "Happy": sort_column = "joy"
    elif tone == "Surprising": sort_column = "surprise"
    elif tone == "Angry": sort_column = "anger"
    elif tone == "Suspenseful": sort_column = "fear"
    elif tone == "Sad": sort_column = "sadness"

    if sort_column and sort_column in book_recs.columns:
        # Handle potential missing emotion data gracefully
        book_recs = book_recs.sort_values(by=sort_column, ascending=False, na_position='last')
        logging.info(f"Sorted results by tone '{tone}' (column: {sort_column}).")
    elif tone != "All":
        logging.warning(f"Tone '{tone}' selected, but corresponding column '{sort_column}' not found or not applicable.")


    final_results = book_recs.head(final_top_k)
    end_time = time.time()
    logging.info(f"Retrieved {len(final_results)} recommendations in {end_time - start_time:.2f}s.")
    return final_results

# --- FastAPI Application ---
app = FastAPI(
    title="Semantic Book Recommender API",
    description="API to get book recommendations based on semantic search.",
    version="1.0.0",
)

# --- CORS Middleware ---
# Allows your React app (running on a different port) to call the API
origins = [
    "http://localhost:3000", # Default React dev port
    "http://localhost:5173",
    "http://localhost:5174",# Default Vite dev port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Request/Response Models (using Pydantic) ---
class RecommendationRequest(BaseModel):
    query: str
    category: Optional[str] = "All"
    tone: Optional[str] = "All"
    # You could add top_k here if you want the client to control it
    # final_top_k: Optional[int] = 12

class Book(BaseModel):
    # Define the structure of the book data you want to send to the frontend
    isbn13: str
    title: Optional[str] = None
    authors: Optional[str] = None
    description: Optional[str] = None
    large_thumbnail: Optional[str] = None
    simpler_categories: Optional[str] = None
    # Include emotion scores if the frontend needs them, otherwise omit
    # joy: Optional[float] = None
    # surprise: Optional[float] = None
    # anger: Optional[float] = None
    # fear: Optional[float] = None
    # sadness: Optional[float] = None

class RecommendationResponse(BaseModel):
    recommendations: List[Book]

# --- API Endpoints ---
@app.get("/")
async def read_root():
    return {"message": "Welcome to the Semantic Book Recommender API!"}

@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest = Body(...)):
    """
    Endpoint to get book recommendations based on a query, category, and tone.
    """
    if not request.query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        results_df = retrieve_semantic_recommendations(
            query=request.query,
            category=request.category,
            tone=request.tone,
            # final_top_k=request.final_top_k # Use if added to request model
        )

        if results_df.empty:
            return RecommendationResponse(recommendations=[])

        # Convert DataFrame to list of dictionaries/Pydantic models
        # Fill NaN values with None for JSON compatibility
        results_df_filled = results_df.where(pd.notna(results_df), None)
        results_list = results_df_filled.to_dict(orient="records")

        # Validate with Pydantic model (optional but good practice)
        validated_results = [Book(**item) for item in results_list]

        return RecommendationResponse(recommendations=validated_results)

    except RuntimeError as e:
        logging.error(f"Runtime error during recommendation: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
    except Exception as e:
        logging.error(f"Unexpected error during recommendation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

# --- Add endpoint to get filters (Optional but recommended) ---
@app.get("/filters")
async def get_filters():
    """
    Endpoint to provide available categories and tones for dropdowns.
    """
    try:
        # Extract unique categories from the loaded DataFrame
        unique_categories = books["simpler_categories"].dropna().unique()
        categories = ["All"] + sorted(list(unique_categories))
        tones = ["All", "Happy", "Surprising", "Angry", "Suspenseful", "Sad"]
        return {"categories": categories, "tones": tones}
    except Exception as e:
        logging.error(f"Error retrieving filters: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not retrieve filter options.")


# --- Run the API server (when script is executed directly) ---
if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server...")
    # Make sure the API only starts if the collection is loaded
    if collections is not None and os.getenv("GOOGLE_API_KEY"):
         uvicorn.run(app, host="0.0.0.0", port=8000)
    elif collections is None:
         print("\nServer start aborted - Chroma collection issue.")
    else:
         print("\nServer start aborted - GOOGLE_API_KEY missing.")
