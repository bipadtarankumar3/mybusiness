import Link from 'next/link';
import { siteConfig } from '@/lib/site';
import styles from './Logo.module.css';

export function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={styles.mark}>
      <defs>
        <linearGradient id="cf-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22D792" />
          <stop offset="1" stopColor="#087F5B" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#cf-logo-g)" />
      <path d="M17 23a7 7 0 0 1 7-7h16a7 7 0 0 1 7 7v11a7 7 0 0 1-7 7h-9l-8.5 7v-7H24a7 7 0 0 1-7-7z" fill="#fff" />
      <path d="M24 30c2.6-4.2 6.2-4.2 8 0s5.4 4.2 8 0" stroke="#16C784" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ href = '/', light = false, size = 36 }) {
  return (
    <Link href={href} className={`${styles.logo} ${light ? styles.light : ''}`} aria-label={`${siteConfig.name} home`}>
      <LogoMark size={size} />
      <span className={styles.word}>{siteConfig.name}</span>
    </Link>
  );
}

