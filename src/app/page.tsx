'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { API_URL } from '@/lib/api';
import SiteHeader from '@/components/site-header';

const MAX_MESSAGE_LENGTH = 500;
const MAX_DISPLAY_HOURS = 5;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6MB — keep in sync with my-api's wallMessages.ts

type Status = 'idle' | 'submitting' | 'success' | 'error';

// Local datetime-local inputs need "YYYY-MM-DDTHH:mm" with no timezone offset.
function nowForDateTimeLocal(): string {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export default function SubmitPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [displayStart, setDisplayStart] = useState(nowForDateTimeLocal);
  const [displayHours, setDisplayHours] = useState(MAX_DISPLAY_HOURS);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Revoke the preview object URL when it's replaced or the page unmounts.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMessage('That photo is too large — please choose one under 6MB.');
      return;
    }

    setErrorMessage('');
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const image = imageFile
        ? { data: await readFileAsBase64(imageFile), contentType: imageFile.type }
        : undefined;

      const res = await fetch(`${API_URL}/wall-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          message,
          displayStart: new Date(displayStart).toISOString(),
          displayHours,
          ...(image ? { image } : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setStatus('success');
      clearImage();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <>
      <SiteHeader />
      <main style={styles.page}>
      <div style={styles.content}>
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

            <div style={styles.field}>
              <span style={styles.fieldLabel}>Add a Photo (optional)</span>
              <input
                type="file"
                accept="image/*"
                id="wall-image-input"
                style={styles.hiddenFileInput}
                onChange={handleImageChange}
              />
              {imagePreview ? (
                <div style={styles.imagePreviewWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Selected preview" style={styles.imagePreview} />
                  <button type="button" style={styles.removeImageBtn} onClick={clearImage}>
                    Remove photo
                  </button>
                </div>
              ) : (
                <label htmlFor="wall-image-input" style={styles.fileBtn}>
                  Choose an image
                </label>
              )}
            </div>

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
                  max={MAX_DISPLAY_HOURS}
                  value={displayHours}
                  onChange={(e) => setDisplayHours(Number(e.target.value))}
                />
              </label>
            </div>
            <p style={styles.hint}>
              Your message will show on the wall starting at this date/time, for up to {MAX_DISPLAY_HOURS} hours.
            </p>

            {status === 'error' && <p style={styles.errorText}>{errorMessage}</p>}

            <button type="submit" style={styles.submitBtn} disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
      </main>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#100C08',
    display: 'flex',
    justifyContent: 'center',
    padding: 'clamp(180px, 24vh, 260px) 20px 64px',
  },
  content: {
    width: '100%',
    maxWidth: 480,
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
  hiddenFileInput: {
    position: 'absolute' as const,
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: 0,
  },
  fileBtn: {
    display: 'inline-block',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px dashed rgba(201,168,76,0.4)',
    borderRadius: 6,
    padding: '12px 18px',
    color: 'rgba(245,236,215,0.7)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.5px',
    cursor: 'pointer',
  },
  imagePreviewWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  imagePreview: {
    width: 72,
    height: 72,
    objectFit: 'cover' as const,
    borderRadius: 8,
    border: '1px solid rgba(201,168,76,0.3)',
  },
  removeImageBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(245,236,215,0.2)',
    borderRadius: 4,
    padding: '8px 14px',
    color: 'rgba(245,236,215,0.6)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
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
