-- Enable Row Level Security (RLS) on all tables found in the public schema
-- This addresses the "RLS Disabled in Public" security warnings.

-- 1. Enable RLS on tables
ALTER TABLE "OperatingExpense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerMachine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectPhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectDetail" ENABLE ROW LEVEL SECURITY;

-- _prisma_migrations is an internal table. Enabling RLS without a policy implies "deny all" for public API, which is secure.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies
-- These policies allow full access (SELECT, INSERT, UPDATE, DELETE) to any user 
-- who is authenticated (logged in).
-- Adjust these policies later if you need more granular permissions (e.g. read-only for some users).

-- Policy for OperatingExpense
CREATE POLICY "Enable all for authenticated users" ON "OperatingExpense"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for Profile
CREATE POLICY "Enable all for authenticated users" ON "Profile"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for Supplier
CREATE POLICY "Enable all for authenticated users" ON "Supplier"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for ProductCategory
CREATE POLICY "Enable all for authenticated users" ON "ProductCategory"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for Product
CREATE POLICY "Enable all for authenticated users" ON "Product"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for CustomerMachine
CREATE POLICY "Enable all for authenticated users" ON "CustomerMachine"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for Customer
CREATE POLICY "Enable all for authenticated users" ON "Customer"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for Project
CREATE POLICY "Enable all for authenticated users" ON "Project"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for ProjectPhoto
CREATE POLICY "Enable all for authenticated users" ON "ProjectPhoto"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for ProjectDetail
CREATE POLICY "Enable all for authenticated users" ON "ProjectDetail"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
