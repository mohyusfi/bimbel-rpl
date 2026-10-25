import type { Variants, Transition } from 'motion/react'

export const transitionSmooth: Transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
}

export const transitionQuick: Transition = {
  duration: 0.25,
  ease: [0.22, 1, 0.36, 1],
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionSmooth,
  },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitionSmooth,
  },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitionSmooth,
  },
}

export const staggerContainer = (
  staggerChildren = 0.09,
  delayChildren = 0
): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
})

export const viewportConfig = {
  once: true,
  amount: 0.15,
} as const
