-- Script para hacer admin a cabron.ind@gmail.com

-- 1. Actualizar el role en user_profiles
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'cabron.ind@gmail.com';

-- 2. Verificar que se actualizó correctamente
SELECT id, email, full_name, role
FROM user_profiles
WHERE email = 'cabron.ind@gmail.com';
