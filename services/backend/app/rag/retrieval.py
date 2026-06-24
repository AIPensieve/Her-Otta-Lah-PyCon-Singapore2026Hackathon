"""
RAG Retrieval — keyword-based retrieval over local sample documents.

For the hackathon demo, this uses simple TF-IDF style scoring (no external
vector DB dependency). In production, replace with a proper embeddings store
(e.g. Qdrant, Chroma, Weaviate) backed by authoritative medical content
that has been reviewed and cleared for distribution.

IMPORTANT: The sample_docs/ in this repo contain only illustrative snippets.
Real medical knowledge bases must be properly licensed and reviewed.
"""
from __future__ import annotations
import os
import re
import math
from pathlib import Path
from collections import Counter


# ---------------------------------------------------------------------------
# Document loading
# ---------------------------------------------------------------------------

DOCS_DIR = Path(__file__).parent / "sample_docs"


def _load_docs() -> list[dict]:
    """Load all .txt files in sample_docs/ as retrieval candidates."""
    docs = []
    if not DOCS_DIR.exists():
        return docs
    for path in sorted(DOCS_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        # Split into chunks of ~200 chars at sentence boundaries
        chunks = _chunk(text, max_len=200)
        for i, chunk in enumerate(chunks):
            docs.append({
                "id": f"{path.stem}_{i}",
                "source": path.stem,
                "text": chunk,
            })
    return docs


def _chunk(text: str, max_len: int) -> list[str]:
    """Split text into overlapping chunks at sentence boundaries."""
    sentences = re.split(r'(?<=[。！？.!?])\s*', text)
    chunks, buf = [], ""
    for sent in sentences:
        if len(buf) + len(sent) > max_len and buf:
            chunks.append(buf.strip())
            buf = sent
        else:
            buf += sent
    if buf.strip():
        chunks.append(buf.strip())
    return chunks or [text[:max_len]]


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def _tokenize(text: str) -> list[str]:
    """Simple tokenizer: split on whitespace + punctuation, lowercase."""
    tokens = re.findall(r'[一-鿿]+|[a-zA-Z]{2,}', text.lower())
    return tokens


def _tf_idf_score(query_tokens: list[str], doc_text: str, idf: dict[str, float]) -> float:
    doc_tokens = _tokenize(doc_text)
    doc_freq = Counter(doc_tokens)
    doc_len = len(doc_tokens) or 1
    score = 0.0
    for tok in query_tokens:
        tf = doc_freq[tok] / doc_len
        score += tf * idf.get(tok, 0.0)
    return score


def _compute_idf(docs: list[dict]) -> dict[str, float]:
    n = len(docs) or 1
    df: Counter = Counter()
    for doc in docs:
        unique_tokens = set(_tokenize(doc["text"]))
        df.update(unique_tokens)
    return {tok: math.log(n / (cnt + 1)) + 1 for tok, cnt in df.items()}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_DOCS: list[dict] = []
_IDF: dict[str, float] = {}


def _ensure_loaded() -> None:
    global _DOCS, _IDF
    if not _DOCS:
        _DOCS = _load_docs()
        _IDF = _compute_idf(_DOCS)


def retrieve(query: str, top_k: int = 3) -> list[dict]:
    """
    Returns top_k document chunks most relevant to query.
    Each result: {"id", "source", "text", "score"}
    """
    _ensure_loaded()
    if not _DOCS:
        return []

    query_tokens = _tokenize(query)
    scored = [
        {**doc, "score": _tf_idf_score(query_tokens, doc["text"], _IDF)}
        for doc in _DOCS
    ]
    scored.sort(key=lambda x: x["score"], reverse=True)
    return [r for r in scored[:top_k] if r["score"] > 0]


def retrieve_text(query: str, top_k: int = 3) -> str:
    """Convenience: return joined text of top results."""
    results = retrieve(query, top_k)
    return "\n\n".join(r["text"] for r in results)
