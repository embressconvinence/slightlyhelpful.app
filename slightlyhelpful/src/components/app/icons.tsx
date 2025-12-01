import React from 'react';

export const ArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <path d="M5 19L19 5"/>
        <path d="M12 5H19V12"/>
    </svg>
);

export const PanIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M5 9l-3 3 3 3"/>
        <path d="M9 5l3-3 3 3"/>
        <path d="M15 19l-3 3-3-3"/>
        <path d="M19 9l3 3-3 3"/>
        <path d="M2 12h20"/>
        <path d="M12 2v20"/>
    </svg>
);

export const ScalingIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M21 3 9 15"/>
        <path d="M12 3H3v9"/>
        <path d="M21 12v9H12"/>
    </svg>
);

export const SlightlyHelpfulIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M39.6,29.8h11.3c8,0,13.7,1.5,17,4.5c3.3,3,5,7.7,5,14.1c0,5.2-1.2,9.3-3.6,12.3c-2.4,3-6.1,5.1-11,6.3 v0.3c3.9,0.7,7,2.5,9.2,5.2c2.2,2.8,3.3,6.5,3.3,11.3c0,5.7-1.4,10.2-4.1,13.5c-2.7,3.3-7,5-12.8,5H39.6V29.8z M50.9,64.2h3.3 c2.8,0,4.9-0.5,6.4-1.6c1.5-1.1,2.3-2.9,2.3-5.3c0-2.6-0.8-4.5-2.3-5.6c-1.5-1.1-3.7-1.7-6.4-1.7h-3.3V64.2z M50.9,80.4h4.1 c3.2,0,5.6-0.6,7.2-1.7c1.6-1.1,2.4-3.1,2.4-5.8c0-2.8-0.8-4.9-2.5-6.2c-1.7-1.3-4-2-7.2-2h-4.1V80.4z"
            fill="#F44336"
        />
        <path
            d="M26.4,75.4c1.6-3.8,4.1-7.2,7.5-9.9c3.4-2.7,7.4-4.5,11.9-5.3c-4-2.1-7.4-5-9.9-8.7c-2.5-3.7-4-8-4.4-12.7 c-0.1-0.9-0.2-1.9-0.2-2.8c0-5.9,2.1-11.2,6.2-15.8c4.1-4.6,9.6-7.2,16-7.2c6.5,0,12,2.6,16,7.2c4.1,4.6,6.2,9.9,6.2,15.8 c0,6.6-2.2,12.4-6.5,17.4c-4.3,5-10.2,8.2-17.5,9.6"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
