-- Fix audit log immutability to allow CASCADE SET NULL from Asset deletion
-- This allows the assetId foreign key to be set to NULL when an asset is deleted
-- while still preventing direct modifications to audit logs

-- Drop existing triggers
DROP TRIGGER IF EXISTS audit_log_prevent_update ON "AuditLog";
DROP TRIGGER IF EXISTS audit_log_prevent_delete ON "AuditLog";

-- Drop existing functions
DROP FUNCTION IF EXISTS prevent_audit_log_update();
DROP FUNCTION IF EXISTS prevent_audit_log_delete();

-- Create improved function that allows CASCADE SET NULL but prevents other updates
CREATE OR REPLACE FUNCTION prevent_audit_log_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow setting assetId to NULL (from CASCADE SET NULL on Asset deletion)
  -- This happens when only assetId changes from a value to NULL
  -- and all other fields remain unchanged
  IF (OLD."assetId" IS NOT NULL AND NEW."assetId" IS NULL) AND
     OLD."id" = NEW."id" AND
     OLD."userId" = NEW."userId" AND
     OLD."action" = NEW."action" AND
     OLD."resourceType" = NEW."resourceType" AND
     OLD."resourceId" = NEW."resourceId" AND
     OLD."metadata"::text = NEW."metadata"::text AND
     (OLD."ipAddress" IS NOT DISTINCT FROM NEW."ipAddress") AND
     (OLD."userAgent" IS NOT DISTINCT FROM NEW."userAgent") AND
     OLD."createdAt" = NEW."createdAt" THEN
    RETURN NEW;
  END IF;
  
  -- Prevent all other updates
  RAISE EXCEPTION 'Audit logs are immutable and cannot be updated';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function that prevents deletes on AuditLog table
CREATE OR REPLACE FUNCTION prevent_audit_log_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be deleted';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER audit_log_prevent_update
  BEFORE UPDATE ON "AuditLog"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_update();

CREATE TRIGGER audit_log_prevent_delete
  BEFORE DELETE ON "AuditLog"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_delete();
