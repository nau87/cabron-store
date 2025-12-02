-- Script de diagnóstico para ver qué está pasando

-- 1. Ver todos los usuarios en auth.users
SELECT id, email, raw_user_meta_data->>'role' as role_meta
FROM auth.users;

-- 2. Ver todos los perfiles en user_profiles
SELECT id, email, role
FROM user_profiles;

-- 3. Ver las políticas RLS actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'user_profiles';

-- 4. Ver la estructura de user_profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
