import { cn } from '~/lib/utils'
import { motion, type Variants } from 'motion/react'
import {
  fadeInUp,
  staggerContainer,
  viewportConfig,
} from '~/lib/motion'

const timelineItemLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
}

const timelineItemRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
}

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
        <motion.header
          className="lp-section-head"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <h2 className="lp-h2">Tiga langkah untuk mulai</h2>
          <p>Tidak perlu datang ke kantor untuk mendaftar. Semuanya bisa dari HP.</p>
        </motion.header>

        {/* Timeline Container */}
        <div className="relative max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto mt-12 md:mt-16 lg:mt-20">
          {/* Garis Vertikal Timeline */}
          <motion.div
            className="absolute top-5 bottom-5 left-6 md:left-1/2 -translate-x-1/2 w-[2px] bg-[#000000] origin-top"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            viewport={viewportConfig}
            aria-hidden="true"
          />

          <motion.ol
            className="list-none space-y-10 md:space-y-16 lg:space-y-20 p-0 m-0"
            variants={staggerContainer(0.28, 0.2)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {STEPS.map((step, idx) => {
              const isLeft = idx % 2 === 0
              return (
                <motion.li
                  key={step.num}
                  variants={isLeft ? timelineItemLeft : timelineItemRight}
                  className={cn(
                    'relative flex items-center',
                    'flex-row md:justify-between',
                    !isLeft && 'md:flex-row-reverse'
                  )}
                >
                  {/* Kartu Langkah */}
                  <motion.div
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className={cn(
                      'ml-16 md:ml-0 md:w-[calc(50%-40px)] lg:w-[calc(50%-48px)]',
                      'bg-[#FFFFFF] border-[1.5px] border-[#000000] rounded-[4px]',
                      'p-5 sm:p-6 lg:p-8 xl:p-9',
                      'relative z-10 transition-shadow duration-200'
                    )}
                  >
                    <h3 className="font-display font-bold text-lg sm:text-xl lg:text-2xl xl:text-[1.65rem] text-[#000000] tracking-tight mb-2 lg:mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base lg:text-lg text-[#555555] leading-relaxed">
                      {step.desc}
                    </p>
                  </motion.div>

                  {/* Garis Konektor Horizontal - Mobile */}
                  <div
                    className="absolute left-6 w-10 h-[2px] bg-[#000000] md:hidden"
                    aria-hidden="true"
                  />

                  {/* Garis Konektor Horizontal - Desktop */}
                  <div
                    className={cn(
                      'hidden md:block absolute top-1/2 -translate-y-1/2 h-[2px] bg-[#000000] w-10 lg:w-12',
                      isLeft
                        ? 'left-[calc(50%-40px)] lg:left-[calc(50%-48px)]'
                        : 'left-1/2'
                    )}
                    aria-hidden="true"
                  />

                  {/* Node Lingkaran Timeline */}
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'absolute left-6 md:left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20',
                      'w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#CB2957] border-2 border-[#000000] text-[#FFFFFF]',
                      'font-display font-bold text-sm lg:text-base flex items-center justify-center select-none shadow-xs'
                    )}
                    aria-hidden="true"
                  >
                    {step.num}
                  </motion.div>

                  {/* Spacer Desktop untuk menyeimbangkan flexbox */}
                  <div
                    className="hidden md:block md:w-[calc(50%-40px)] lg:w-[calc(50%-48px)]"
                    aria-hidden="true"
                  />
                </motion.li>
              )
            })}
          </motion.ol>
        </div>
      </div>
    </section>
  )
}
