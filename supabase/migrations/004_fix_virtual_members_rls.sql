-- Fix RLS policies for virtual members
-- This addresses the 500 error when creating virtual members

-- Create helper function to check if user is owner of a household
-- SECURITY DEFINER bypasses RLS to avoid recursion issues
CREATE OR REPLACE FUNCTION is_household_owner(household_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_memberships
    WHERE household_id = household_uuid
    AND user_id = user_uuid
    AND role = 'owner'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Update SELECT policy to allow viewing virtual members
-- Virtual members are safe to view since they don't contain personal information
DROP POLICY IF EXISTS "Members can view memberships in their households" ON household_memberships;

CREATE POLICY "Members can view memberships in their households" ON household_memberships
  FOR SELECT USING (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
    OR user_id = auth.uid()  -- Users can always see their own memberships
    OR user_id IS NULL  -- Anyone can view virtual members (for claim flow)
  );

-- Update INSERT policy to use helper function
DROP POLICY IF EXISTS "Users can create memberships" ON household_memberships;

CREATE POLICY "Users can create memberships" ON household_memberships
  FOR INSERT WITH CHECK (
    -- User creating their own membership
    auth.uid() = user_id
    OR
    -- Owner creating virtual member (user_id is null)
    (user_id IS NULL AND is_household_owner(household_id, auth.uid()))
  );

-- Update UPDATE policy to use helper function
DROP POLICY IF EXISTS "Users can update memberships" ON household_memberships;

CREATE POLICY "Users can update memberships" ON household_memberships
  FOR UPDATE USING (
    -- User updating their own membership
    auth.uid() = user_id
    OR
    -- User claiming a virtual member
    (user_id IS NULL AND auth.uid() IS NOT NULL)
    OR
    -- Owner can update any membership in their household
    is_household_owner(household_id, auth.uid())
  );
