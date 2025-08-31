import * as React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

export function UploadIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 19V6" />
      <path d="M5 12l7-7 7 7" />
      <path d="M5 19h14" />
    </svg>
  );
}


