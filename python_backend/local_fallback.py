import re

def local_sql_fallback(question: str):
    if not question:
        return None
    normalized = question.strip().lower()

    if 'most recent database change' in normalized or 'latest database change' in normalized:
        return (
            "SELECT audit_id, table_name, row_id, action, changed_at, changed_by, change_summary FROM audit_log ORDER BY datetime(changed_at) DESC, audit_id DESC LIMIT 1",
            "Python Local Fallback"
        )

    if 'most recent support ticket' in normalized or 'latest support ticket' in normalized:
        return (
            "SELECT ticket_id, opened_at, closed_at, requester_employee_id, assigned_to_employee_id, category, priority, status, subject, description, resolution_summary, sla_breached FROM support_tickets ORDER BY datetime(opened_at) DESC, ticket_id DESC LIMIT 1",
            "Python Local Fallback"
        )

    if 'open support ticket' in normalized or 'open tickets' in normalized:
        return (
            "SELECT ticket_id, opened_at, requester_employee_id, category, priority, status, subject FROM support_tickets WHERE lower(status) IN ('open', 'in progress') ORDER BY datetime(opened_at) DESC LIMIT 100",
            "Python Local Fallback"
        )

    if 'hardware' in normalized and ('count' in normalized or 'how many' in normalized):
        return (
            "SELECT asset_type, status, COUNT(*) AS asset_count FROM it_hardware GROUP BY asset_type, status ORDER BY asset_count DESC, asset_type, status",
            "Python Local Fallback"
        )

    if 'employees' in normalized and ('count' in normalized or 'how many' in normalized):
        return (
            "SELECT department, status, COUNT(*) AS employee_count FROM employees GROUP BY department, status ORDER BY employee_count DESC, department, status",
            "Python Local Fallback"
        )

    if 'employee' in normalized and ('laptop' in normalized or 'warranty' in normalized or 'overdue' in normalized):
        return (
            "SELECT e.employee_id, e.first_name, e.last_name, e.department, h.asset_tag, h.model, h.warranty_end_date FROM employees e JOIN it_hardware h ON e.employee_id = h.assigned_employee_id WHERE h.asset_type = 'Laptop' ORDER BY date(h.warranty_end_date) ASC",
            "Python Local Fallback"
        )

    if 'ticket' in normalized and ('priority' in normalized or 'group' in normalized):
        return (
            "SELECT priority, status, COUNT(*) AS ticket_count FROM support_tickets GROUP BY priority, status ORDER BY priority, ticket_count DESC",
            "Python Local Fallback"
        )

    if 'security' in normalized and 'ticket' in normalized:
        return (
            "SELECT ticket_id, opened_at, requester_employee_id, priority, status, subject, description FROM support_tickets WHERE lower(category) = 'security' ORDER BY datetime(opened_at) DESC LIMIT 100",
            "Python Local Fallback"
        )

    if 'ticket' in normalized:
        return (
            "SELECT ticket_id, opened_at, category, priority, status, subject FROM support_tickets ORDER BY datetime(opened_at) DESC LIMIT 50",
            "Python Local Fallback"
        )

    if 'employee' in normalized or 'staff' in normalized or 'people' in normalized:
        return (
            "SELECT employee_id, first_name, last_name, department, job_title, location, status FROM employees ORDER BY employee_id ASC LIMIT 50",
            "Python Local Fallback"
        )

    if 'hardware' in normalized or 'laptop' in normalized or 'asset' in normalized or 'device' in normalized:
        return (
            "SELECT asset_id, asset_tag, asset_type, manufacturer, model, status, location FROM it_hardware ORDER BY asset_id ASC LIMIT 50",
            "Python Local Fallback"
        )

    return None
