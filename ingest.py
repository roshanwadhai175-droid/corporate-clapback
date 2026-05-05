import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

def ingest_data():
    print("Loading HR Policy from hr_policy.txt...")
    try:
        loader = TextLoader("hr_policy.txt")
        documents = loader.load()
    except Exception as e:
        print("Failed to load hr_policy.txt. Make sure the file exists in this directory.")
        return

    # Safety check to prevent the empty embedding error
    if not documents or not documents[0].page_content.strip():
        print("Error: hr_policy.txt is empty! Please add some text to it before running.")
        return

    print("Splitting text into manageable chunks...")
    # Split text into chunks for the Vector DB
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_documents(documents)

    if not chunks:
        print("Error: No text chunks were created. Check your text file formatting.")
        return

    print("Initializing Local Embeddings (HuggingFace)...")
    # Using local embeddings bypasses the Google API 404 error
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    print("Creating Vector Database (ChromaDB) locally...")
    try:
        # This automatically saves the database into a folder named 'chroma_db'
        Chroma.from_documents(
            documents=chunks, 
            embedding=embeddings, 
            persist_directory="./chroma_db"
        )
        print("Success! Ingestion complete. ChromaDB saved to ./chroma_db directory.")
    except Exception as e:
        print("An error occurred while creating the database:")
        print(str(e))

if __name__ == "__main__":
    ingest_data()