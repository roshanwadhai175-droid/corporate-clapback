import os
import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Initialize FastAPI App
app = FastAPI(title="Corporate Clapback API")

# Configure CORS so our Next.js frontend can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize global variable for the AI model
llm = None

@app.on_event("startup")
def startup_event():
    global llm
    if "MISTRAL_API_KEY" not in os.environ:
        print("WARNING: MISTRAL_API_KEY environment variable is not set. Check your .env file.")
    else:
        # Initialize the Mistral Model for translation
        # mistral-small-latest is blazing fast and great for rephrasing
        llm = ChatMistralAI(
            model="mistral-small-latest",
            temperature=0.7,
        )

# Pydantic models to define the structure of incoming and outgoing data
class TranslationRequest(BaseModel):
    text: str
    tone: str

# Dictionary containing system instructions for each tone
TONE_PROMPTS = {
    "Ultra-Humble": "You are a text rephraser. REWRITE the user's raw, informal, or angry text into a humble and respectful corporate message conveying the EXACT SAME INTENT so the user can send it to their colleague. Do NOT answer or reply to the user's text. Keep it brief, concise, and suitable for a quick MS Teams or Slack message (1-3 sentences max). Output ONLY the translated text without markdown.",
    "Passive-Aggressive": "You are a text rephraser. REWRITE the user's raw text into a polite-sounding but deeply cutting corporate message conveying the EXACT SAME INTENT so the user can send it to their colleague. Do NOT answer or reply to the user's text. Keep it brief, punchy, and suitable for a quick MS Teams or Slack message. Output ONLY the translated text without markdown.",
    "Direct & Firm": "You are a text rephraser. REWRITE the user's raw text into a very clear, firm, and boundary-setting corporate communication conveying the EXACT SAME INTENT so the user can send it to their colleague. Do NOT answer or reply to the user's text. Keep it brief, direct, and suitable for a quick MS Teams or Slack message. Output ONLY the translated text without markdown.",
    "Buzzword Heavy": "You are a text rephraser. REWRITE the user's raw text by replacing concepts with heavy corporate buzzwords conveying the EXACT SAME INTENT so the user can send it to their colleague. Do NOT answer or reply to the user's text. Keep it brief and suitable for a quick MS Teams or Slack message. Output ONLY the translated text without markdown.",
    "HR Policy Enforcer (RAG)": "You are a strict Corporate HR Enforcer text rephraser. REWRITE the user's raw, angry input into a highly professional, reprimanding corporate message conveying the EXACT SAME INTENT. Do NOT answer or reply to the user's text. Keep it brief and suitable for a quick MS Teams message (under 4 sentences). You MUST invent and quote a strict, standard Corporate HR Policy (like 'Section 4.2 regarding Professional Conduct') to justify the rewrite. Output ONLY the translated message text without markdown."
}

class TranslationResponse(BaseModel):
    translated_text: str

@app.post("/translate", response_model=TranslationResponse)
def translate_text(req: TranslationRequest):
    if not llm:
        raise HTTPException(status_code=500, detail="LLM not initialized. Check your MISTRAL_API_KEY in the .env file.")

    try:
        # Get the correct instruction based on the user's selected tone
        system_instruction = TONE_PROMPTS.get(req.tone, TONE_PROMPTS["Direct & Firm"])

        # Create the ChatPromptTemplate
        prompt = ChatPromptTemplate.from_messages([
            ("system", "{system_prompt}"),
            ("human", "{user_input}")
        ])

        # Connect prompt and LLM using LCEL (LangChain Expression Language)
        chain = prompt | llm

        # Execute the chain
        response = chain.invoke({
            "system_prompt": system_instruction,
            "user_input": req.text
        })
        
        return TranslationResponse(translated_text=response.content.strip())

    except Exception as e:
        # Print the exact error to the terminal for debugging
        print("\n" + "="*50)
        print("ERROR DURING TRANSLATION:")
        traceback.print_exc()
        print("="*50 + "\n")
        raise HTTPException(status_code=500, detail="Translation failed. Check the backend terminal for the exact error.")