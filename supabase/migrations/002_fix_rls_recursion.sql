-- Fix infinite recursion in household_memberships RLS policy
-- The issue: the SELECT policy queries household_memberships to check membership,
-- which triggers the same policy, causing infinite recursion.

-- Solution: Create a SECURITY DEFINER function that bypasses RLS to get user's household IDs

-- Drop the problematic policy first
DROP POLICY IF EXISTS "Members can view memberships in their households" ON household_memberships;

-- Create a function that bypasses RLS to get user's household IDs
CREATE OR REPLACE FUNCTION get_user_household_ids(user_uuid UUID)
RETURNS SETOF UUID AS $$
  SELECT household_id FROM household_memberships WHERE user_id = user_uuid
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Recreate the policy using the function
CREATE POLICY "Members can view memberships in their households" ON household_memberships
  FOR SELECT USING (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
    OR user_id = auth.uid()  -- Users can always see their own memberships
  );
