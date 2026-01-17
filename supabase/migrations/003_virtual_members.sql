-- Virtual Members Support
-- Allow household members without user accounts that can be claimed later

-- Make user_id nullable to support virtual members
ALTER TABLE household_memberships
  ALTER COLUMN user_id DROP NOT NULL;

-- Update unique constraint to only apply to non-null user_ids
-- This allows multiple virtual members, but real users can only have one membership per household
ALTER TABLE household_memberships
  DROP CONSTRAINT household_memberships_user_id_household_id_key;

CREATE UNIQUE INDEX household_memberships_user_household_unique
  ON household_memberships (user_id, household_id)
  WHERE user_id IS NOT NULL;

-- Update RLS policies for virtual member support

-- Create helper function to check if user is owner of a household
CREATE OR REPLACE FUNCTION is_household_owner(household_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_memberships
    WHERE household_id = household_uuid
    AND user_id = user_uuid
    AND role = 'owner'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Allow owners to create virtual members (no user_id)
DROP POLICY IF EXISTS "Users can create their own membership" ON household_memberships;
DROP POLICY IF EXISTS "Users can create memberships" ON household_memberships;

CREATE POLICY "Users can create memberships" ON household_memberships
  FOR INSERT WITH CHECK (
    -- User creating their own membership
    auth.uid() = user_id
    OR
    -- Owner creating virtual member (user_id is null)
    (user_id IS NULL AND is_household_owner(household_id, auth.uid()))
  );

-- Update SELECT policy to allow viewing virtual members
-- Virtual members are safe to view since they don't contain personal information
DROP POLICY IF EXISTS "Members can view memberships in their households" ON household_memberships;

CREATE POLICY "Members can view memberships in their households" ON household_memberships
  FOR SELECT USING (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
    OR user_id = auth.uid()  -- Users can always see their own memberships
    OR user_id IS NULL  -- Anyone can view virtual members (for claim flow)
  );

-- Allow users to claim virtual members (update user_id from null to their id)
DROP POLICY IF EXISTS "Users can update their own membership" ON household_memberships;
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
