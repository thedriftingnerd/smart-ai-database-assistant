# Smart AI Database Assistant

Original Development Date: June 10, 2026

Readme is outdated and toolset has since been updated to use Python, Node.js, React, and Gemini 3.6 Flash.

------------------------------------------------------------------------------------------------------------------------

This project is a local Streamlit app that turns plain-English questions into SQLite queries against a local SQLite database. It uses a Gemini free-tier model through the Google GenAI SDK and stores everything locally.

## Files

- `setup_db.py` creates `enterprise.db` with sample `employees`, `it_hardware`, and `support_tickets` tables.
- `db_engine.py` inspects the schema and executes read-only SQL safely.
- `llm_engine.py` loads the local Gemini API key, builds prompts, and extracts SQL from Gemini responses.
- `app.py` provides the Streamlit UI, chat history, database switching, and manual SQL editing.

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Paste your Gemini API key into `gemini_key.txt`.
4. If you prefer JSON config, create `config.json` in the project root with this shape:

```json
{
  "gemini_api_key": "YOUR_KEY_HERE",
  "model": "gemini-2.5-flash"
}
```

5. Create the local database:

```bash
python setup_db.py
```

6. Start the app:

```bash
streamlit run app.py
```

## Usage

Ask questions like:

- Show all open support tickets grouped by priority.
- Which employees have assigned laptops that are overdue for warranty renewal?
- Count hardware assets by status and type.
- List security-related tickets from the last 30 days.

The app displays the generated SQL and the resulting Pandas table. The dashboard also lets you switch the active SQLite file, upload a different database, create a sample database at a chosen path, enable an audit trail, and run manual SQL changes against the selected database.

## Notes

- The query runner is intentionally read-only and rejects destructive SQL.
- The schema is re-inspected from the local SQLite database before each Gemini prompt so the model sees the current table structure.
- If Gemini free-tier quota is unavailable, the app falls back to local SQL templates for common requests like the most recent support ticket or the most recent database change.
