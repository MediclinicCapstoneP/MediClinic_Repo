-- ===================================================================
-- UPDATE OHARA CLINIC WITH LATITUDE AND LONGITUDE
-- ===================================================================

-- Updated INSERT statement for OHARA clinic with coordinates
INSERT INTO "public"."clinics" (
    "id", 
    "user_id", 
    "clinic_name", 
    "email", 
    "phone", 
    "website", 
    "address", 
    "city", 
    "state", 
    "zip_code", 
    "license_number", 
    "accreditation", 
    "tax_id", 
    "year_established", 
    "specialties", 
    "custom_specialties", 
    "services", 
    "custom_services", 
    "operating_hours", 
    "number_of_doctors", 
    "number_of_staff", 
    "description", 
    "status", 
    "created_at", 
    "updated_at", 
    "profile_pic_url",
    "latitude",
    "longitude"
) VALUES (
    '19631e43-5e2c-466d-84bc-9199123260d2', 
    '33e97e4b-39d7-4137-abb8-0f693ec49f4b', 
    'OHARA', 
    'rexloverem@gmail.com', 
    '098765432', 
    'sfsdffad', 
    'fsafafa', 
    'agfaf', 
    'agaga', 
    '1232', 
    '4563624532', 
    '544123512', 
    '325235', 
    '1990', 
    '{"Cardiology","Dermatology","Psychiatry"}', 
    '{}', 
    '{"Vaccination","General Consultation","Physical Therapy","Mental Health Services"}', 
    '{}', 
    '{"friday": {"open": "08:00", "close": "18:00"}, "monday": {"open": "08:00", "close": "18:00"}, "sunday": {"open": "10:00", "close": "14:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "16:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}}', 
    '5', 
    '10', 
    'hasjdhajhdjkhasjkda', 
    'approved', 
    '2025-08-26 13:29:12.232338+00', 
    '2025-08-28 06:59:38.120386+00', 
    'https://ovcafionidgcipmloius.supabase.co/storage/v1/object/public/user-uploads/images/1756364372988_520435577_30862235566755005_973602203329239855_n.jpg',
    14.5995,  -- Manila, Philippines latitude
    120.9842  -- Manila, Philippines longitude
)
ON CONFLICT (id) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = NOW();
