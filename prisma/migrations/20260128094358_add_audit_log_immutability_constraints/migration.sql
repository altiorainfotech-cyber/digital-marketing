-- Add database-level constraints to enforce audit log immutability
-- Requirement 12.4: Prevent modification or deletion of Audit_Log entries

-- Create a function that prevents updates on AuditLog table
CREATE OR REPLACE FUNCTION prevent_audit_log_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be updated';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a function that prevents deletes on AuditLog table
CREATE OR REPLACE FUNCTION prevent_audit_log_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be deleted';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent updates
CREATE TRIGGER audit_log_prevent_update
  BEFORE UPDATE ON "AuditLog"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_update();

-- Create trigger to prevent deletes
CREATE TRIGGER audit_log_prevent_delete
  BEFORE DELETE ON "AuditLog"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_delete();