'use client';

import { useState, type FormEvent } from 'react';
import { API_URL } from '@/lib/api';

const MAX_MESSAGE_LENGTH = 500;

type Status = 'idle' | 'submitting' | 'success' | 'error';

// Local datetime-local inputs need "YYYY-MM-DDTHH:mm" with no timezone offset.
function nowForDateTimeLocal(): string {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

export default function SubmitPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [displayStart, setDisplayStart] = useState(nowForDateTimeLocal);
  const [displayHours, setDisplayHours] = useState(24);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch(`${API_URL}/wall-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          message,
          displayStart: new Date(displayStart).toISOString(),
          displayHours,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.content}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.jpg" alt="18g Coffee & Roastery" style={styles.logo} />
        <p style={styles.label}>THE MEMORY WALL</p>
        <div style={styles.divider} />

        <h1 style={styles.heading}>Leave a message.</h1>
        <h1 style={styles.heading}>Return to a memory.</h1>

        {status === 'success' ? (
          <div style={styles.successBox}>
            Thank you — your message is being reviewed and will appear on the wall soon.
          </div>
        ) : (
          <form style={styles.form} onSubmit={handleSubmit}>
            <label style={styles.field}>
              <span style={styles.fieldLabel}>Your Name (optional)</span>
              <input
                style={styles.input}
                value={name}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.fieldLabel}>Your Message</span>
              <textarea
                style={styles.textarea}
                rows={5}
                required
                maxLength={MAX_MESSAGE_LENGTH}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <span style={styles.charCount}>
                {message.length} / {MAX_MESSAGE_LENGTH}
              </span>
            </label>

            <div style={styles.fieldRow}>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Start Date</span>
                <input
                  type="datetime-local"
                  style={styles.input}
                  required
                  value={displayStart}
                  onChange={(e) => setDisplayStart(e.target.value)}
                />
              </label>

              <label style={styles.field}>
                <span style={styles.fieldLabel}>Display For (Hours)</span>
                <input
                  type="number"
                  style={styles.input}
                  required
                  min={1}
                  max={24}
                  value={displayHours}
                  onChange={(e) => setDisplayHours(Number(e.target.value))}
                />
              </label>
            </div>
            <p style={styles.hint}>
              Your message will show on the wall starting at this date/time, for up to 24 hours.
            </p>

            {status === 'error' && <p style={styles.errorText}>{errorMessage}</p>}

            <button type="submit" style={styles.submitBtn} disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#100C08',
    display: 'flex',
    justifyContent: 'center',
    padding: '64px 20px',
  },
  content: {
    width: '100%',
    maxWidth: 480,
  },
  logo: {
    height: 64,
    width: 64,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    color: '#F5ECD7',
    fontSize: 10,
    fontFamily: 'var(--font-raleway)',
    fontWeight: 700,
    letterSpacing: '5px',
    marginBottom: 24,
  },
  divider: {
    width: 48,
    height: 1,
    backgroundColor: '#C9A84C',
    opacity: 0.6,
    marginBottom: 28,
  },
  heading: {
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '2px',
    lineHeight: 1.4,
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
    marginTop: 40,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    position: 'relative' as const,
    flex: '1 1 160px',
  },
  fieldRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 20,
  },
  hint: {
    marginTop: -8,
    color: 'rgba(245,236,215,0.4)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
    lineHeight: 1.6,
  },
  fieldLabel: {
    color: 'rgba(245,236,215,0.55)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 6,
    padding: '12px 14px',
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 16,
    outline: 'none',
  },
  textarea: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 6,
    padding: '12px 14px',
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 16,
    outline: 'none',
    resize: 'vertical' as const,
  },
  charCount: {
    alignSelf: 'flex-end',
    color: 'rgba(245,236,215,0.4)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
  },
  submitBtn: {
    marginTop: 8,
    backgroundColor: 'transparent',
    border: '1px solid rgba(201,168,76,0.5)',
    borderRadius: 4,
    padding: '15px 32px',
    color: '#C9A84C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
  },
  errorText: {
    color: '#E5A15C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
  },
  successBox: {
    marginTop: 40,
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 15,
    lineHeight: 1.8,
    border: '1px solid rgba(201,168,76,0.3)',
    borderRadius: 8,
    padding: '24px 28px',
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
};
