-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Households table
CREATE TABLE households (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT DEFAULT encode(gen_random_bytes(6), 'hex') UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Household memberships (links users to households)
CREATE TABLE household_memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member' NOT NULL,
  color TEXT NOT NULL,
  display_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, household_id)
);

-- Chores table
CREATE TABLE chores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium' NOT NULL,
  assignee_id UUID REFERENCES household_memberships(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  due_time TIME,
  recurrence_rule TEXT,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Chore completions (for recurring chores)
CREATE TABLE chore_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chore_id UUID REFERENCES chores(id) ON DELETE CASCADE NOT NULL,
  instance_date DATE NOT NULL,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(chore_id, instance_date)
);

-- Indexes for performance
CREATE INDEX idx_household_memberships_user ON household_memberships(user_id);
CREATE INDEX idx_household_memberships_household ON household_memberships(household_id);
CREATE INDEX idx_chores_household ON chores(household_id);
CREATE INDEX idx_chores_assignee ON chores(assignee_id);
CREATE INDEX idx_chores_due_date ON chores(due_date);
CREATE INDEX idx_chore_completions_chore ON chore_completions(chore_id);
CREATE INDEX idx_households_invite_code ON households(invite_code);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Households: Users can view households they're members of
CREATE POLICY "Members can view household" ON households
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_memberships
      WHERE household_memberships.household_id = households.id
      AND household_memberships.user_id = auth.uid()
    )
  );

-- Anyone can view households by invite code (for joining)
CREATE POLICY "Anyone can view household by invite code" ON households
  FOR SELECT USING (true);

-- Only authenticated users can create households
CREATE POLICY "Authenticated users can create households" ON households
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Owners can update their household
CREATE POLICY "Owners can update household" ON households
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM household_memberships
      WHERE household_memberships.household_id = households.id
      AND household_memberships.user_id = auth.uid()
      AND household_memberships.role = 'owner'
    )
  );

-- Owners can delete their household
CREATE POLICY "Owners can delete household" ON households
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM household_memberships
      WHERE household_memberships.household_id = households.id
      AND household_memberships.user_id = auth.uid()
      AND household_memberships.role = 'owner'
    )
  );

-- Household memberships
CREATE POLICY "Members can view memberships in their households" ON household_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_memberships AS my_membership
      WHERE my_membership.household_id = household_memberships.household_id
      AND my_membership.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own membership" ON household_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" ON household_memberships
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own membership" ON household_memberships
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete any membership in their household" ON household_memberships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM household_memberships AS owner_membership
      WHERE owner_membership.household_id = household_memberships.household_id
      AND owner_membership.user_id = auth.uid()
      AND owner_membership.role = 'owner'
    )
  );

-- Chores: Members can view chores in their households
CREATE POLICY "Members can view chores" ON chores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_memberships
      WHERE household_memberships.household_id = chores.household_id
      AND household_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create chores" ON chores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_memberships
      WHERE household_memberships.household_id = chores.household_id
      AND household_memberships.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Members can update chores" ON chores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM household_memberships
      WHERE household_memberships.household_id = chores.household_id
      AND household_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete chores" ON chores
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM household_memberships
      WHERE household_memberships.household_id = chores.household_id
      AND household_memberships.user_id = auth.uid()
    )
  );

-- Chore completions
CREATE POLICY "Members can view completions" ON chore_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chores
      JOIN household_memberships ON household_memberships.household_id = chores.household_id
      WHERE chores.id = chore_completions.chore_id
      AND household_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create completions" ON chore_completions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chores
      JOIN household_memberships ON household_memberships.household_id = chores.household_id
      WHERE chores.id = chore_completions.chore_id
      AND household_memberships.user_id = auth.uid()
    )
    AND auth.uid() = completed_by
  );

CREATE POLICY "Members can delete completions" ON chore_completions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chores
      JOIN household_memberships ON household_memberships.household_id = chores.household_id
      WHERE chores.id = chore_completions.chore_id
      AND household_memberships.user_id = auth.uid()
    )
  );

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
