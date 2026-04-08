from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

try:
    models = client.models.list()
    print([m.id for m in models.data])
except Exception as e:
    print(f"Error: {e}")
