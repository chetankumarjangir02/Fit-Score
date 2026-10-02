"""Vercel serverless entry point.

Vercel discovers the ASGI `app` object here and serves it as a Python function.
The real application lives in `main.py` at the project root.
"""

from main import app

__all__ = ["app"]