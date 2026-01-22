'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

interface ScaleInProps extends HTMLMotionProps<"div"> {
  delay?: number
  duration?: number
  scaleFrom?: number
  trigger?: boolean
}

export const ScaleIn = forwardRef<HTMLDivElement, ScaleInProps>(({
  children,
  delay = 0,
  duration = 0.3,
  scaleFrom = 0.9,
  trigger = true,
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ scale: scaleFrom, opacity: 0 }}
      animate={trigger ? { scale: 1, opacity: 1 } : { scale: scaleFrom, opacity: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
})

ScaleIn.displayName = 'ScaleIn'
