import { motion } from "framer-motion";

interface XProLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export default function XProLogo({ size = 36, className = "", animated = true }: XProLogoProps) {
  const Wrapper = animated ? motion.div : "div";
  const animProps = animated
    ? {
        animate: { rotateY: [0, 10, -10, 0] },
        transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const },
        style: { transformStyle: "preserve-3d" as const, perspective: 400 },
      }
    : {};

  return (
    <Wrapper className={className} {...animProps}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="xpro-top" x1="4" y1="4" x2="32" y2="12" gradientUnits="userSpaceOnUse">
            <stop stopColor="#67e8f9" />
            <stop offset="1" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="xpro-front" x1="4" y1="12" x2="28" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284c7" />
            <stop offset="1" stopColor="#0c4a6e" />
          </linearGradient>
          <linearGradient id="xpro-side" x1="28" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0369a1" />
            <stop offset="1" stopColor="#082f49" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 3D Box - top face */}
        <polygon points="4,12 18,6 32,12 18,18" fill="url(#xpro-top)" />
        {/* 3D Box - front face */}
        <polygon points="4,12 4,28 18,34 18,18" fill="url(#xpro-front)" />
        {/* 3D Box - right face */}
        <polygon points="18,18 18,34 32,28 32,12" fill="url(#xpro-side)" />

        {/* Edge highlights */}
        <polyline points="4,12 18,6 32,12" stroke="#67e8f9" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        <line x1="18" y1="6" x2="18" y2="18" stroke="#7dd3fc" strokeWidth="0.5" opacity="0.6" />
        <line x1="4" y1="12" x2="4" y2="28" stroke="#38bdf8" strokeWidth="0.5" opacity="0.4" />
        <line x1="18" y1="18" x2="18" y2="34" stroke="#0ea5e9" strokeWidth="0.4" opacity="0.4" />

        {/* "X" letter on front face (skewed) */}
        <g filter="url(#glow)">
          <line x1="7" y1="16" x2="13" y2="28" stroke="#e0f2fe" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="13" y1="16" x2="7" y2="28" stroke="#e0f2fe" strokeWidth="1.6" strokeLinecap="round" />
        </g>

        {/* Shine on top */}
        <polygon points="6,12 18,7.2 26,10.5 14,15.3" fill="white" opacity="0.12" />
      </svg>
    </Wrapper>
  );
}
