"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
}

export function ScrollReveal({ 
  children, 
  delay = 0, 
  direction = "up", 
  duration = 0.6 
}: ScrollRevealProps) {
  const directions = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
    none: {},
  };

  const offset = directions[direction];

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...offset,
        scale: 0.95 
      }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        x: 0,
        scale: 1 
      }}
      viewport={{ 
        once: false, 
        amount: 0.15,
        margin: "-50px"
      }}
      transition={{ 
        duration, 
        delay, 
        ease: [0.16, 1, 0.3, 1] 
      }}
    >
      {children}
    </motion.div>
  );
}
