import sqlite3
import os
import re

DB_FILE_PATH = os.path.join(os.path.dirname(__file__), 'app_database.db')

current_database_name = 'default_database.db'
audit_trail_enabled = True

READ_ONLY_PATTERN = re.compile(r'^\s*(select|with|pragma|explain)\b', re.IGNORECASE)
DISALLOWED_PATTERN = re.compile(r'\b(insert|update|delete|drop|alter|create|replace|truncate|attach|detach|vacuum|reindex|grant|revoke)\b', re.IGNORECASE)

def get_db_connection():
    conn = sqlite3.connect(DB_FILE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def get_active_database_name():
    global current_database_name
    return current_database_name

def clean_sql_text(sql: str) -> str:
    if not sql:
        return ''
    cleaned = sql.strip()
    cleaned = re.sub(r'^```(?:sql)?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*```$', '', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    if cleaned.endswith(';'):
        cleaned = cleaned[:-1].strip()
    return cleaned

def normalize_sql(sql: str) -> str:
    cleaned = clean_sql_text(sql)
    if not cleaned:
        raise ValueError('Generated SQL is empty.')
    if cleaned.count(';') > 0:
        raise ValueError('Only one SQL statement is allowed.')
    if not READ_ONLY_PATTERN.search(cleaned):
        raise ValueError('Only read-only SELECT, WITH, PRAGMA, or EXPLAIN queries are allowed.')
    if DISALLOWED_PATTERN.search(cleaned):
        raise ValueError('The generated query contains a disallowed SQL operation.')
    return cleaned

def setup_triggers(conn):
    cursor = conn.cursor()
    cursor.executescript('''
        CREATE TRIGGER IF NOT EXISTS employees_ai AFTER INSERT ON employees BEGIN
          INSERT INTO audit_log(table_name, row_id, action, changed_by, change_summary)
          VALUES ('employees', NEW.employee_id, 'INSERT', 'system', 'Inserted employee ' || NEW.employee_id);
        END;

        CREATE TRIGGER IF NOT EXISTS employees_au AFTER UPDATE ON employees BEGIN
          INSERT INTO audit_log(table_name, row_id, action, changed_by, change_summary)
          VALUES ('employees', NEW.employee_id, 'UPDATE', 'system', 'Updated employee ' || NEW.employee_id);
        END;

        CREATE TRIGGER IF NOT EXISTS employees_ad AFTER DELETE ON employees BEGIN
          INSERT INTO audit_log(table_name, row_id, action, changed_by, change_summary)
          VALUES ('employees', OLD.employee_id, 'DELETE', 'system', 'Deleted employee ' || OLD.employee_id);
        END;

        CREATE TRIGGER IF NOT EXISTS it_hardware_ai AFTER INSERT ON it_hardware BEGIN
          INSERT INTO audit_log(table_name, row_id, action, changed_by, change_summary)
          VALUES ('it_hardware', NEW.asset_id, 'INSERT', 'system', 'Inserted hardware asset ' || NEW.asset_id);
        END;

        CREATE TRIGGER IF NOT EXISTS it_hardware_au AFTER UPDATE ON it_hardware BEGIN
          INSERT INTO audit_log(table_name, row_id, action, changed_by, change_summary)
          VALUES ('it_hardware', NEW.asset_id, 'UPDATE', 'system', 'Updated hardware asset ' || NEW.asset_id);
        END;

        CREATE TRIGGER IF NOT EXISTS it_hardware_ad AFTER DELETE ON it_hardware BEGIN
          INSERT INTO audit_log(table_name, row_id, action, changed_by, change_summary)
          VALUES ('it_hardware', OLD.asset_id, 'DELETE', 'system', 'Deleted hardware asset ' || OLD.asset_id);
        END;

        CREATE TRIGGER IF NOT EXISTS support_tickets_ai AFTER INSERT ON support_tickets BEGIN
          INSERT INTO audit_log(table_name, row_id, action, changed_by, change_summary)
          VALUES ('support_tickets', NEW.ticket_id, 'INSERT', 'system', 'Created ticket ' || NEW.ticket_id);
        END;

        CREATE TRIGGER IF NOT EXISTS support_tickets_au AFTER UPDATE ON support_tickets BEGIN
          INSERT INTO audit_log(table_name, row_id, action, changed_by, change_summary)
          VALUES ('support_tickets', NEW.ticket_id, 'UPDATE', 'system', 'Updated ticket ' || NEW.ticket_id);
        END;

        CREATE TRIGGER IF NOT EXISTS support_tickets_ad AFTER DELETE ON support_tickets BEGIN
          INSERT INTO audit_log(table_name, row_id, action, changed_by, change_summary)
          VALUES ('support_tickets', OLD.ticket_id, 'DELETE', 'system', 'Deleted ticket ' || OLD.ticket_id);
        END;
    ''')
    conn.commit()

def init_sample_schema(conn):
    cursor = conn.cursor()
    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS audit_log (
          audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_name TEXT NOT NULL,
          row_id INTEGER,
          action TEXT NOT NULL,
          changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          changed_by TEXT,
          change_summary TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS employees (
          employee_id INTEGER PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          department TEXT NOT NULL,
          job_title TEXT NOT NULL,
          location TEXT NOT NULL,
          hire_date TEXT NOT NULL,
          status TEXT NOT NULL,
          manager_id INTEGER,
          FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
        );

        CREATE TABLE IF NOT EXISTS it_hardware (
          asset_id INTEGER PRIMARY KEY,
          asset_tag TEXT NOT NULL UNIQUE,
          asset_type TEXT NOT NULL,
          manufacturer TEXT NOT NULL,
          model TEXT NOT NULL,
          serial_number TEXT NOT NULL UNIQUE,
          purchase_date TEXT NOT NULL,
          warranty_end_date TEXT NOT NULL,
          assigned_employee_id INTEGER,
          status TEXT NOT NULL,
          location TEXT NOT NULL,
          ip_address TEXT,
          os_version TEXT,
          FOREIGN KEY (assigned_employee_id) REFERENCES employees(employee_id)
        );

        CREATE TABLE IF NOT EXISTS support_tickets (
          ticket_id INTEGER PRIMARY KEY,
          opened_at TEXT NOT NULL,
          closed_at TEXT,
          requester_employee_id INTEGER NOT NULL,
          assigned_to_employee_id INTEGER,
          category TEXT NOT NULL,
          priority TEXT NOT NULL,
          status TEXT NOT NULL,
          subject TEXT NOT NULL,
          description TEXT NOT NULL,
          resolution_summary TEXT,
          sla_breached INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (requester_employee_id) REFERENCES employees(employee_id),
          FOREIGN KEY (assigned_to_employee_id) REFERENCES employees(employee_id)
        );
    ''')

    setup_triggers(conn)

    employees = [
        (1, "Ava", "Patel", "ava.patel@acme.local", "Information Technology", "IT Director", "New York", "2020-02-10", "Active", None),
        (2, "Noah", "Kim", "noah.kim@acme.local", "Information Technology", "Systems Engineer", "New York", "2021-05-17", "Active", 1),
        (3, "Mia", "Garcia", "mia.garcia@acme.local", "Information Technology", "Service Desk Analyst", "Chicago", "2022-01-12", "Active", 2),
        (4, "Liam", "Chen", "liam.chen@acme.local", "Security", "Security Analyst", "Austin", "2019-08-05", "Active", 1),
        (5, "Sophia", "Martinez", "sophia.martinez@acme.local", "Finance", "Finance Manager", "New York", "2018-03-19", "Active", None),
        (6, "Ethan", "Brown", "ethan.brown@acme.local", "Finance", "Accounts Payable Specialist", "New York", "2023-04-03", "Active", 5),
        (7, "Olivia", "Wilson", "olivia.wilson@acme.local", "Human Resources", "HR Business Partner", "Denver", "2021-09-27", "Active", None),
        (8, "James", "Taylor", "james.taylor@acme.local", "Sales", "Account Executive", "Chicago", "2020-11-30", "Active", None),
        (9, "Isabella", "Anderson", "isabella.anderson@acme.local", "Operations", "Operations Coordinator", "Phoenix", "2022-06-14", "Active", None),
        (10, "Lucas", "Thomas", "lucas.thomas@acme.local", "Marketing", "Marketing Manager", "Seattle", "2019-10-08", "Active", None),
        (11, "Amelia", "Moore", "amelia.moore@acme.local", "Customer Support", "Support Specialist", "Dallas", "2021-12-06", "Active", None),
        (12, "Benjamin", "Jackson", "ben.jackson@acme.local", "Engineering", "Software Engineer", "Austin", "2020-07-20", "Active", None),
        (13, "Charlotte", "White", "charlotte.white@acme.local", "Engineering", "DevOps Engineer", "Austin", "2021-02-15", "Active", 12),
        (14, "Elijah", "Harris", "elijah.harris@acme.local", "Legal", "Legal Counsel", "New York", "2017-01-09", "Active", None),
        (15, "Harper", "Martin", "harper.martin@acme.local", "Procurement", "Procurement Specialist", "Boston", "2023-09-11", "Active", None),
        (16, "Daniel", "Lee", "daniel.lee@acme.local", "Research", "Data Analyst", "San Jose", "2022-03-21", "Active", None)
    ]
    cursor.executemany("INSERT OR REPLACE INTO employees VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", employees)

    hardware = [
        (1, "IT-1001", "Laptop", "Dell", "Latitude 7440", "DL7440-001", "2023-02-01", "2026-02-01", 2, "In Service", "New York", "10.10.1.21", "Windows 11 Pro"),
        (2, "IT-1002", "Laptop", "Apple", "MacBook Pro 14", "MBP14-002", "2023-04-15", "2026-04-15", 12, "In Service", "Austin", "10.10.2.14", "macOS Sonoma"),
        (3, "IT-1003", "Laptop", "Lenovo", "ThinkPad T14", "TPT14-003", "2022-11-19", "2025-11-19", 3, "In Service", "Chicago", "10.10.1.34", "Windows 11 Pro"),
        (4, "IT-1004", "Desktop", "HP", "EliteDesk 800", "HP800-004", "2021-07-22", "2024-07-22", 5, "In Repair", "New York", "10.10.3.18", "Windows 10 Enterprise"),
        (5, "IT-1005", "Laptop", "Dell", "Latitude 5430", "DL5430-005", "2024-01-17", "2027-01-17", 4, "In Service", "Austin", "10.10.1.52", "Windows 11 Pro"),
        (6, "IT-1006", "Laptop", "Dell", "Latitude 7440", "DL7440-006", "2023-08-24", "2026-08-24", 8, "In Service", "Chicago", "10.10.2.07", "Windows 11 Pro"),
        (7, "IT-1007", "Monitor", "Dell", "P2722H", "MON-007", "2022-05-10", "2025-05-10", 8, "In Service", "Chicago", None, None),
        (8, "IT-1008", "Phone", "Apple", "iPhone 14", "IPH14-008", "2023-03-06", "2026-03-06", 7, "In Service", "Denver", None, "iOS 17"),
        (9, "IT-1009", "Tablet", "Apple", "iPad Air", "IPAIR-009", "2024-02-12", "2027-02-12", 11, "In Service", "Dallas", None, "iPadOS 17"),
        (10, "IT-1010", "Laptop", "Lenovo", "ThinkPad X1 Carbon", "X1C-010", "2023-06-02", "2026-06-02", 13, "In Service", "Austin", "10.10.2.26", "Windows 11 Pro"),
        (11, "IT-1011", "Laptop", "Dell", "Latitude 7340", "DL7340-011", "2024-03-14", "2027-03-14", 16, "In Service", "San Jose", "10.10.4.11", "Windows 11 Pro"),
        (12, "IT-1012", "Docking Station", "Dell", "WD22TB4", "DOCK-012", "2022-09-30", "2025-09-30", 16, "In Service", "San Jose", None, None),
        (13, "IT-1013", "Laptop", "Apple", "MacBook Air 15", "MBA15-013", "2024-04-18", "2027-04-18", 10, "In Service", "Seattle", "10.10.1.77", "macOS Sonoma"),
        (14, "IT-1014", "Desktop", "HP", "ProDesk 600", "HP600-014", "2021-11-05", "2024-11-05", 6, "Retired", "New York", None, "Windows 10 Enterprise"),
        (15, "IT-1015", "Laptop", "Dell", "Latitude 5440", "DL5440-015", "2024-05-09", "2027-05-09", 9, "In Service", "Phoenix", "10.10.3.25", "Windows 11 Pro"),
        (16, "IT-1016", "Monitor", "LG", "34WN80C", "MON-016", "2023-01-20", "2026-01-20", 12, "In Service", "Austin", None, None),
        (17, "IT-1017", "Laptop", "Microsoft", "Surface Laptop 5", "SL5-017", "2023-10-04", "2026-10-04", 14, "In Service", "New York", "10.10.2.99", "Windows 11 Pro"),
        (18, "IT-1018", "Phone", "Samsung", "Galaxy S23", "GS23-018", "2023-09-22", "2026-09-22", 15, "In Service", "Boston", None, "Android 14")
    ]
    cursor.executemany("INSERT OR REPLACE INTO it_hardware VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", hardware)

    tickets = [
        (1, "2024-01-08", "2024-01-09", 3, 2, "Hardware", "Medium", "Closed", "Laptop battery swelling", "Service Desk replaced the battery and ran diagnostics.", "Battery replaced and device returned.", 0),
        (2, "2024-01-10", "2024-01-11", 8, 2, "Access", "High", "Closed", "VPN access unavailable", "User could not reach the VPN gateway.", "Credentials reset and VPN profile reissued.", 0),
        (3, "2024-01-12", None, 11, 3, "Software", "Low", "Open", "Request for PDF editor", "Need a licensed PDF editor for contract review.", None, 0),
        (4, "2024-01-13", "2024-01-14", 6, 4, "Security", "High", "Closed", "Phishing email reported", "Suspicious email forwarded to security team.", "Malicious sender blocked and message quarantined.", 0),
        (5, "2024-01-15", None, 12, 2, "Hardware", "Critical", "In Progress", "Docking station not detected", "Dock only charges intermittently on desk setup.", None, 1),
        (6, "2024-01-16", "2024-01-17", 16, 2, "Network", "Medium", "Closed", "Slow Wi-Fi in lab", "Performance issues reported during morning hours.", "Access point channel adjusted.", 0),
        (7, "2024-01-18", None, 7, 7, "HR Systems", "Medium", "Open", "Password reset for HR portal", "User locked out after password expiration.", None, 0),
        (8, "2024-01-19", "2024-01-20", 10, 2, "Hardware", "Low", "Closed", "Monitor flickering", "External monitor shows intermittent flicker.", "Cable replaced and brightness normalized.", 0),
        (9, "2024-01-21", None, 15, 2, "Procurement", "Low", "Open", "Need purchase approval workflow", "Request to streamline hardware requisitions.", None, 0),
        (10, "2024-01-22", "2024-01-23", 4, 4, "Security", "High", "Closed", "MFA enrollment issue", "User unable to enroll token.", "Token reset and enrollment completed.", 0),
        (11, "2024-01-24", None, 2, 2, "Hardware", "Medium", "In Progress", "Laptop fan noise", "Device fan is louder than normal under load.", None, 0),
        (12, "2024-01-25", "2024-01-26", 9, 2, "Network", "Medium", "Closed", "Intermittent printer connectivity", "Office printer drops off the network.", "Printer firmware updated and DHCP lease renewed.", 0),
        (13, "2024-01-27", None, 13, 13, "Software", "High", "Open", "Dev tools license request", "Need local admin tools for release support.", None, 0),
        (14, "2024-01-28", "2024-01-29", 5, 2, "Hardware", "High", "Closed", "Replacement workstation needed", "Executive desktop failed POST.", "Replacement workstation issued.", 0),
        (15, "2024-01-30", None, 14, 4, "Security", "Critical", "In Progress", "Suspicious login alert", "Unusual sign-in from foreign IP address.", None, 1),
        (16, "2024-01-31", "2024-02-01", 1, 2, "Facilities", "Low", "Closed", "Conference room display calibration", "Display colors need recalibration.", "Display settings adjusted.", 0),
        (17, "2024-02-02", None, 6, 3, "Software", "Medium", "Open", "Excel add-in installation", "Finance team needs signed add-in package.", None, 0),
        (18, "2024-02-03", "2024-02-04", 8, 2, "Hardware", "Medium", "Closed", "Headset microphone not working", "Audio input does not register during calls.", "USB headset replaced.", 0),
        (19, "2024-02-05", None, 11, 2, "Network", "High", "Open", "Cannot reach CRM", "Support specialist cannot access CRM from remote network.", None, 0),
        (20, "2024-02-06", "2024-02-07", 3, 2, "Software", "Low", "Closed", "Browser profile cleanup", "Old browser profile causing sync issues.", "Profile reset completed.", 0)
    ]
    cursor.executemany("INSERT OR REPLACE INTO support_tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", tickets)

    conn.commit()

def init_db():
    if not os.path.exists(DB_FILE_PATH):
        conn = get_db_connection()
        init_sample_schema(conn)
        conn.close()

def list_tables():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    rows = cursor.fetchall()
    conn.close()
    return [r['name'] for r in rows]

def get_row_counts():
    tables = list_tables()
    conn = get_db_connection()
    cursor = conn.cursor()
    counts = {}
    for tbl in tables:
        cursor.execute(f'SELECT COUNT(*) as c FROM "{tbl}"')
        counts[tbl] = cursor.fetchone()['c']
    conn.close()
    return counts

def get_schema_summary():
    tables = list_tables()
    conn = get_db_connection()
    cursor = conn.cursor()
    summaries = []
    for tbl in tables:
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name=?;", (tbl,))
        row = cursor.fetchone()
        if row and row['sql']:
            summaries.append(row['sql'])
    conn.close()
    return "\n\n".join(summaries)

def execute_sql_query(sql_text: str):
    init_db()
    normalized = normalize_sql(sql_text)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(normalized)
    rows = cursor.fetchall()
    columns = [description[0] for description in cursor.description] if cursor.description else []
    conn.close()

    formatted_rows = []
    for r in rows:
        formatted_rows.append([r[col] for col in columns])

    return {
        "columns": columns,
        "rows": formatted_rows
    }

def execute_sql_statement(sql_text: str):
    init_db()
    cleaned = clean_sql_text(sql_text)
    if not cleaned:
        raise ValueError("SQL statement is empty.")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.executescript(cleaned)
    conn.commit()
    conn.close()
    return "SQL Statement executed successfully in Python database engine."

def load_user_database(file_bytes: bytes, filename: str):
    global current_database_name, audit_trail_enabled
    with open(DB_FILE_PATH, 'wb') as f:
        f.write(file_bytes)
    current_database_name = filename or 'custom_database.db'
    audit_trail_enabled = False

def reset_database():
    global current_database_name, audit_trail_enabled
    if os.path.exists(DB_FILE_PATH):
        os.remove(DB_FILE_PATH)
    init_db()
    current_database_name = 'default_database.db'
    audit_trail_enabled = True

def is_audit_trail_enabled():
    global audit_trail_enabled
    return audit_trail_enabled

def ensure_audit_trail():
    global audit_trail_enabled
    conn = get_db_connection()
    setup_triggers(conn)
    conn.close()
    audit_trail_enabled = True
    return "Audit trail triggers enabled successfully in Python SQLite engine."
