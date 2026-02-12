/*
  # Estructura Fitness Database Schema

  ## Overview
  Complete database schema for fitness training management app with trainer and client roles.

  ## New Tables Created

  ### 1. `profiles`
  User profile extension with role management and payment tracking
  - `id` (uuid, PK) - References auth.users
  - `role` (text) - User role: 'trainer' or 'client'
  - `full_name` (text) - User's full name
  - `payment_status` (boolean) - Whether client is current on payments
  - `payment_due_date` (date) - Next payment due date
  - `trainer_id` (uuid) - Reference to assigned trainer (for clients)
  - `created_at` (timestamptz) - Profile creation timestamp

  ### 2. `diet_plans`
  Meal plans created by trainers for clients
  - `id` (uuid, PK)
  - `client_id` (uuid) - Reference to client profile
  - `created_by` (uuid) - Reference to trainer who created it
  - `meal_name` (text) - Name of meal (e.g., "Desayuno", "Almuerzo")
  - `meal_description` (text) - What the meal should contain
  - `recommended_time` (time) - Suggested time to eat
  - `created_at` (timestamptz)

  ### 3. `meal_logs`
  Client meal consumption tracking
  - `id` (uuid, PK)
  - `client_id` (uuid) - Reference to client
  - `meal_time` (timestamptz) - When the meal was consumed
  - `meal_description` (text) - What was actually eaten
  - `diet_plan_id` (uuid, nullable) - Optional reference to diet plan
  - `created_at` (timestamptz)

  ### 4. `exercise_logs`
  Client exercise session tracking
  - `id` (uuid, PK)
  - `client_id` (uuid) - Reference to client
  - `exercise_name` (text) - Name/type of exercise
  - `duration_minutes` (integer) - Exercise duration
  - `exercise_time` (timestamptz) - When exercise was performed
  - `calories_burned` (integer) - Estimated calories burned
  - `notes` (text, nullable) - Additional notes
  - `created_at` (timestamptz)

  ### 5. `weight_logs`
  Client weight tracking
  - `id` (uuid, PK)
  - `client_id` (uuid) - Reference to client
  - `weight_kg` (decimal) - Weight in kilograms
  - `measured_at` (timestamptz) - When weight was measured
  - `created_at` (timestamptz)

  ### 6. `training_plans`
  Exercise plans created by trainers for clients
  - `id` (uuid, PK)
  - `client_id` (uuid) - Reference to client
  - `created_by` (uuid) - Reference to trainer
  - `exercise_name` (text) - Name of exercise
  - `sets` (integer) - Number of sets
  - `reps` (integer) - Number of repetitions
  - `notes` (text, nullable) - Additional instructions
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Trainers can view all their clients' data
  - Clients can only view/edit their own data
  - Clients with payment_status = false are restricted from accessing the app
  - All operations require authentication
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('trainer', 'client')),
  full_name text NOT NULL,
  payment_status boolean DEFAULT true,
  payment_due_date date,
  trainer_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create diet_plans table
CREATE TABLE IF NOT EXISTS diet_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id),
  meal_name text NOT NULL,
  meal_description text NOT NULL,
  recommended_time time,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;

-- Create meal_logs table
CREATE TABLE IF NOT EXISTS meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meal_time timestamptz NOT NULL,
  meal_description text NOT NULL,
  diet_plan_id uuid REFERENCES diet_plans(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

-- Create exercise_logs table
CREATE TABLE IF NOT EXISTS exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  exercise_time timestamptz NOT NULL,
  calories_burned integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Create weight_logs table
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg decimal(5,2) NOT NULL CHECK (weight_kg > 0),
  measured_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Create training_plans table
CREATE TABLE IF NOT EXISTS training_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id),
  exercise_name text NOT NULL,
  sets integer NOT NULL CHECK (sets > 0),
  reps integer NOT NULL CHECK (reps > 0),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Trainers can view their clients"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles trainer
      WHERE trainer.id = auth.uid()
      AND trainer.role = 'trainer'
      AND profiles.trainer_id = trainer.id
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Trainers can update their clients"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles trainer
      WHERE trainer.id = auth.uid()
      AND trainer.role = 'trainer'
      AND profiles.trainer_id = trainer.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles trainer
      WHERE trainer.id = auth.uid()
      AND trainer.role = 'trainer'
      AND profiles.trainer_id = trainer.id
    )
  );

-- RLS Policies for diet_plans
CREATE POLICY "Clients can view own diet plans"
  ON diet_plans FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Trainers can view their clients' diet plans"
  ON diet_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = diet_plans.client_id
      AND profiles.trainer_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can create diet plans for their clients"
  ON diet_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles trainer
      WHERE trainer.id = auth.uid()
      AND trainer.role = 'trainer'
      AND EXISTS (
        SELECT 1 FROM profiles client
        WHERE client.id = diet_plans.client_id
        AND client.trainer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Trainers can update their clients' diet plans"
  ON diet_plans FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Trainers can delete their clients' diet plans"
  ON diet_plans FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for meal_logs
CREATE POLICY "Clients can view own meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Trainers can view their clients' meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = meal_logs.client_id
      AND profiles.trainer_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create own meal logs"
  ON meal_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.payment_status = true
    )
  );

CREATE POLICY "Clients can update own meal logs"
  ON meal_logs FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can delete own meal logs"
  ON meal_logs FOR DELETE
  TO authenticated
  USING (client_id = auth.uid());

-- RLS Policies for exercise_logs
CREATE POLICY "Clients can view own exercise logs"
  ON exercise_logs FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Trainers can view their clients' exercise logs"
  ON exercise_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = exercise_logs.client_id
      AND profiles.trainer_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create own exercise logs"
  ON exercise_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.payment_status = true
    )
  );

CREATE POLICY "Clients can update own exercise logs"
  ON exercise_logs FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can delete own exercise logs"
  ON exercise_logs FOR DELETE
  TO authenticated
  USING (client_id = auth.uid());

-- RLS Policies for weight_logs
CREATE POLICY "Clients can view own weight logs"
  ON weight_logs FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Trainers can view their clients' weight logs"
  ON weight_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = weight_logs.client_id
      AND profiles.trainer_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create own weight logs"
  ON weight_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.payment_status = true
    )
  );

CREATE POLICY "Clients can update own weight logs"
  ON weight_logs FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can delete own weight logs"
  ON weight_logs FOR DELETE
  TO authenticated
  USING (client_id = auth.uid());

-- RLS Policies for training_plans
CREATE POLICY "Clients can view own training plans"
  ON training_plans FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Trainers can view their clients' training plans"
  ON training_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = training_plans.client_id
      AND profiles.trainer_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can create training plans for their clients"
  ON training_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles trainer
      WHERE trainer.id = auth.uid()
      AND trainer.role = 'trainer'
      AND EXISTS (
        SELECT 1 FROM profiles client
        WHERE client.id = training_plans.client_id
        AND client.trainer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Trainers can update their clients' training plans"
  ON training_plans FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Trainers can delete their clients' training plans"
  ON training_plans FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_trainer_id ON profiles(trainer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_diet_plans_client_id ON diet_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_client_id ON meal_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_client_id ON exercise_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_client_id ON weight_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_client_id ON training_plans(client_id);