import React from 'react';

/** Decorative inline-SVG night garden shared by the public auth pages. */
export const SproutNightBackground: React.FC = () => (
  <div className="sprout-night" aria-hidden="true">
    <svg className="sprout-night__scene" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sprout-sky" x1="0" y1="0" x2="0.9" y2="1"><stop stopColor="#051c14"/><stop offset="1" stopColor="#0f5a40"/></linearGradient>
        <radialGradient id="sprout-glow"><stop stopColor="#b8f34a" stopOpacity=".42"/><stop offset="1" stopColor="#b8f34a" stopOpacity="0"/></radialGradient>
        <filter id="sprout-blur"><feGaussianBlur stdDeviation="22"/></filter>
      </defs>
      <rect width="1440" height="900" fill="url(#sprout-sky)"/>
      <circle cx="215" cy="145" r="72" fill="#fff1bd" className="sprout-moon-halo"/>
      <circle cx="246" cy="119" r="66" fill="#06251b"/>
      {Array.from({length:22},(_,i)=><circle key={i} cx={(i*173+47)%1400+20} cy={(i*97+39)%410+20} r={i%4===0?2.8:1.8} fill="#fff9e8" className="sprout-star" style={{animationDelay:`${(i%5)*.63}s`}} />)}
      {Array.from({length:12},(_,i)=><circle key={i} cx={(i*211+80)%1400+10} cy={(i*131+200)%560+90} r="3.4" fill="#ffe7a0" className="sprout-firefly" style={{animationDelay:`${(i%6)*.8}s`}} />)}
      <ellipse cx="225" cy="565" rx="310" ry="300" fill="url(#sprout-glow)" filter="url(#sprout-blur)"/>
      <ellipse cx="1215" cy="590" rx="300" ry="300" fill="url(#sprout-glow)" filter="url(#sprout-blur)"/>
      <path d="M0 630 Q220 540 430 620 T870 610 T1440 590 V900 H0Z" fill="#0d4937"/>
      <path d="M0 710 Q260 620 520 690 T1030 680 T1440 660 V900 H0Z" fill="#073526"/>
      <path d="M0 795 Q270 720 600 780 T1120 760 T1440 785 V900 H0Z" fill="#031d15"/>
      <g className="sprout-plant sprout-plant--left" transform="translate(215 840)">
        <path d="M0 0 V-335" stroke="#b8f34a" strokeWidth="15" strokeLinecap="round"/>
        <path d="M0 -230 C-72 -246 -102 -300 -103 -345 C-45 -333 -10 -297 0 -270Z" fill="#b8f34a"/>
        <path d="M0 -190 C45 -290 120 -310 180 -305 C160 -220 93 -175 0 -160Z" fill="#8ee05a"/>
        <path d="M0 -190 Q90 -235 153 -286" fill="none" stroke="#388d4a" strokeWidth="4"/>
        <path d="M-58 0 Q0 -48 58 0Z" fill="#4a3321"/>
      </g>
      <g className="sprout-plant sprout-plant--right" transform="translate(1225 840) scale(.88)">
        <path d="M0 0 V-330" stroke="#b8f34a" strokeWidth="15" strokeLinecap="round"/>
        <path d="M0 -210 C-78 -230 -105 -282 -105 -330 C-46 -319 -8 -282 0 -248Z" fill="#8ee05a"/>
        <path d="M0 -180 C36 -276 90 -302 155 -302 C145 -220 80 -174 0 -150Z" fill="#6cc64e"/>
        <path d="M0 -180 Q80 -218 135 -282" fill="none" stroke="#388d4a" strokeWidth="4"/>
        <path d="M-58 0 Q0 -48 58 0Z" fill="#4a3321"/>
      </g>
      <g className="sprout-small" transform="translate(65 890)"><path d="M0 0V-70" stroke="#218a5c" strokeWidth="5" strokeLinecap="round"/><path d="M0 -35C-32 -36 -44 -55 -45 -73C-18 -69 -3 -55 0 -35Z" fill="#24985d"/><path d="M0 -45C14 -73 36 -82 56 -81C52 -54 30 -41 0 -38Z" fill="#43b96e"/></g>
      <g className="sprout-small" transform="translate(1370 890)"><path d="M0 0V-70" stroke="#218a5c" strokeWidth="5" strokeLinecap="round"/><path d="M0 -35C-32 -36 -44 -55 -45 -73C-18 -69 -3 -55 0 -35Z" fill="#24985d"/><path d="M0 -45C14 -73 36 -82 56 -81C52 -54 30 -41 0 -38Z" fill="#43b96e"/></g>
    </svg>
  </div>
);

export default SproutNightBackground;
