    -- Enable realtime
    ALTER PUBLICATION supabase_realtime ADD TABLE pcs;
    ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

    -- Create PCS table first (no foreign keys)
    CREATE TABLE IF NOT EXISTS pcs (
    id SERIAL PRIMARY KEY,
    pc_number VARCHAR(50) UNIQUE NOT NULL,
    ip_address VARCHAR(45) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('offline', 'online', 'pending', 'maintenance')),
    session_started_at TIMESTAMP NULL,
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create SESSIONS table (references pcs)
    CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pc_id INTEGER NOT NULL REFERENCES pcs(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'rejected')),
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Add current_session_id to pcs AFTER sessions exists
    ALTER TABLE pcs 
    ADD COLUMN IF NOT EXISTS current_session_id UUID UNIQUE NULL REFERENCES sessions(id) ON DELETE SET NULL;

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_pcs_ip_address ON pcs(ip_address);
    CREATE INDEX IF NOT EXISTS idx_pcs_status ON pcs(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_pc_id ON sessions(pc_id);

    -- Auto-update timestamp function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Triggers
    DROP TRIGGER IF EXISTS pcs_updated_at_trigger ON pcs;
    CREATE TRIGGER pcs_updated_at_trigger
    BEFORE UPDATE ON pcs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS sessions_updated_at_trigger ON sessions;
    CREATE TRIGGER sessions_updated_at_trigger
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- Insert PC data (PC-1 to PC-20) with null IP addresses
    INSERT INTO pcs (pc_number, ip_address, status) 
    VALUES 
        ('PC-1', NULL, 'offline'),
        ('PC-2', NULL, 'offline'),
        ('PC-3', NULL, 'offline'),
        ('PC-4', NULL, 'offline'),
        ('PC-5', NULL, 'offline'),
        ('PC-6', NULL, 'offline'),
        ('PC-7', NULL, 'offline'),
        ('PC-8', NULL, 'offline'),
        ('PC-9', NULL, 'offline'),
        ('PC-10', NULL, 'offline'),
        ('PC-11', NULL, 'offline'),
        ('PC-12', NULL, 'offline'),
        ('PC-13', NULL, 'offline'),
        ('PC-14', NULL, 'offline'),
        ('PC-15', NULL, 'offline'),
        ('PC-16', NULL, 'offline'),
        ('PC-17', NULL, 'offline'),
        ('PC-18', NULL, 'offline'),
        ('PC-19', NULL, 'offline'),
        ('PC-20', NULL, 'offline')
    ON CONFLICT (pc_number) DO NOTHING;
