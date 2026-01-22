'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  once?: boolean
  margin?: string
}

export const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(({
  children,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  distance = 30,
  once = true,
  margin = "-100px",
  ...props
}, ref) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: distance }
      case 'down': return { y: -distance }
      case 'left': return { x: distance }
      case 'right': return { x: -distance }
      default: return { y: distance }
    }
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...getInitialPosition() }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0
      }}
      viewport={{
        once,
        margin
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuart
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
})

ScrollReveal.displayName = 'ScrollReveal'
