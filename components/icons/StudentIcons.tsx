import React from 'react';

export const CoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="8"></circle>
        <path d="M12 18V6"></path>
        <path d="M16 14c-2 0-3-1-3-3s1-3 3-3"></path>
    </svg>
);

export const FlameIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
    </svg>
);

export const BookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5V4.5A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
);

export const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export const GraduationCapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
        <path d="M6 12v5c3.33 1.67 6.67 1.67 10 0v-5"></path>
    </svg>
);

export const ClipboardCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <path d="m9 14 2 2 4-4"></path>
    </svg>
);

export const BrainCircuitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 5a3 3 0 1 0-5.993.119c.005.06.01.121.018.181A3 3 0 0 0 12 8a3 3 0 0 0 5.975-1.558A3.002 3.002 0 0 0 12 5Z"></path>
        <path d="M12 12a3 3 0 1 0-5.993.119c.005.06.01.121.018.181A3 3 0 0 0 12 15a3 3 0 0 0 5.975-1.558A3.002 3.002 0 0 0 12 12Z"></path>
        <path d="M15 12a3 3 0 1 0-5.993.119c.005.06.01.121.018.181A3 3 0 0 0 15 15a3 3 0 0 0 5.975-1.558A3.002 3.002 0 0 0 15 12Z"></path>
        <path d="M9 12a3 3 0 1 0-5.993.119c.005.06.01.121.018.181A3 3 0 0 0 9 15a3 3 0 0 0 5.975-1.558A3.002 3.002 0 0 0 9 12Z"></path>
        <path d="M12 19a3 3 0 1 0-5.993.119c.005.06.01.121.018.181A3 3 0 0 0 12 22a3 3 0 0 0 5.975-1.558A3.002 3.002 0 0 0 12 19Z"></path>
        <path d="M9 5a3 3 0 1 0-5.993.119c.005.06.01.121.018.181A3 3 0 0 0 9 8a3 3 0 0 0 5.975-1.558A3.002 3.002 0 0 0 9 5Z"></path>
        <path d="M15 5a3 3 0 1 0-5.993.119c.005.06.01.121.018.181A3 3 0 0 0 15 8a3 3 0 0 0 5.975-1.558A3.002 3.002 0 0 0 15 5Z"></path>
        <path d="M6.025 6.5A3 3 0 0 0 9 8a3 3 0 0 0 3-2.442"></path>
        <path d="M12 8a3 3 0 0 0 3-2.442"></path>
        <path d="M15.025 6.5A3 3 0 0 0 18 8a3 3 0 0 0 3-2.442"></path>
        <path d="M6.025 13.5A3 3 0 0 0 9 15a3 3 0 0 0 3-2.442"></path>
        <path d="M12 15a3 3 0 0 0 3-2.442"></path>
        <path d="M15.025 13.5A3 3 0 0 0 18 15a3 3 0 0 0 3-2.442"></path>
        <path d="M6.025 20.5A3 3 0 0 0 9 22a3 3 0 0 0 3-2.442"></path>
        <path d="M12 22a3 3 0 0 0 3-2.442"></path>
        <path d="M15.025 20.5A3 3 0 0 0 18 22a3 3 0 0 0 3-2.442"></path>
    </svg>
);

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 3L9.27 9.27L3 12l6.27 2.73L12 21l2.73-6.27L21 12l-6.27-2.73L12 3z"></path>
        <path d="M4.5 4.5L6 6"></path>
        <path d="M18 6l1.5-1.5"></path>
        <path d="M20 19l-1.5-1.5"></path>
        <path d="M6 18l-1.5 1.5"></path>
    </svg>
);

export const PathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4 11a9 9 0 0 1 9 9"></path>
        <path d="M4 4a16 16 0 0 1 16 16"></path>
        <circle cx="5" cy="19" r="1"></circle>
    </svg>
);

export const MessageCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

export const UploadCloudIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
        <path d="M12 12v9"></path>
        <path d="m16 16-4-4-4 4"></path>
    </svg>
);

export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

export const LayersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
    </svg>
);

export const CalculatorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
      <line x1="8" y1="6" x2="16" y2="6"></line>
      <line x1="12" y1="10" x2="12" y2="18"></line>
      <line x1="8" y1="14" x2="16" y2="14"></line>
    </svg>
  );

export const GraphIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 3v18h18" />
    <path d="M18 17a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2" />
    <path d="M12 3v10" />
  </svg>
);

export const CodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  );

export const LanguagesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m5 8 6 6"></path>
      <path d="m4 14 6-6 2-3"></path>
      <path d="M2 5h12"></path>
      <path d="M7 2h1"></path>
      <path d="m22 22-5-10-5 10"></path>
      <path d="M14 18h6"></path>
    </svg>
  );

export const ScienceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.5 2h-5L4 7.5 9.5 22h5L20 7.5 14.5 2z"></path>
    <path d="M7 12h10"></path>
  </svg>
);

export const HistoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M8 22h8"></path>
        <path d="M6 18h12"></path>
        <path d="M7 14h10"></path>
        <path d="M12 4v10"></path>
        <path d="M5 4h14"></path>
    </svg>
);


export const LiteratureIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5V4.5A2.5 2.5 0 0 1 6.5 2z"></path>
    <path d="m14 2-5 15"></path>
  </svg>
);

export const ArtIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a7 7 0 1 0 10 10" />
  </svg>
);

export const MusicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 18V5l12-2v13"></path>
    <circle cx="6" cy="18" r="3"></circle>
    <circle cx="18" cy="16" r="3"></circle>
  </svg>
);

export const DebateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 11v-1a2 2 0 0 0-4 0v1" />
    <path d="m7 11-1.29-1.29a2.4 2.4 0 0 0-3.42 0 2.4 2.4 0 0 0 0 3.42l5.12 5.12a2.4 2.4 0 0 0 3.42 0l5.12-5.12a2.4 2.4 0 0 0 0-3.42 2.4 2.4 0 0 0-3.42 0L11 11" />
  </svg>
);

export const FinanceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 11v-1a2 2 0 0 1 4 0v1" />
      <path d="M17.3 7.3a10 10 0 1 1-10.6 10.6" />
      <path d="m13 11 1.29-1.29a2.4 2.4 0 0 1 3.42 0 2.4 2.4 0 0 1 0 3.42l-5.12 5.12a2.4 2.4 0 0 1-3.42 0L2.7 12.1a2.4 2.4 0 0 1 0-3.42 2.4 2.4 0 0 1 3.42 0L7 11" />
    </svg>
);

export const EngineeringIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></path>
        <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
        <path d="M12 2v2"></path>
        <path d="M12 22v-2"></path>
        <path d="m17 20.66-1-1.73"></path>
        <path d="m11 10.27 1 1.73"></path>
        <path d="m7 3.34 1 1.73"></path>
        <path d="m13 13.73-1-1.73"></path>
        <path d="m17 3.34-1 1.73"></path>
        <path d="m11 13.73 1 1.73"></path>
        <path d="m7 20.66 1-1.73"></path>
        <path d="m13 10.27-1 1.73"></path>
        <path d="M4 12H2"></path>
        <path d="M22 12h-2"></path>
    </svg>
);

// --- NEW ICONS FOR REDESIGN ---

export const BeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4.5 3h15"></path>
        <path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"></path>
        <path d="M6 14h12"></path>
    </svg>
);

export const FlaskIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9 3h6"></path>
        <path d="M10 3v5.47A5 5 0 0 0 8.01 13H8"></path>
        <path d="M14 3v5.47A5 5 0 0 1 15.99 13H16"></path>
        <path d="M4.5 13h15"></path>
        <path d="M6 13l3.32 8.29A2 2 0 0 0 11.23 22h1.54a2 2 0 0 0 1.91-1.28L18 13"></path>
    </svg>
);

export const TimelineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 10a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <path d="M7 8v8"></path>
        <path d="M12 8v8"></path>
        <path d="M17 8v8"></path>
    </svg>
);

export const BookshelfIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M20 22H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2z"></path>
        <path d="M2 16h20"></path><path d="M2 8h20"></path><path d="M8 4v16"></path>
        <path d="M16 4v16"></path>
    </svg>
);

export const GearsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></path>
        <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
        <path d="M12 2v2"></path><path d="M12 22v-2"></path>
        <path d="m17 20.66-1-1.73"></path><path d="m11 10.27 1 1.73"></path>
        <path d="m7 3.34 1 1.73"></path><path d="m13 13.73-1-1.73"></path>
        <path d="m17 3.34-1 1.73"></path><path d="m11 13.73 1 1.73"></path>
        <path d="m7 20.66 1-1.73"></path><path d="m13 10.27-1 1.73"></path>
    </svg>
);

export const PiggyBankIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M19.8 15.7a2 2 0 0 0-1.2-3.1l-6-1.5a1 1 0 0 1-.7-1.1l1-5.3a2 2 0 0 0-2-2.1H9.3a2 2 0 0 0-1.8 1.2L5 11.5"></path>
        <path d="M5.3 12.3a2 2 0 0 0 0 2.4l.2.3a2 2 0 0 0 2.5 1h1.3a2 2 0 0 1 1.7.9l.8 1.2a2 2 0 0 0 1.8 1.1h1.3a2 2 0 0 0 2-2v-2.3"></path>
        <path d="M16.5 10.5h.9a2 2 0 0 1 2 2v.4a2 2 0 0 0 2 2h0a2 2 0 0 0-2-2h-.4"></path>
    </svg>
);

export const BalanceScaleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m16 16 3-8 3 8c-.83.5-1.9.5-2.75 0s-1.92-.5-2.75 0c-.83.5-1.92.5-2.75 0a5 5 0 0 1-2.75 0c-.83.5-1.9.5-2.75 0s-1.92-.5-2.75 0L2 8l3 8"></path>
        <path d="M7 16h10"></path><path d="M12 4v16"></path><path d="M3 8h4"></path>
        <path d="M17 8h4"></path>
    </svg>
);