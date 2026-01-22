'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

interface SlideInProps extends HTMLMotionProps<"div"> {
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
}

export const SlideIn = forwardRef<HTMLDivElement, SlideInProps>(({
  children,
  delay = 0,
  duration = 0.4,
  direction = 'up',
  distance = 30,
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

  const getFinalPosition = () => ({ x: 0, y: 0 })

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 1,
        ...getInitialPosition()
      }}
      animate={getFinalPosition()}
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

SlideIn.displayName = 'SlideIn'
