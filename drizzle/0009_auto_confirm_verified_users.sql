-- 0009: Otomatisasi Konfirmasi Email Supabase Auth untuk Pengguna Terverifikasi
-- Menyediakan fungsi SECURITY DEFINER public.confirm_verified_user dan trigger pendaftaran.

-- 1. Fungsi verifikasi & aktivasi instan
CREATE OR REPLACE FUNCTION public.confirm_verified_user(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verified boolean := false;
BEGIN
  IF user_email IS NULL OR TRIM(user_email) = '' THEN
    RETURN false;
  END IF;

  -- Cek kelayakan email: hanya jika sudah diverifikasi admin di tabel registrations atau aktif di profiles
  SELECT EXISTS (
    SELECT 1 FROM public.registrations 
    WHERE (LOWER(student_email) = LOWER(user_email) OR LOWER(parent_email) = LOWER(user_email))
      AND status = 'terverifikasi'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(email) = LOWER(user_email)
      AND status = 'aktif'
  ) INTO v_verified;

  IF NOT v_verified THEN
    RETURN false;
  END IF;

  -- Konfirmasi akun di auth.users secara atomik (confirmed_at adalah kolom ter-generate otomatis)
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE LOWER(email) = LOWER(user_email);

  RETURN true;
END;
$$;
--> statement-breakpoint

-- Berikan izin pemanggilan RPC kepada anon, authenticated, dan service_role
GRANT EXECUTE ON FUNCTION public.confirm_verified_user(text) TO anon, authenticated, service_role;
--> statement-breakpoint

-- 2. Fungsi trigger saat pendaftaran disetujui admin
CREATE OR REPLACE FUNCTION public.trg_auto_confirm_on_registration_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'terverifikasi' AND (OLD.status IS DISTINCT FROM 'terverifikasi') THEN
    IF NEW.student_email IS NOT NULL THEN
      PERFORM public.confirm_verified_user(NEW.student_email);
    END IF;
    IF NEW.parent_email IS NOT NULL THEN
      PERFORM public.confirm_verified_user(NEW.parent_email);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_registration_approval_auto_confirm ON public.registrations;
--> statement-breakpoint

CREATE TRIGGER trg_registration_approval_auto_confirm
  AFTER INSERT OR UPDATE OF status
  ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_auto_confirm_on_registration_approval();
--> statement-breakpoint

-- 3. Pembaruan data historis: konfirmasi semua akun auth.users yang datanya sudah terverifikasi
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.registrations
      WHERE (LOWER(student_email) = LOWER(auth.users.email) OR LOWER(parent_email) = LOWER(auth.users.email))
        AND status = 'terverifikasi'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE LOWER(email) = LOWER(auth.users.email)
        AND status = 'aktif'
    )
  );
