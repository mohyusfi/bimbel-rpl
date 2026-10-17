const STEPS = [
  {
    num: '1',
    title: 'Isi formulir',
    desc: 'Masukkan data anak, sekolah, paket yang dipilih, dan nomor WhatsApp orang tua.',
  },
  {
    num: '2',
    title: 'Kami hubungi Anda',
    desc: 'Admin mengecek kursi yang masih tersedia, lalu menghubungi lewat WhatsApp untuk jadwal kelas pertama.',
  },
  {
    num: '3',
    title: 'Ikut kelas pertama gratis',
    desc: 'Rasakan dulu cara tutor mengajar. Setelah itu, Anda yang memutuskan mau lanjut atau tidak.',
  },
] as const

export function StepsSection() {
  return (
    <section id="cara-daftar" className="lp-section lp-steps-section">
      <div className="container">
        <header className="lp-section-head">
          <h2 className="lp-h2">Tiga langkah untuk mulai</h2>
          <p>Tidak perlu datang ke kantor untuk mendaftar. Semuanya bisa dari HP.</p>
        </header>

        <ol className="lp-steps">
          {STEPS.map((step) => (
            <li key={step.num} className="lp-step">
              <span className="lp-step-num" aria-hidden="true">
                {step.num}
              </span>
              <div className="lp-step-body">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
