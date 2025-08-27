-- QUICK DIAGNOSTIC: Check Clinic Display Issues
-- Run this first to diagnose the problem

-- 1. Check if clinics table exists
SELECT 
    'Table Check' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'clinics' AND table_schema = 'public'
        ) THEN '✅ Clinics table exists'
        ELSE '❌ Clinics table does not exist'
    END as result;

-- 2. Check clinic counts by status
SELECT 
    'Clinic Count Check' as test_type,
    CONCAT(
        'Total: ', COUNT(*), 
        ' | Approved: ', COUNT(CASE WHEN status = 'approved' THEN 1 END),
        ' | Pending: ', COUNT(CASE WHEN status = 'pending' THEN 1 END)
    ) as result
FROM clinics;

-- 3. Check RLS policies
SELECT 
    'RLS Policy Check' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('✅ ', COUNT(*)::text, ' RLS policies exist')
        ELSE '❌ No RLS policies found'
    END as result
FROM pg_policies 
WHERE tablename = 'clinics';

-- 4. Check if public read access is allowed
SELECT 
    'Public Access Check' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'clinics' 
            AND cmd = 'SELECT' 
            AND (qual ILIKE '%approved%' OR roles @> ARRAY['anon'])
        ) THEN '✅ Public read access policy exists'
        ELSE '❌ No public read access policy'
    END as result;

-- 5. Show approved clinics (if any)
SELECT 
    'Sample Approved Clinics' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('✅ ', COUNT(*)::text, ' approved clinics available')
        ELSE '❌ No approved clinics found'
    END as result
FROM clinics
WHERE status = 'approved';

-- 6. If approved clinics exist, show a few examples
SELECT 
    clinic_name,
    city,
    status,
    created_at
FROM clinics 
WHERE status = 'approved'
ORDER BY created_at DESC
LIMIT 3;

-- 7. Final recommendation
SELECT 
    'Recommendation' as test_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM clinics WHERE status = 'approved') = 0 THEN
            '🔧 Run fix_clinic_display_comprehensive.sql to add test clinics'
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'clinics' 
            AND cmd = 'SELECT' 
            AND qual ILIKE '%approved%'
        ) THEN
            '🔧 Run fix_clinic_display_comprehensive.sql to fix RLS policies'
        ELSE
            '✅ Database looks good! Check frontend code and browser console'
    END as result;