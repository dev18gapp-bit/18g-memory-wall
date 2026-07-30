'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

interface WallMessage {
  id: string;
  name: string | null;
  message: string;
  status: string;
  created_at: string;
  display_start: string;
  display_hours: number;
}

type Filter = 'pending' | 'approved' | 'rejected';

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('pending');
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('memoryWallAdminToken');
    if (!stored) {
      router.push('/admin/login');
      return;
    }
    setToken(stored);
  }, [router]);

  const load = useCallback(
    async (activeToken: string, activeFilter: Filter) => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/wall-admin/wall-messages?status=${activeFilter}`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });

        if (res.status === 401) {
          localStorage.removeItem('memoryWallAdminToken');
          router.push('/admin/login');
          return;
        }

        const data = await res.json();
        setMessages(data);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (token) load(token, filter);
  }, [token, filter, load]);

  async function review(id: string, status: 'approved' | 'rejected') {
    if (!token) return;
    setActingId(id);
    try {
      await fetch(`${API_URL}/wall-admin/wall-messages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setActingId(null);
    }
  }

  function signOut() {
    localStorage.removeItem('memoryWallAdminToken');
    router.push('/admin/login');
  }

  if (!token) return null;

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.label}>MEMORY WALL ADMIN</p>
          <div style={styles.divider} />
        </div>
        <button style={styles.signOutBtn} onClick={signOut}>
          Sign Out
        </button>
      </div>

      <div style={styles.tabs}>
        {(['pending', 'approved', 'rejected'] as Filter[]).map((f) => (
          <button
            key={f}
            style={{ ...styles.tab, ...(filter === f ? styles.tabActive : {}) }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={styles.emptyText}>Loading…</p>
      ) : messages.length === 0 ? (
        <p style={styles.emptyText}>Nothing here.</p>
      ) : (
        <div style={styles.list}>
          {messages.map((m) => (
            <div key={m.id} style={styles.card}>
              <p style={styles.message}>&ldquo;{m.message}&rdquo;</p>
              <p style={styles.meta}>
                {m.name || 'Anonymous'} · submitted {new Date(m.created_at).toLocaleString()}
              </p>
              <p style={styles.meta}>
                Displays {new Date(m.display_start).toLocaleString()} for {m.display_hours}h
              </p>

              {filter === 'pending' && (
                <div style={styles.actions}>
                  <button
                    style={styles.approveBtn}
                    disabled={actingId === m.id}
                    onClick={() => review(m.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    style={styles.rejectBtn}
                    disabled={actingId === m.id}
                    onClick={() => review(m.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#100C08',
    padding: 'clamp(24px, 5vw, 60px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  label: {
    color: '#F5ECD7',
    fontSize: 10,
    fontFamily: 'var(--font-raleway)',
    fontWeight: 700,
    letterSpacing: '4px',
    marginBottom: 12,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#C9A84C',
    opacity: 0.6,
  },
  signOutBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(245,236,215,0.2)',
    borderRadius: 4,
    padding: '8px 16px',
    color: 'rgba(245,236,215,0.6)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: 12,
    marginBottom: 32,
  },
  tab: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 4,
    padding: '8px 18px',
    color: 'rgba(245,236,215,0.5)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
  },
  tabActive: {
    borderColor: '#C9A84C',
    color: '#C9A84C',
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  emptyText: {
    color: 'rgba(245,236,215,0.4)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 14,
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    maxWidth: 720,
  },
  card: {
    border: '1px solid rgba(245,236,215,0.12)',
    borderRadius: 8,
    padding: '20px 24px',
  },
  message: {
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 15,
    lineHeight: 1.7,
    margin: 0,
  },
  meta: {
    marginTop: 12,
    color: 'rgba(245,236,215,0.4)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    letterSpacing: '0.5px',
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 18,
  },
  approveBtn: {
    backgroundColor: 'rgba(201,168,76,0.12)',
    border: '1px solid rgba(201,168,76,0.5)',
    borderRadius: 4,
    padding: '8px 20px',
    color: '#C9A84C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
  },
  rejectBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(245,236,215,0.2)',
    borderRadius: 4,
    padding: '8px 20px',
    color: 'rgba(245,236,215,0.5)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
  },
};
