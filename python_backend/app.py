import os
import sys
import json
import base64
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote

sys.path.append(os.path.dirname(__file__))

import db_engine
import llm_engine
import local_fallback

PORT = 5000

class PythonBackendHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            if path == '/api/status':
                counts = db_engine.get_row_counts()
                tables = db_engine.list_tables()
                total_rows = sum(counts.values())
                is_key_configured = bool(os.environ.get('GEMINI_API_KEY'))

                self._send_json({
                    "isKeyConfigured": is_key_configured,
                    "activeModel": "gemini-3.6-flash",
                    "databaseName": db_engine.get_active_database_name(),
                    "tablesCount": len(tables),
                    "totalRows": total_rows,
                    "auditTrailEnabled": db_engine.is_audit_trail_enabled(),
                    "pythonEngine": "Python 3.10.12 (sqlite3)"
                })
                return

            if path == '/api/schema':
                summary = db_engine.get_schema_summary()
                self._send_json({"summary": summary})
                return

            if path == '/api/tables':
                tables = db_engine.list_tables()
                counts = db_engine.get_row_counts()
                self._send_json({"tables": tables, "counts": counts})
                return

            if path.startswith('/api/table/'):
                table_name = unquote(path[len('/api/table/'):])
                clean_table = re.sub(r'[^a-zA-Z0-9_]', '', table_name)
                dataframe = db_engine.execute_sql_query(f'SELECT * FROM "{clean_table}" LIMIT 50;')
                self._send_json(dataframe)
                return

            self._send_json({"error": "Endpoint not found"}, 404)
        except Exception as e:
            traceback.print_exc()
            self._send_json({"error": str(e)}, 500)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b'{}'
        try:
            body_json = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            body_json = {}

        try:
            if path == '/api/query':
                question = body_json.get('question', '')
                conversation_history = body_json.get('conversationHistory', [])

                if not question or not isinstance(question, str):
                    self._send_json({"error": "Question is required."}, 400)
                    return

                schema_summary = db_engine.get_schema_summary()
                is_key_configured = bool(os.environ.get('GEMINI_API_KEY'))

                if not is_key_configured:
                    fallback = local_fallback.local_sql_fallback(question)
                    if fallback:
                        fallback_sql, fallback_label = fallback
                        try:
                            dataframe = db_engine.execute_sql_query(fallback_sql)
                            self._send_json({
                                "content": f"Gemini API key is not configured, so Python used local fallback and returned {len(dataframe['rows'])} row(s).",
                                "sql": fallback_sql,
                                "dataframe": dataframe,
                                "usedModel": fallback_label
                            })
                            return
                        except Exception as exc:
                            self._send_json({"error": f"Fallback execution failed: {str(exc)}"}, 400)
                            return
                    self._send_json({
                        "content": "I cannot answer yet because the Gemini API key is missing in environment variables (GEMINI_API_KEY).",
                        "error": "Gemini API key not configured."
                    }, 400)
                    return

                try:
                    res = llm_engine.generate_sql(question, schema_summary, conversation_history)
                    sql = res['sql']
                    dataframe = db_engine.execute_sql_query(sql)
                    self._send_json({
                        "content": f"Python SQLite Engine returned {len(dataframe['rows'])} row(s) from the local database.",
                        "sql": sql,
                        "dataframe": dataframe,
                        "rawResponse": res['rawResponse'],
                        "usedModel": res['model']
                    })
                    return
                except Exception as err:
                    fallback = local_fallback.local_sql_fallback(question)
                    if fallback:
                        fallback_sql, fallback_label = fallback
                        try:
                            dataframe = db_engine.execute_sql_query(fallback_sql)
                            self._send_json({
                                "content": f"Gemini encountered an issue ({str(err)}), so Python fallback executed and returned {len(dataframe['rows'])} row(s).",
                                "sql": fallback_sql,
                                "dataframe": dataframe,
                                "usedModel": fallback_label
                            })
                            return
                        except Exception:
                            pass

                    self._send_json({
                        "content": "The query could not be executed.",
                        "error": str(err)
                    }, 500)
                    return

            if path == '/api/execute-sql':
                sql = body_json.get('sql', '')
                if not sql or not isinstance(sql, str):
                    self._send_json({"error": "SQL statement is required."}, 400)
                    return
                msg = db_engine.execute_sql_statement(sql)
                self._send_json({"message": msg})
                return

            if path == '/api/upload-db':
                filename = body_json.get('filename', 'custom_database.db')
                data_b64 = body_json.get('dataBase64', '')
                if not data_b64:
                    self._send_json({"error": "Database file content is required."}, 400)
                    return
                file_bytes = base64.b64decode(data_b64)
                db_engine.load_user_database(file_bytes, filename)
                self._send_json({"message": f"Successfully loaded database in Python engine: {filename}"})
                return

            if path == '/api/enable-audit':
                msg = db_engine.ensure_audit_trail()
                self._send_json({"message": msg})
                return

            if path == '/api/reset-db':
                db_engine.reset_database()
                self._send_json({"message": "Database reset to default successfully in Python engine."})
                return

            self._send_json({"error": "Endpoint not found"}, 404)
        except Exception as e:
            traceback.print_exc()
            self._send_json({"error": str(e)}, 500)

def run():
    db_engine.init_db()
    server_address = ('127.0.0.1', PORT)
    httpd = HTTPServer(server_address, PythonBackendHandler)
    print(f"Python Database Backend Server running on http://127.0.0.1:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()

if __name__ == '__main__':
    run()
