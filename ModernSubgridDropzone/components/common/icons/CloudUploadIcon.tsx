import * as React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

export function CloudUploadIcon({ size = 24, className, ...props }: IconProps) {
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
      <path d="M20 16.5A4.5 4.5 0 0 0 18 8h-1.26A7 7 0 1 0 4 15" />
      <path d="M12 12v8" />
      <path d="M8 16l4-4 4 4" />
    </svg>
  );
}


