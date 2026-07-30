'use client';

import { useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/api';
import SiteHeader from '@/components/site-header';

const POLL_INTERVAL_MS = 20_000;
const CYCLE_INTERVAL_MS = 8_000;

interface WallMessage {
  id: string;
  name: string | null;
  message: string;
  created_at: string;
}

export default function DisplayPage() {
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [index, setIndex] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [submitUrl, setSubmitUrl] = useState('');

  useEffect(() => {
    const origin = window.location.origin;
    setSubmitUrl(origin);

    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(origin, {
        width: 240,
        margin: 1,
        color: { dark: '#100C08', light: '#F5ECD7' },
      }).then(setQrDataUrl);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`${API_URL}/wall-messages`);
        if (!res.ok) return;
        const data: WallMessage[] = await res.json();
        if (!cancelled) setMessages(data);
      } catch {
        // ignore transient network errors, next poll will retry
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const messagesLength = messages.length;
  const indexRef = useRef(index);
  indexRef.current = index;

  useEffect(() => {
    if (messagesLength === 0) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % messagesLength);
    }, CYCLE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [messagesLength]);

  useEffect(() => {
    if (index >= messagesLength) setIndex(0);
  }, [messagesLength, index]);

  const current = messages[index];

  return (
    <>
      <SiteHeader />
      <main style={styles.page}>
        <p style={styles.label}>THE MEMORY WALL</p>
        <div style={styles.divider} />

        <div style={styles.stage}>
          {current ? (
            <div key={current.id} style={styles.messageBlock}>
              <p style={styles.messageText}>&ldquo;{current.message}&rdquo;</p>
              {current.name && <p style={styles.messageName}>— {current.name}</p>}
            </div>
          ) : (
            <p style={styles.emptyText}>Be the first to leave a message on the wall.</p>
          )}
        </div>

        <div style={styles.qrCorner}>
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt={`Scan to leave a message at ${submitUrl}`} style={styles.qrImage} />
          )}
          <p style={styles.qrCaption}>Scan to leave a message</p>
        </div>
      </main>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    position: 'relative' as const,
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#100C08',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 80px',
    overflow: 'hidden',
  },
  label: {
    position: 'absolute' as const,
    top: 172,
    color: 'rgba(245,236,215,0.5)',
    fontSize: 13,
    fontFamily: 'var(--font-raleway)',
    fontWeight: 700,
    letterSpacing: '8px',
  },
  divider: {
    position: 'absolute' as const,
    top: 212,
    width: 60,
    height: 1,
    backgroundColor: '#C9A84C',
    opacity: 0.6,
  },
  stage: {
    width: '100%',
    maxWidth: 1400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40vh',
    textAlign: 'center' as const,
  },
  messageBlock: {
    animation: 'fadeIn 0.8s ease',
  },
  messageText: {
    color: '#F5ECD7',
    fontFamily: 'var(--font-playfair)',
    fontSize: 'clamp(32px, 5vw, 68px)',
    fontWeight: 300,
    lineHeight: 1.35,
    margin: 0,
  },
  messageName: {
    marginTop: 32,
    color: '#C9A84C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  },
  emptyText: {
    color: 'rgba(245,236,215,0.4)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 20,
    fontWeight: 300,
  },
  qrCorner: {
    position: 'absolute' as const,
    bottom: 48,
    right: 60,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 10,
  },
  qrImage: {
    width: 130,
    height: 130,
    borderRadius: 8,
  },
  qrCaption: {
    color: 'rgba(245,236,215,0.6)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '1px',
  },
};
