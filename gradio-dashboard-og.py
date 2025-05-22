import time
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
import html  # For escaping potentially problematic characters in HTML

# --- Core Imports ---
import chromadb
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
import gradio as gr

# --- Configuration & Security ---
load_dotenv(override=True)
if not os.getenv("GOOGLE_API_KEY"):
    print("CRITICAL ERROR: GOOGLE_API_KEY environment variable not found.")
    exit()

# --- Constants ---
BOOKS_CSV_PATH = "books_with_emotions.csv"
DEFAULT_COVER = "cover-not-found.jpg" # Path/URL to default image
PERSIST_DIRECTORY = "db-books"
COLLECTION_NAME = "books"
GEMINI_MODEL_NAME = "models/gemini-embedding-exp-03-07"

# --- Load Book Metadata ---
try:
    books = pd.read_csv(BOOKS_CSV_PATH)
    books["large_thumbnail"] = books["thumbnail"] + "&fife=w800"
    books["large_thumbnail"] = np.where(
        books["large_thumbnail"].isna(),
        DEFAULT_COVER,
        books["large_thumbnail"],
    )
    books['isbn13'] = books['isbn13'].astype(str)
    # Ensure required columns exist for card display
    required_cols = ['title', 'authors', 'description', 'large_thumbnail', 'isbn13', 'simpler_categories', 'joy', 'surprise', 'anger', 'fear', 'sadness']
    if not all(col in books.columns for col in required_cols):
        print(f"Error: CSV missing one or more required columns: {required_cols}")
        exit()

except FileNotFoundError:
    print(f"Error: Books metadata file not found at {BOOKS_CSV_PATH}")
    exit()
except Exception as e:
    print(f"Error loading or processing {BOOKS_CSV_PATH}: {e}")
    exit()

# --- Initialize Embeddings and Connect to Vector Store ---
# (Same as before, includes check for collection existence)
try:
    print(f"Initializing Gemini Embeddings model: {GEMINI_MODEL_NAME}")
    gemini_embeddings = GoogleGenerativeAIEmbeddings(model=GEMINI_MODEL_NAME)

    print(f"Connecting to persistent ChromaDB at: {PERSIST_DIRECTORY}")
    chroma_client = chromadb.PersistentClient(path=PERSIST_DIRECTORY)

    print(f"Getting collection: {COLLECTION_NAME}")
    try:
         chroma_client.get_collection(COLLECTION_NAME)
         collection_exists = True
    except Exception:
         collection_exists = False
         print(f"Warning: Collection '{COLLECTION_NAME}' not found in ChromaDB.")
         # exit() # Decide whether to exit

    if collection_exists:
        collections = Chroma(
            client=chroma_client,
            collection_name=COLLECTION_NAME,
            embedding_function=gemini_embeddings,
        )
        print(f"Successfully connected to collection '{COLLECTION_NAME}'.")
        count = collections._collection.count()
        if count > 0:
             print(f"Collection '{COLLECTION_NAME}' contains {count} documents.")
        else:
             print(f"Warning: Collection '{COLLECTION_NAME}' exists but is empty.")
    else:
        collections = None
        print("Continuing without a valid collection. Search will fail.")

except Exception as e:
    print(f"Error initializing embeddings or connecting to Chroma DB: {e}")
    exit()

# --- Recommendation Logic ---
# (Retrieve function remains largely the same, still has fragile ID parsing)
def retrieve_semantic_recommendations(
        query: str,
        category: str = "All",
        tone: str = "All",
        initial_top_k: int = 50, # Fetch more initially for better filtering
        final_top_k: int = 12, # Display fewer cards initially
) -> pd.DataFrame:

    if collections is None:
        raise RuntimeError("Chroma collection not available for search.")
    if not query:
        return pd.DataFrame()

    print(f"Retrieving recommendations for query: '{query}', category: '{category}', tone: '{tone}'")
    try:
        recs = collections.similarity_search(query, k=initial_top_k)
    except Exception as e:
        print(f"Error during similarity search: {e}")
        raise RuntimeError(f"Similarity search failed: {e}")

    if not recs: return pd.DataFrame()

    # --- >>> CRITICAL WARNING <<< --- ID PARSING LOGIC (Fragile)
    books_list = []
    for rec in recs:
        try:
            book_id_str = rec.page_content.strip().split()[0].strip('"')
            books_list.append(book_id_str)
        except Exception: continue # Ignore if parsing fails

    if not books_list: return pd.DataFrame()

    book_recs = books[books["isbn13"].isin(books_list)].copy()
    if book_recs.empty: return pd.DataFrame()

    # Apply category filter
    if category != "All":
        book_recs = book_recs[book_recs["simpler_categories"] == category]

    # Apply tone sorting
    if tone == "Happy": book_recs = book_recs.sort_values(by="joy", ascending=False)
    elif tone == "Surprising": book_recs = book_recs.sort_values(by="surprise", ascending=False)
    elif tone == "Angry": book_recs = book_recs.sort_values(by="anger", ascending=False)
    elif tone == "Suspenseful": book_recs = book_recs.sort_values(by="fear", ascending=False)
    elif tone == "Sad": book_recs = book_recs.sort_values(by="sadness", ascending=False)

    return book_recs.head(final_top_k)

# --- Format Recommendations for Gallery Component ---
def format_recommendations_for_gallery(recommendations: pd.DataFrame) -> list:
    """Formats DataFrame results into a list of tuples for gr.Gallery."""
    gallery_items = []
    if recommendations.empty:
        return gallery_items
    for _, row in recommendations.iterrows():
        thumbnail = str(row.get("large_thumbnail", DEFAULT_COVER))
        title = str(row.get("title", "Unknown"))
        # Gallery captions are simple strings
        caption = f"{title[:35]}..." if len(title) > 35 else title # Shorter caption
        gallery_items.append((thumbnail, caption))
    return gallery_items
# --- Format Single Book Details for Markdown Display ---
def format_details_for_markdown(book_data: pd.Series) -> str:
    """Formats a row (Series) of book data into Markdown for detail view."""
    if book_data is None or book_data.empty:
        return "Select a book from the gallery above to see details."

    title = html.escape(str(book_data.get("title", "N/A")))
    authors = html.escape(str(book_data.get("authors", "N/A")))
    authors_formatted = authors.replace(";", ", ")
    description = html.escape(str(book_data.get("description", "No description available.")))
    category = html.escape(str(book_data.get("simpler_categories", "N/A")))

    # Basic Markdown formatting
    markdown_string = f"""
**{title}**

*by {authors_formatted}*

**Category:** {category}

---

**Description:**

{description}
"""
    return markdown_string

# --- UX Wrapper for Button Click (Modified for Gallery and State) ---
def recommend_books_wrapper(query: str, category: str, tone: str):
    start_time = time.time()
    # Update button, clear gallery and detail view immediately
    yield {
        submit_button: gr.update(value="⏳ Searching...", interactive=False),
        output_gallery: None, # Clear gallery
        detail_markdown: "Loading recommendations...", # Show loading in detail area
        detail_image: None,
        last_results_state: None # Clear previous results state
    }

    try:
        recommendations_df = retrieve_semantic_recommendations(query, category, tone)

        if recommendations_df.empty:
            print("Wrapper: No recommendations found.")
            gr.Info("No specific recommendations found matching all criteria.")
            yield {
                output_gallery: [], # Show empty gallery
                submit_button: gr.update(value="✨ Find Recommendations", interactive=True),
                detail_markdown: "No recommendations found. Try adjusting your search.",
                detail_image: None,
                last_results_state: pd.DataFrame() # Store empty dataframe
            }
        else:
            gallery_items = format_recommendations_for_gallery(recommendations_df)
            print(f"Retrieved {len(recommendations_df)} recommendations in {time.time() - start_time:.2f}s.")
            yield {
                output_gallery: gallery_items,
                submit_button: gr.update(value="✨ Find Recommendations", interactive=True),
                detail_markdown: "Select a book from the gallery above to see details.", # Prompt user
                detail_image: None, # Clear image until selection
                last_results_state: recommendations_df # Store results DataFrame in State
            }

    except Exception as e:
        error_message = f"An error occurred: {e}"
        print(f"Wrapper: {error_message}")
        gr.Error(error_message)
        yield {
             output_gallery: [],
             submit_button: gr.update(value="Error! Try Again", interactive=True),
             detail_markdown: f"<p style='color: red;'>Error generating recommendations.</p>",
             detail_image: None,
             last_results_state: None
        }
# --- Function to Show Details on Gallery Select ---
def show_book_details(results_df: pd.DataFrame, evt: gr.SelectData):
    """
    Triggered when a user selects an item in the gallery.
    Updates the detail view components.
    """
    if results_df is None or results_df.empty:
        # Should not happen if selection is made, but good practice
        return {detail_image: None, detail_markdown: "No results to select from."}

    selected_index = evt.index
    if 0 <= selected_index < len(results_df):
        selected_book_data = results_df.iloc[selected_index] # Get the Series for the selected row

        # Get data for detail view components
        image_url = selected_book_data.get("large_thumbnail", DEFAULT_COVER)
        details_md = format_details_for_markdown(selected_book_data)

        return {
            detail_image: gr.update(value=image_url),
            detail_markdown: gr.update(value=details_md)
        }
    else:
        # Index out of bounds, shouldn't happen with valid SelectData
        print(f"Warning: Invalid index {selected_index} selected.")
        return {detail_image: None, detail_markdown: "Error retrieving details."}
    
# --- Custom CSS for Aesthetics ---
# (Significantly expanded for card layout and Goodreads feel)
# --- Custom CSS for Aesthetics (Revised Light Theme) ---

custom_css =  """

@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&family=Noto+Serif:wght@400;700&display=swap');

/* --- Base & Layout --- */
/* Colors derived from the user-provided theme CSS */
html, body {
    font-family: 'Noto Sans', sans-serif !important;
    /* Using --background-fill-secondary -> --neutral-50 */
    background-color: #fafafa !important;
    /* Using --body-text-color */
    color: #fafafa !important;
    margin: 0 !important; padding: 0 !important;
    box-sizing: border-box !important;
}
*, *:before, *:after {
    box-sizing: inherit !important;
}

.gradio-container {
    padding: 30px 4% !important;
    background-color: transparent !important;
    box-shadow: none !important;
    border: none !important;
    width: 100% !important;
}
.gradio-container .app, .gradio-container .contain {
     background-color: transparent !important;
}


/* --- Typography --- */
/* Using a darker neutral like --neutral-800 for headings */
h1, h2, h3, h4, h5, h6, .book-title { font-family: cursive, serif; color: #27272a !important; }
/* Using --body-text-color */
p, label, span, button, input, textarea, .book-author, .book-desc, .book-category { font-family: 'Noto Sans', sans-serif; color: black !important; line-height: 1.6; }


/* --- Header --- */
#main-title h1 { text-align: center; font-size: 2.5em; font-weight: 700; margin-bottom: 40px; color: #27272a !important; }


/* --- Input Area --- */
#input-group {
    /* Using --background-fill-primary -> white */
    background-color: white !important;
    padding: 35px !important;
    border-radius: 10px !important;
    /* Using --border-color-primary -> --neutral-200 */
    border: 1px solid #e4e4e7 !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06) !important;
    margin-bottom: 35px !important;
    max-width: 1100px; margin-left: auto; margin-right: auto;
}
/* Force label styling */
#input-group label, .gradio-input-label {
    font-weight: 500 !important;
    margin-bottom: 10px !important;
    /* Using --neutral-500 */
    color: #71717a !important;
    background-color: transparent !important;
    padding: 0 !important; border: none !important;
}
/* Force input field styling */
.gradio-textbox textarea, .gradio-dropdown input, .gradio-dropdown .wrap input {
    background-color: white !important; /* --input-background-fill */
    /* Using --input-border-color -> --neutral-200 */
    border: 1px solid #e4e4e7 !important;
    border-radius: 6px !important; /* --input-radius */
    padding: 12px 15px !important; /* Custom padding */
    font-size: 1em !important;
    /* Using a dark neutral for input text */
    color: #18181b !important;
    -webkit-text-fill-color: #18181b !important;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
/* Force placeholder text styling */
/* Using --input-placeholder-color -> --neutral-400 */
.gradio-textbox textarea::placeholder { color: #bbbbc2 !important; opacity: 1 !important; }
/* Force dropdown selected text color */
.gradio-dropdown .single-select, .gradio-dropdown .wrap-inner .single-select span {
    color: #18181b !important; /* Match input text color */
    background-color: transparent !important;
}
/* Input focus state */
.gradio-textbox textarea:focus, .gradio-dropdown input:focus {
    /* Using --input-border-color-focus -> --secondary-300 */
    border-color: #93c5fd !important;
    /* Using color derived from --secondary-100 for glow */
    box-shadow: 0 0 0 3px rgba(219, 234, 254, 0.5) !important;
    outline: none !important;
}


/* --- Button --- */
#submit-button {
    font-weight: 600; font-size: 1.1em; border-radius: 8px; padding: 14px 35px;
    /* Using --button-primary-background-fill -> --primary-500 */
    background-color: #f97316 !important;
    /* Using --button-primary-text-color -> white */
    color: white !important;
    border: none !important;
    box-shadow: 0 2px 5px rgba(0,0,0,0.15) !important;
    transition: background-color 0.3s ease, transform 0.15s ease, box-shadow 0.3s ease;
    display: block; margin: 30px auto 40px auto; max-width: 300px; width: auto; cursor: pointer;
}
#submit-button:hover {
    /* Using --button-primary-background-fill-hover -> --primary-600 */
    background-color: #ea580c !important;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
    transform: translateY(-2px);
}
#submit-button:disabled {
    /* Using --primary-100 for background */
    background-color: #ffedd5 !important;
    /* Using --neutral-400 for text */
    color: #bbbbc2 !important;
    box-shadow: none !important;
    transform: none !important;
    cursor: not-allowed !important;
}


/* --- Results Area --- */
#recommendations-title h2 { text-align: center; color: #27272a !important; margin-bottom: 25px; font-weight: 600; }
#output_gallery {
    background-color: white !important; /* --background-fill-primary */
    border: 1px solid #e4e4e7 !important; /* --border-color-primary */
    border-radius: 10px !important;
    padding: 15px !important;
    min-height: 200px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.04) !important;
}
#output_gallery .thumbnail-item {
    border: 1px solid #e4e4e7 !important; /* --border-color-primary */
    border-radius: 6px !important;
    background-color: #fff !important;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    cursor: pointer;
    transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
}
 #output_gallery .thumbnail-item:hover {
     /* Using --primary-500 */
     border-color: #f97316 !important;
     box-shadow: 0 5px 15px rgba(0,0,0,0.12) !important;
     transform: translateY(-3px) scale(1.02);
 }
 #output_gallery .thumbnail-item.selected {
     /* Using --primary-500 */
     border-color: #f97316 !important;
     /* Using glow derived from --primary-300 */
     box-shadow: 0 0 0 4px rgba(253, 186, 116, 0.3) !important;
     transform: scale(1.01);
 }
#output_gallery .caption {
    font-size: 0.88em !important;
    /* Using --neutral-500 */
    color: #71717a !important;
    padding: 8px 5px !important;
    text-align: center !important;
    /* Using --neutral-50 */
    background-color: #fafafa !important;
    border-top: 1px solid #eee; /* Keeping light separator */
}

/* --- Detail Area Styling --- */
#detail-area {
    background-color: white !important; /* --background-fill-primary */
    border: 1px solid #e4e4e7 !important; /* --border-color-primary */
    margin-top: 35px !important; padding: 30px !important;
    border-radius: 10px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06) !important;
    transition: all 0.3s ease-in-out;
}
#detail-area h2 { color: #3b3b43 !important; font-size: 1.6em !important; margin-top: 0 !important; margin-bottom: 25px !important; text-align: center !important; }
#detail-image img {
    display: block; margin: 0 auto 25px auto; max-width: 250px; height: auto;
    border-radius: 8px;
    border: 1px solid #eee;
    box-shadow: 0 3px 7px rgba(0,0,0,0.1);
}
#detail-markdown { line-height: 1.7; }
/* Using --neutral-800 */
#detail-markdown h3 { font-family: 'Noto Serif', serif; color: #27272a !important; margin-top: 0px; margin-bottom: 8px; font-size: 1.45em; }
/* Using --body-text-color */
#detail-markdown p { margin-bottom: 15px; color: #3b3b43 !important; }
/* Using a darker neutral */
#detail-markdown strong { font-weight: 700 !important; color: #18181b !important; }
/* Using --neutral-500 */
#detail-markdown em { color: #71717a !important; font-style: italic;}
#detail-markdown hr { border: none !important; border-top: 1px solid #eaeaea !important; margin: 25px 0 !important; }
#detail-markdown code {
    /* Using --code-background-fill -> --neutral-100 */
    background-color: #f4f4f5 !important;
    /* Using --primary-700 for contrast */
    color: #c2410c !important;
    padding: 3px 6px !important;
    border-radius: 4px !important;
    font-size: 0.92em !important;
    font-family: monospace;
}


/* --- Responsive Adjustments --- (Keep existing structure) */
@media (max-width: 1024px) {
    #output_gallery { columns: 4 !important; }
    #detail-image img { max-width: 220px !important; }
}
@media (max-width: 768px) {
    .gradio-container { padding: 20px 3% !important; }
    #main-title h1 { font-size: 2.2em !important; margin-bottom: 30px; }
    #input-group, #detail-area { padding: 25px !important; border-radius: 8px !important; }
    #output_gallery { columns: 3 !important; padding: 10px !important; border-radius: 8px !important; }
    #detail-image img { max-width: 180px !important; }
    #detail-markdown { font-size: 0.98em !important; }
}
@media (max-width: 600px) {
    #output_gallery { columns: 2 !important; }
    #detail-image img { max-width: 150px !important; }
    #input-group label, .gradio-input-label { font-size: 0.95em; }
    #submit-button { padding: 12px 30px; font-size: 1em; }
}
@media (max-width: 480px) {
    .gradio-container { padding: 15px 2% !important; }
    #main-title h1 { font-size: 1.9em !important; }
    #input-group, #detail-area { padding: 20px !important; }
    #output_gallery { columns: 2 !important; gap: 8px; }
     #output_gallery .thumbnail-item { border-radius: 4px; }
    #detail-image img { max-width: 130px !important; }
     #detail-markdown { font-size: 0.92em !important; line-height: 1.6; }
     #detail-markdown h3 { font-size: 1.3em; }
     #detail-markdown p { margin-bottom: 12px; }
}
"""
# --- Gradio UI Definition (Using Gallery + Detail View) ---
unique_categories = books["simpler_categories"].dropna().unique()
categories = ["All"] + sorted(list(unique_categories))
tones = ["All"] + ["Happy", "Surprising", "Angry", "Suspenseful", "Sad"]

with gr.Blocks(theme=gr.themes.Default(), css=custom_css) as dashboard:
    # State to store the latest recommendation results (DataFrame)
    last_results_state = gr.State(value=None) # Initialize with None

    gr.Markdown("# Find Your Next Great Read", elem_id="main-title")

    with gr.Group(elem_id="input-group"):
        with gr.Row():
            with gr.Column(scale=3):
                 user_query = gr.Textbox(
                     label="Describe the kind of book you're looking for:",
                     placeholder="e.g., a fast-paced sci-fi adventure with a strong female lead",
                     lines=3, elem_id="user_query_box"
                )
            with gr.Column(scale=1, min_width=180):
                category_dropdown = gr.Dropdown(choices=categories, label="Filter by Category:", value="All")
                tone_dropdown = gr.Dropdown(choices=tones, label="Filter by Tone:", value="All")

    with gr.Row():
         submit_button = gr.Button("✨ Find Recommendations", variant="primary", elem_id="submit_button")

    # --- Results Display ---
    gr.Markdown("## Recommendations", elem_id="recommendations-title")
    output_gallery = gr.Gallery(
        label="Recommended Books (Click to see details)",
        columns=6, # Initial columns count
        rows=2,
        object_fit="contain",
        height=500, # Fixed height or "auto"
        preview=False, # Disable Gradio's built-in preview
        elem_id="output_gallery"
    )

    # --- Detail Display Area ---
    with gr.Group(elem_id="detail-area"):
        gr.Markdown("## Book Details", elem_id="detail-area-title")
        with gr.Row(equal_height=False): # Allow columns to have different heights
            with gr.Column(scale=1, min_width=200):
                 # Set interactive=False as it's just display
                 detail_image = gr.Image(label="Cover", value=None, width=200, height=300, elem_id="detail_image", show_label=False, interactive=False)
            with gr.Column(scale=3):
                 detail_markdown = gr.Markdown(value="Select a book from the gallery above to see details.", elem_id="detail_markdown")

    # --- Event Handling ---
    # Button click triggers the main wrapper
    submit_button.click(
        recommend_books_wrapper,
        inputs=[user_query, category_dropdown, tone_dropdown],
        # Outputs list MUST match yield dictionary keys + state
        outputs=[output_gallery, submit_button, detail_markdown, detail_image, last_results_state]
    )

    # Gallery selection triggers the detail view update
    output_gallery.select(
        show_book_details,
        inputs=[last_results_state], # Pass the stored results DataFrame
        outputs=[detail_image, detail_markdown] # Update the detail components
        # The event data (evt: gr.SelectData) is passed implicitly as the last argument to show_book_details
    )

# --- Launch the Application ---
if __name__ == "__main__":
    print("Launching Gradio dashboard...")
    if os.getenv("GOOGLE_API_KEY") and collections is not None:
        dashboard.launch(debug=True) # debug=True helps with development
    elif collections is None:
         print("\nDashboard launch aborted - Chroma collection issue.")
    else:
        print("\nDashboard launch aborted - GOOGLE_API_KEY missing.")

# Note: The above code is a complete Gradio dashboard application for book recommendations.