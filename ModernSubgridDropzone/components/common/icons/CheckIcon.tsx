import * as React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

export function CheckIcon({ size = 24, className, ...props }: IconProps) {
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
      <path d="M20 6 9 17 4 12" />
    </svg>
  );
}


