-- Actualizar vista customer_balances para incluir todos los usuarios no-admin
-- y manejar mejor el full_name

DROP VIEW IF EXISTS customer_balances;

CREATE OR REPLACE VIEW customer_balances AS
SELECT 
  u.id as customer_id,
  COALESCE(
    up.full_name, 
    u.raw_user_meta_data->>'full_name',
    u.email
  ) as full_name,
  u.email,
  COALESCE(SUM(cat.amount), 0) as balance
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN customer_account_transactions cat ON u.id = cat.customer_id
WHERE COALESCE(up.role, 'customer') != 'admin'
GROUP BY u.id, up.full_name, u.email, u.raw_user_meta_data;
