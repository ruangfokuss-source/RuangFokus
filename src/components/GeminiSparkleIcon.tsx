import React from 'react';

interface GeminiSparkleIconProps {
  className?: string;
  animated?: boolean;
}

/**
 * 4-color Google Gemini Sparkle Star matching the top-left icon in reference screenshots
 */
export const GeminiSparkleIcon: React.FC<GeminiSparkleIconProps> = ({
  className = 'w-5 h-5',
  animated = false,
}) => {
  const uid = React.useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animated ? 'animate-spin' : ''}`}
      style={animated ? { animationDuration: '3.2s' } : undefined}
      aria-hidden="true"
    >
      <path
        d="M14 1.5C14 8.40356 19.5964 14 26.5 14C19.5964 14 14 19.5964 14 26.5C14 19.5964 8.40356 14 1.5 14C8.40356 14 14 8.40356 14 1.5Z"
        fill={`url(#gemini_four_color_${uid})`}
      />
      <path
        d="M14 1.5C14 8.40356 19.5964 14 26.5 14L14 14L14 1.5Z"
        fill={`url(#gemini_tr_${uid})`}
      />
      <path
        d="M14 26.5C14 19.5964 19.5964 14 26.5 14L14 14L14 26.5Z"
        fill={`url(#gemini_br_${uid})`}
      />
      <path
        d="M14 26.5C14 19.5964 8.40356 14 1.5 14L14 14L14 26.5Z"
        fill={`url(#gemini_bl_${uid})`}
      />
      <path
        d="M14 1.5C14 8.40356 8.40356 14 1.5 14L14 14L14 1.5Z"
        fill={`url(#gemini_tl_${uid})`}
      />
      <defs>
        <linearGradient
          id={`gemini_four_color_${uid}`}
          x1="1.5"
          y1="1.5"
          x2="26.5"
          y2="26.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#EA4335" />
          <stop offset="100%" stopColor="#34A853" />
        </linearGradient>
        <linearGradient
          id={`gemini_tl_${uid}`}
          x1="4"
          y1="14"
          x2="14"
          y2="3"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#EA4335" />
          <stop offset="100%" stopColor="#4285F4" />
        </linearGradient>
        <linearGradient
          id={`gemini_tr_${uid}`}
          x1="14"
          y1="3"
          x2="24"
          y2="14"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="100%" stopColor="#34A853" />
        </linearGradient>
        <linearGradient
          id={`gemini_br_${uid}`}
          x1="24"
          y1="14"
          x2="14"
          y2="25"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34A853" />
          <stop offset="100%" stopColor="#FBBC05" />
        </linearGradient>
        <linearGradient
          id={`gemini_bl_${uid}`}
          x1="4"
          y1="14"
          x2="14"
          y2="25"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#EA4335" />
          <stop offset="100%" stopColor="#FBBC05" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/**
 * Diagonal 3-dot loading indicator matching the AI thinking indicator in image_5cf14dc2.png
 */
export const GeminiLoadingDots: React.FC = () => {
  return (
    <div
      className="inline-flex items-center justify-center w-6 h-6 select-none"
      aria-label="Gemini sedang mengetik..."
      role="status"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="7"
          cy="8"
          r="1.7"
          fill="#e3e3e3"
          className="animate-pulse"
          style={{ animationDelay: '0ms', animationDuration: '1.1s' }}
        />
        <circle
          cx="11.5"
          cy="11.5"
          r="2.1"
          fill="#ffffff"
          className="animate-pulse"
          style={{ animationDelay: '220ms', animationDuration: '1.1s' }}
        />
        <circle
          cx="16"
          cy="15"
          r="1.5"
          fill="#c4c7c5"
          className="animate-pulse"
          style={{ animationDelay: '440ms', animationDuration: '1.1s' }}
        />
      </svg>
    </div>
  );
};

/**
 * Authentic "Gambar / Nano Banana" icon matching close-up image_e2202fa8.png
 * and top header icon in image_b35cf25c.png
 */
export const NanoBananaImageIcon: React.FC<{
  className?: string;
  yellowAccent?: boolean;
}> = ({ className = 'w-4 h-4', yellowAccent = false }) => {
  if (yellowAccent) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M15.2 7.8C15.5 11.4 12.8 14.6 8.8 15.2C10.8 16.4 13.8 15.8 15.4 13.8C16.8 12.1 16.7 9.5 15.2 7.8Z"
          fill="#FACC15"
          stroke="#FACC15"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 15.1C11.7 14.3 14.1 11.7 14.8 8.3"
          stroke="#FACC15"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Exact outline icon from image_e2202fa8.png (rounded frame + landscape waves + banana outline)
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.85"
      />
      {/* Left horizon curve */}
      <path
        d="M3.2 14.5C5.2 12.8 7.5 12.8 9.2 14.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Right horizon curve */}
      <path
        d="M16.2 14.2C17.8 13.2 19.4 13.5 20.8 14.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Outlined Banana in center */}
      <path
        d="M14.8 7.2C15.2 11.2 12.4 14.8 8.2 15.4C10.5 17.2 14.3 16.4 16.1 13.9C17.4 11.9 17.1 9.0 14.8 7.2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Small dark square badge with solid up/down triangles matching top-right of composer in image_d5da615a.png
 */
export const ExpandComposerIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[5px] bg-[#2a2b2e] text-[#c4c7c5] hover:text-white transition-colors ${className}`}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="w-3.5 h-3.5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M8 3L11 6.2H5L8 3Z" fill="currentColor" />
        <path d="M8 13L5 9.8H11L8 13Z" fill="currentColor" />
      </svg>
    </span>
  );
};

/**
 * Proportional Aspect Ratio outline icon matching image_d34122c9.png
 */
export const AspectRatioShapeIcon: React.FC<{
  ratio: 'Rasio aspek' | '1:1' | '9:16' | '3:4' | '4:3' | '16:9';
}> = ({ ratio }) => {
  switch (ratio) {
    case '1:1':
      return (
        <span className="inline-block w-3.5 h-3.5 border-[1.6px] border-current rounded-[2px] shrink-0" />
      );
    case '9:16':
      return (
        <span className="inline-block w-2 h-3.5 border-[1.6px] border-current rounded-[2px] shrink-0" />
      );
    case '3:4':
      return (
        <span className="inline-block w-2.5 h-3.5 border-[1.6px] border-current rounded-[2px] shrink-0" />
      );
    case '4:3':
      return (
        <span className="inline-block w-3.5 h-2.5 border-[1.6px] border-current rounded-[2px] shrink-0" />
      );
    case '16:9':
      return (
        <span className="inline-block w-4 h-2 border-[1.6px] border-current rounded-[2px] shrink-0" />
      );
    default:
      // Default "Rasio aspek" icon with corner ticks matching image_d34122c9.png
      return (
        <svg
          viewBox="0 0 18 14"
          fill="none"
          className="w-4 h-3.5 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="1.2"
            y="1.2"
            width="15.6"
            height="11.6"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M4 5.5V4H5.5M14 8.5V10H12.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

/**
 * Authentic "Sesuaikan" hexagonal nut icon with center dot matching image_3fc15c69.png
 */
export const GeminiCustomizeIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2.75L20 7.375V16.625L12 21.25L4 16.625V7.375L12 2.75Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
};

/**
 * Authentic "Video" rounded rectangle with play emblem matching image_3fc15c69.png
 */
export const GeminiVideoIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2.75"
        y="4.75"
        width="18.5"
        height="14.5"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M10.25 9.25L15 12L10.25 14.75V9.25Z"
        fill="currentColor"
      />
    </svg>
  );
};
