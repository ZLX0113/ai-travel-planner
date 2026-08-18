"""Vercel serverless entry point for FastAPI backend."""
import sys
import os

# Mark as Vercel environment
os.environ['VERCEL'] = '1'

# Add project root (frontend's parent) to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the FastAPI app
from backend.app.main import app