-- 0010: Direct Auth Provisioning (Zero-Email) & Koreksi Akun Wali Siswa
-- Mencegah pengiriman email transaksional live pada Supabase Free Tier dan memfasilitasi login aman.

CREATE OR REPLACE FUNCTION public.provision_auth_user_direct(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_phone text DEFAULT '',
  p_profile_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_encrypted_pw text;
  v_clean_email text := LOWER(TRIM(p_email));
BEGIN
  IF v_clean_email IS NULL OR v_clean_email = '' THEN
    RAISE EXCEPTION 'Email cannot be empty';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = v_clean_email;

  IF v_user_id IS NULL THEN
    IF p_profile_id IS NOT NULL THEN
      v_user_id := p_profile_id;
    ELSE
      SELECT id INTO v_user_id FROM public.profiles WHERE LOWER(email) = v_clean_email;
      IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
      END IF;
    END IF;
  END IF;

  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_clean_email,
    v_encrypted_pw,
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object(
      'sub', v_user_id::text,
      'role', p_role,
      'email', v_clean_email,
      'phone', COALESCE(p_phone, ''),
      'full_name', p_full_name,
      'email_verified', true,
      'phone_verified', false
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'role', p_role,
      'email', v_clean_email,
      'phone', COALESCE(p_phone, ''),
      'full_name', p_full_name,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    v_user_id::text,
    NOW(),
    NOW()
  )
  ON CONFLICT (provider_id, provider) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    phone_number,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_clean_email,
    p_full_name,
    p_role,
    'aktif',
    COALESCE(p_phone, ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone_number = EXCLUDED.phone_number,
    status = 'aktif',
    updated_at = NOW();

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.provision_auth_user_direct(text, text, text, text, text, uuid) TO anon, authenticated, service_role;

-- Koreksi email wali IMAM KANAFI dari saltik imam@gmai.com ke imam@gmail.com
UPDATE public.profiles 
SET email = 'imam@gmail.com', updated_at = NOW() 
WHERE id = 'fe25d2e9-a93b-4612-a357-65528d292261';

UPDATE public.registrations 
SET parent_email = 'imam@gmail.com', updated_at = NOW() 
WHERE id = '998d8261-9c5c-4902-a84b-a8265646ce4e';
