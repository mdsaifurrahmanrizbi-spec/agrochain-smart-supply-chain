import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
const readDayMode = () => { try { return localStorage.getItem('agrochain-auth-theme') === 'day'; } catch { return false; } };
export const SproutNightBackground: React.FC = () => {
 const [day,setDay]=useState(readDayMode);
 const toggle=()=>{const next=!day;setDay(next);try{localStorage.setItem('agrochain-auth-theme',next?'day':'night')}catch{}document.documentElement.dataset.authTheme=next?'day':'night'};
 return <>
  <div className="sprout-night" aria-hidden="true"><svg className="sprout-night__scene" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
   <defs><linearGradient id="sprout-sky" x1="0" y1="0" x2=".9" y2="1"><stop stopColor={day?'#dff4ff':'#051c14'}/><stop offset="1" stopColor={day?'#9bd8c2':'#0f5a40'}/></linearGradient><radialGradient id="sprout-glow"><stop stopColor={day?'#fff4b0':'#b8f34a'} stopOpacity=".28"/><stop offset="1" stopColor={day?'#fff4b0':'#b8f34a'} stopOpacity="0"/></radialGradient></defs>
   <rect width="1440" height="900" fill="url(#sprout-sky)"/>
   {day?<circle cx="215" cy="145" r="54" fill="#fff0a8"/>:<><circle cx="215" cy="145" r="58" fill="#fff1bd"/><circle cx="242" cy="122" r="53" fill="#092a20"/>{[[74,68],[165,52],[320,80],[405,150],[115,205],[355,245],[525,68],[620,190],[740,95],[845,230],[980,74],[1100,145],[1250,55],[1360,190],[70,330],[250,300],[450,355],[690,310],[900,345],[1120,290],[1320,365],[570,30]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%4===0?2.6:1.6} fill="#fff9e8"/>)}</>}
   <ellipse cx="225" cy="565" rx="310" ry="300" fill="url(#sprout-glow)"/><ellipse cx="1215" cy="590" rx="300" ry="300" fill="url(#sprout-glow)"/>
   <path d="M0 630 Q220 540 430 620 T870 610 T1440 590 V900 H0Z" fill={day?'#72ad79':'#0d4937'}/><path d="M0 710 Q260 620 520 690 T1030 680 T1440 660 V900 H0Z" fill={day?'#397a50':'#073526'}/><path d="M0 795 Q270 720 600 780 T1120 760 T1440 785 V900 H0Z" fill={day?'#205638':'#031d15'}/>
   <g transform="translate(215 840)"><path d="M0 0 V-335" stroke="#b8f34a" strokeWidth="15" strokeLinecap="round"/><path d="M0 -230 C-72 -246 -102 -300 -103 -345 C-45 -333 -10 -297 0 -270Z" fill="#b8f34a"/><path d="M0 -190 C45 -290 120 -310 180 -305 C160 -220 93 -175 0 -160Z" fill="#8ee05a"/><path d="M0 -190 Q90 -235 153 -286" fill="none" stroke="#388d4a" strokeWidth="4"/><path d="M-58 0 Q0 -48 58 0Z" fill="#4a3321"/></g>
   <g transform="translate(1225 840) scale(.88)"><path d="M0 0 V-330" stroke="#b8f34a" strokeWidth="15" strokeLinecap="round"/><path d="M0 -210 C-78 -230 -105 -282 -105 -330 C-46 -319 -8 -282 0 -248Z" fill="#8ee05a"/><path d="M0 -180 C36 -276 90 -302 155 -302 C145 -220 80 -174 0 -150Z" fill="#6cc64e"/><path d="M0 -180 Q80 -218 135 -282" fill="none" stroke="#388d4a" strokeWidth="4"/><path d="M-58 0 Q0 -48 58 0Z" fill="#4a3321"/></g>
   <g transform="translate(65 890)"><path d="M0 0V-70" stroke="#218a5c" strokeWidth="5"/><path d="M0 -35C-32 -36 -44 -55 -45 -73C-18 -69 -3 -55 0 -35Z" fill="#24985d"/><path d="M0 -45C14 -73 36 -82 56 -81C52 -54 30 -41 0 -38Z" fill="#43b96e"/></g><g transform="translate(1370 890)"><path d="M0 0V-70" stroke="#218a5c" strokeWidth="5"/><path d="M0 -35C-32 -36 -44 -55 -45 -73C-18 -69 -3 -55 0 -35Z" fill="#24985d"/><path d="M0 -45C14 -73 36 -82 56 -81C52 -54 30 -41 0 -38Z" fill="#43b96e"/></g>
  </svg></div><button type="button" className="auth-theme-switch" onClick={toggle} aria-label={day?'Switch to night scene':'Switch to day scene'} title={day?'Switch to night':'Switch to day'}>{day?<Sun size={22}/>:<Moon size={22}/>}</button>
 </>;
};
export default SproutNightBackground;
