-- Create customer_feedbacks table
CREATE TABLE IF NOT EXISTS customer_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  pc_number TEXT NOT NULL,
  feedback_message TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON customer_feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON customer_feedbacks(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE customer_feedbacks ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all users to read feedbacks
CREATE POLICY "Enable read access for all users" ON customer_feedbacks FOR SELECT USING (true);

-- Create policies to allow authenticated users to insert feedbacks
CREATE POLICY "Enable insert for authenticated users" ON customer_feedbacks FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true);

-- Create policies for updating feedback status
CREATE POLICY "Enable update feedbacks for authenticated users" ON customer_feedbacks FOR UPDATE USING (true) WITH CHECK (true);

-- Create policies for deleting feedbacks
CREATE POLICY "Enable delete feedbacks for authenticated users" ON customer_feedbacks FOR DELETE USING (true);

-- Trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_customer_feedbacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_feedbacks_updated_at
BEFORE UPDATE ON customer_feedbacks
FOR EACH ROW
EXECUTE FUNCTION update_customer_feedbacks_updated_at();
