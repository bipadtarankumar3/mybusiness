import Link from 'next/link';
import { Globe, MessageSquareHeart, ShieldCheck, IndianRupee } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { siteConfig, footerNav } from '@/lib/site';
import styles from './Footer.module.css';

const socialItems = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'x', label: 'X (Twitter)' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.topGrid}>
          <div className={styles.brandCol}>
            <Logo />
            <p className={styles.brandDesc}>{siteConfig.description}</p>
            <div className={styles.pills}>
              <span className={styles.pill}>
                <IndianRupee size={14} aria-hidden="true" /> Transparent INR pricing
              </span>
              <span className={styles.pill}>
                <ShieldCheck size={14} aria-hidden="true" /> Official API ready
              </span>
              <span className={styles.pill}>
                <MessageSquareHeart size={14} aria-hidden="true" /> Built for SMBs
              </span>
            </div>

            <div className={styles.socials} aria-label="Social media">
              {socialItems.map((s) => {
                const url = siteConfig.social?.[s.key];
                if (url) {
                  return (
                    <a
                      key={s.key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLink}
                    >
                      <Globe size={14} aria-hidden="true" />
                      {s.label}
                    </a>
                  );
                }
                return (
                  <span
                    key={s.key}
                    className={styles.socialPlaceholder}
                    title={`Configure ${s.label} URL in frontend/lib/site.js`}
                  >
                    {s.label} · unconfigured
                  </span>
                );
              })}
            </div>
          </div>

          {footerNav.map((group) => (
            <div key={group.title} className={styles.navCol}>
              <h3 className={styles.colTitle}>{group.title}</h3>
              <ul className={styles.colList}>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={styles.colLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © {year} {siteConfig.name}. Built for growing Indian businesses.
          </p>
          <div className={styles.legalLinks}>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

