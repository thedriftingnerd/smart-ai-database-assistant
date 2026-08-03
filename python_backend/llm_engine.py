import os
import re
import json
import urllib.request
import urllib.error

def strip_markdown_sql(text: str) -> str:
    if not text:
        return ''
    cleaned = text.strip()
    fence_match = re.search(r'```(?:sql)?\s*([\s\S]*?)```', cleaned, re.IGNORECASE)
    if fence_match:
        cleaned = fence_match.group(1).strip()
    cleaned = re.sub(r'^sql\s*[:\-]?\s*', '', cleaned, flags=re.IGNORECASE).strip()
    if cleaned.endswith(';'):
        cleaned = cleaned[:-1].strip()
    return cleaned

def build_prompt(question: str, schema_summary: str, conversation_history=None) -> str:
    history_block = ''
    if conversation_history and isinstance(conversation_history, list) and len(conversation_history) > 0:
        lines = []
        for turn in conversation_history[-6:]:
            if isinstance(turn, dict) and turn.get('content'):
                role = str(turn.get('role', 'user')).upper()
                lines.append(f"{role}: {turn['content'].strip()}")
        if lines:
            history_block = f"\nPrevious conversation:\n" + "\n".join(lines)

    return f"""You are a production-grade text-to-SQL assistant for a local enterprise SQLite database.

Rules:
1. Output one SQLite SELECT-style query only.
2. Do not wrap the answer in markdown, code fences, or explanations.
3. Use only tables and columns that exist in the schema.
4. Prefer explicit joins and readable aliases.
5. Use LIMIT 100 unless the user explicitly requests all rows or an aggregate.
6. If the request is ambiguous, choose the most useful interpretation based on the schema and conversation.
7. Never write INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, or other destructive SQL.

Schema:
{schema_summary}
{history_block}

User request:
{question}

Return only the SQL query."""

def generate_sql(question: str, schema_summary: str, conversation_history=None):
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        raise ValueError('Gemini API key is not configured in environment variables.')

    prompt = build_prompt(question, schema_summary, conversation_history)
    models_to_try = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash']
    last_error = None

    for model in models_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            data = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ]
            }
            json_bytes = json.dumps(data).encode('utf-8')
            req = urllib.request.Request(
                url,
                data=json_bytes,
                headers={'Content-Type': 'application/json'}
            )

            with urllib.request.urlopen(req, timeout=15) as response:
                resp_json = json.loads(response.read().decode('utf-8'))
                candidates = resp_json.get('candidates', [])
                if candidates and 'content' in candidates[0]:
                    parts = candidates[0]['content'].get('parts', [])
                    if parts and 'text' in parts[0]:
                        raw_text = parts[0]['text']
                        sql = strip_markdown_sql(raw_text)
                        if sql:
                            return {
                                "sql": sql,
                                "rawResponse": raw_text,
                                "model": model
                            }
            last_error = f"Empty response returned from model {model}"
        except urllib.error.HTTPError as http_err:
            try:
                err_body = http_err.read().decode('utf-8')
                last_error = f"HTTP {http_err.code}: {err_body}"
            except Exception:
                last_error = str(http_err)
        except Exception as err:
            last_error = str(err)

    raise RuntimeError(f"Gemini API Error: {last_error}")
