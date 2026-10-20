import Link from 'next/link';
import Image from 'next/image';
import acmLogo from './acm-logo.png';

export function AcmLogo({ compact = false }) {
  return (
    <Link className={`acm-lockup${compact ? ' acm-lockup-compact' : ''}`} href="/" aria-label="ACM campus events home">
      <span className="acm-mark" aria-hidden="true">
        <Image
          src={acmLogo}
          alt="ACM Logo"
          width={compact ? 36 : 42}
          height={compact ? 22 : 26}
          className="acm-logo-img"
          priority
        />
      </span>
    </Link>
  );
}
