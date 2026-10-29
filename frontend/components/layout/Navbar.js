'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Inbox,
  Users,
  Megaphone,
  BarChart3,
  LayoutGrid,
  Workflow,
  Store,
  GraduationCap,
  Scissors,
  UtensilsCrossed,
  Building2,
  Heart,
  Mail,
  HelpCircle,
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { siteConfig, mainNav } from '@/lib/site';
import styles from './Navbar.module.css';

const iconMap = {
  Inbox,
  Users,
  Megaphone,
  BarChart3,
  LayoutGrid,
  Workflow,
  Sparkles,
  Store,
  GraduationCap,
  Scissors,
  UtensilsCrossed,
  Building2,
  Heart,
  Mail,
  HelpCircle,
};

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className={styles.wrapper} ref={navRef}>
      {/* Section 1: Announcement Bar */}
      <div className={styles.announcement} role="region" aria-label="Announcement">
        <div className={`container ${styles.announcementInner}`}>
          <span className={styles.announcementBadge}>
            <Sparkles size={13} aria-hidden="true" />
            New
          </span>
          <span className={styles.announcementText}>{siteConfig.announcement}</span>
          <Link href="/pricing" className={styles.announcementLink}>
            See plans from ₹0/mo <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Section 2: Sticky Navigation Bar */}
      <div className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
        <div className={`container ${styles.navInner}`}>
          <Logo />

          <nav className={styles.desktopNav} aria-label="Main navigation">
            <ul className={styles.navList}>
              {mainNav.map((item) => {
                const hasItems = Array.isArray(item.items) && item.items.length > 0;
                const isOpen = openMenu === item.label;
                if (!hasItems) {
                  const active = pathname === item.href;
                  return (
                    <li key={item.label} className={styles.navItem}>
                      <Link
                        href={item.href}
                        className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li
                    key={item.label}
                    className={styles.navItem}
                    onMouseEnter={() => setOpenMenu(item.label)}
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    <button
                      type="button"
                      className={`${styles.navTrigger} ${isOpen ? styles.navLinkActive : ''}`}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      onClick={() => setOpenMenu(isOpen ? null : item.label)}
                    >
                      {item.label}
                      <ChevronDown
                        size={15}
                        className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                        aria-hidden="true"
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.98 }}
                          transition={{ duration: 0.16, ease: 'easeOut' }}
                          className={styles.dropdown}
                          role="menu"
                        >
                          <div className={styles.dropdownGrid}>
                            {item.items.map((sub) => {
                              const Icon = iconMap[sub.icon] || Sparkles;
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  role="menuitem"
                                  className={styles.dropdownItem}
                                  onClick={() => setOpenMenu(null)}
                                >
                                  <span className={styles.dropdownIcon}>
                                    <Icon size={18} aria-hidden="true" />
                                  </span>
                                  <span>
                                    <span className={styles.dropdownTitle}>{sub.label}</span>
                                    <span className={styles.dropdownDesc}>{sub.description}</span>
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.actions}>
            <Link href="/login" className={styles.loginLink}>
              Log in
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm">
              Start Free
              <ArrowRight size={16} className="arrow" aria-hidden="true" />
            </Link>
            <button
              type="button"
              className={styles.mobileToggle}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Animated Mobile Navigation */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className={styles.mobileDrawer}
            >
              <div className={`container ${styles.mobileInner}`}>
                <ul className={styles.mobileList}>
                  {mainNav.map((item) => {
                    const hasItems = Array.isArray(item.items) && item.items.length > 0;
                    const expanded = mobileExpanded === item.label;
                    if (!hasItems) {
                      return (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            className={styles.mobileLink}
                            onClick={() => setMobileOpen(false)}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    }
                    return (
                      <li key={item.label} className={styles.mobileGroup}>
                        <button
                          type="button"
                          className={styles.mobileTrigger}
                          aria-expanded={expanded}
                          onClick={() => setMobileExpanded(expanded ? null : item.label)}
                        >
                          <span>{item.label}</span>
                          <ChevronDown
                            size={16}
                            className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
                          />
                        </button>
                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className={styles.mobileSublist}
                            >
                              {item.items.map((sub) => {
                                const Icon = iconMap[sub.icon] || Sparkles;
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    className={styles.mobileSubitem}
                                    onClick={() => setMobileOpen(false)}
                                  >
                                    <Icon size={16} />
                                    <div>
                                      <div className={styles.mobileSubTitle}>{sub.label}</div>
                                      <div className={styles.mobileSubDesc}>{sub.description}</div>
                                    </div>
                                  </Link>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>
                <div className={styles.mobileCtas}>
                  <Link href="/login" className="btn btn-outline btn-block" onClick={() => setMobileOpen(false)}>
                    Log in
                  </Link>
                  <Link href="/register" className="btn btn-primary btn-block" onClick={() => setMobileOpen(false)}>
                    Start Free
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

