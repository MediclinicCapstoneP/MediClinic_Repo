-- ===================================================================
-- CLINIC SERVICES WITH PRICING TABLE
-- ===================================================================
-- This script creates a table to store individual services offered by clinics
-- with their specific pricing, allowing for service-based price filtering

-- ===================================================================
-- 1. CLINIC SERVICES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.clinic_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Service details
    service_name TEXT NOT NULL,
    service_category TEXT CHECK (service_category IN (
        'consultation', 'routine_checkup', 'follow_up', 'emergency', 
        'specialist_visit', 'vaccination', 'procedure', 'surgery', 
        'lab_test', 'imaging', 'physical_therapy', 'mental_health', 
        'dental', 'vision', 'other'
    )),
    description TEXT,
    
    -- Pricing information
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    currency TEXT DEFAULT 'PHP',
    
    -- Service availability
    is_available BOOLEAN DEFAULT true,
    duration_minutes INTEGER, -- Expected duration of service
    
    -- Additional pricing options
    has_insurance_coverage BOOLEAN DEFAULT false,
    insurance_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    senior_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    student_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Service requirements
    requires_appointment BOOLEAN DEFAULT true,
    requires_referral BOOLEAN DEFAULT false,
    min_age INTEGER,
    max_age INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique service names per clinic
    UNIQUE(clinic_id, service_name)
);

-- ===================================================================
-- 2. CLINIC SERVICE PACKAGES (Optional - for bundled services)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.clinic_service_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Package details
    package_name TEXT NOT NULL,
    description TEXT,
    
    -- Pricing
    package_price DECIMAL(10,2) NOT NULL CHECK (package_price >= 0),
    individual_total_price DECIMAL(10,2), -- Sum of individual service prices
    savings_amount DECIMAL(10,2), -- How much patient saves with package
    
    -- Package availability
    is_available BOOLEAN DEFAULT true,
    validity_days INTEGER DEFAULT 365, -- How long package is valid
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, package_name)
);

-- ===================================================================
-- 3. PACKAGE SERVICE MAPPING
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.package_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES public.clinic_service_packages(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.clinic_services(id) ON DELETE CASCADE NOT NULL,
    
    -- Service quantity in package
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(package_id, service_id)
);

-- ===================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic_id ON clinic_services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_services_category ON clinic_services(service_category);
CREATE INDEX IF NOT EXISTS idx_clinic_services_price ON clinic_services(base_price);
CREATE INDEX IF NOT EXISTS idx_clinic_services_available ON clinic_services(is_available);

CREATE INDEX IF NOT EXISTS idx_clinic_service_packages_clinic_id ON clinic_service_packages(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_service_packages_price ON clinic_service_packages(package_price);

CREATE INDEX IF NOT EXISTS idx_package_services_package_id ON package_services(package_id);
CREATE INDEX IF NOT EXISTS idx_package_services_service_id ON package_services(service_id);

-- ===================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ===================================================================
ALTER TABLE clinic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_services ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ===================================================================

-- Clinic Services Policies
CREATE POLICY "Clinics can manage their own services" ON clinic_services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = clinic_services.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view available clinic services" ON clinic_services
    FOR SELECT USING (is_available = true);

-- Clinic Service Packages Policies
CREATE POLICY "Clinics can manage their own packages" ON clinic_service_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clinics 
            WHERE clinics.id = clinic_service_packages.clinic_id 
            AND clinics.user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view available packages" ON clinic_service_packages
    FOR SELECT USING (is_available = true);

-- Package Services Policies
CREATE POLICY "Clinics can manage package services" ON package_services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clinic_service_packages csp
            JOIN clinics c ON c.id = csp.clinic_id
            WHERE csp.id = package_services.package_id 
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view package services" ON package_services
    FOR SELECT USING (true);

-- ===================================================================
-- 7. CREATE TRIGGERS FOR UPDATED_AT
-- ===================================================================
CREATE TRIGGER update_clinic_services_updated_at 
    BEFORE UPDATE ON clinic_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_service_packages_updated_at 
    BEFORE UPDATE ON clinic_service_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 8. INSERT DEFAULT SERVICES FOR EXISTING CLINICS
-- ===================================================================
-- Add default services with pricing for all approved clinics
INSERT INTO clinic_services (clinic_id, service_name, service_category, base_price, description, duration_minutes)
SELECT 
    c.id as clinic_id,
    'General Consultation' as service_name,
    'consultation' as service_category,
    500.00 as base_price,
    'Standard medical consultation with licensed physician' as description,
    30 as duration_minutes
FROM clinics c 
WHERE c.status = 'approved'
ON CONFLICT (clinic_id, service_name) DO NOTHING;

INSERT INTO clinic_services (clinic_id, service_name, service_category, base_price, description, duration_minutes)
SELECT 
    c.id as clinic_id,
    'Routine Checkup' as service_name,
    'routine_checkup' as service_category,
    400.00 as base_price,
    'Comprehensive health screening and physical examination' as description,
    45 as duration_minutes
FROM clinics c 
WHERE c.status = 'approved'
ON CONFLICT (clinic_id, service_name) DO NOTHING;

INSERT INTO clinic_services (clinic_id, service_name, service_category, base_price, description, duration_minutes)
SELECT 
    c.id as clinic_id,
    'Follow-up Visit' as service_name,
    'follow_up' as service_category,
    300.00 as base_price,
    'Follow-up consultation for ongoing treatment' as description,
    20 as duration_minutes
FROM clinics c 
WHERE c.status = 'approved'
ON CONFLICT (clinic_id, service_name) DO NOTHING;

-- Add specialty-specific services for clinics with those specialties
INSERT INTO clinic_services (clinic_id, service_name, service_category, base_price, description, duration_minutes)
SELECT 
    c.id as clinic_id,
    'Cardiology Consultation' as service_name,
    'specialist_visit' as service_category,
    800.00 as base_price,
    'Specialized cardiac examination and consultation' as description,
    60 as duration_minutes
FROM clinics c 
WHERE c.status = 'approved' 
AND (
    'Cardiology' = ANY(c.specialties) OR 
    'Cardiology' = ANY(c.custom_specialties)
)
ON CONFLICT (clinic_id, service_name) DO NOTHING;

INSERT INTO clinic_services (clinic_id, service_name, service_category, base_price, description, duration_minutes)
SELECT 
    c.id as clinic_id,
    'Emergency Care' as service_name,
    'emergency' as service_category,
    1200.00 as base_price,
    'Emergency medical care and treatment' as description,
    90 as duration_minutes
FROM clinics c 
WHERE c.status = 'approved' 
AND (
    'Emergency Medicine' = ANY(c.specialties) OR 
    'Emergency Medicine' = ANY(c.custom_specialties)
)
ON CONFLICT (clinic_id, service_name) DO NOTHING;

INSERT INTO clinic_services (clinic_id, service_name, service_category, base_price, description, duration_minutes)
SELECT 
    c.id as clinic_id,
    'Vaccination' as service_name,
    'vaccination' as service_category,
    250.00 as base_price,
    'Immunization and vaccination services' as description,
    15 as duration_minutes
FROM clinics c 
WHERE c.status = 'approved'
ON CONFLICT (clinic_id, service_name) DO NOTHING;
