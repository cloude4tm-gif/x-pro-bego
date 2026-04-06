import { SVGProps } from "react";

export function XProLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="xtop2" x1="6" y1="6" x2="42" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="xfront2" x1="6" y1="16" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284c7" />
          <stop offset="1" stopColor="#0c4a6e" />
        </linearGradient>
        <linearGradient id="xside2" x1="36" y1="10" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0369a1" />
          <stop offset="1" stopColor="#082f49" />
        </linearGradient>
      </defs>
      <polygon points="6,16 24,8 42,16 24,24" fill="url(#xtop2)" />
      <polygon points="6,16 6,38 24,46 24,24" fill="url(#xfront2)" />
      <polygon points="24,24 24,46 42,38 42,16" fill="url(#xside2)" />
      <polyline
        points="6,16 24,8 42,16"
        stroke="#67e8f9"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <line x1="24" y1="8" x2="24" y2="24" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.6" />
      <line x1="9" y1="21" x2="18" y2="37" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="18" y1="21" x2="9" y2="37" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="8,16 24,9.5 34,14 18,20.5" fill="white" opacity="0.12" />
    </svg>
  );
}

export default XProLogo;
