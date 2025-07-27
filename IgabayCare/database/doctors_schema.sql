-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    years_experience INTEGER,
    availability TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'on-leave', 'inactive')),
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_patients INTEGER DEFAULT 0,
    profile_picture_url TEXT,
    profile_picture_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);

-- Enable Row Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow clinic owners to manage their doctors
CREATE POLICY "Clinic owners can manage their doctors" ON doctors
    FOR ALL USING (
        clinic_id IN (
            SELECT id FROM clinics WHERE user_id = auth.uid()
        )
    );

-- Allow doctors to view their own profile
CREATE POLICY "Doctors can view their own profile" ON doctors
    FOR SELECT USING (user_id = auth.uid());

-- Allow authenticated users to view active doctors (for patient search)
CREATE POLICY "Anyone can view active doctors" ON doctors
    FOR SELECT USING (status = 'active');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_doctors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_doctors_updated_at(); 