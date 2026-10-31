// app/(main)/admin/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emailOrPhone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Sign up failed.');
        return;
      }

      setDone(true);
    } catch (err) {
      console.error('Admin signup error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          padding: 32,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>
            Request Admin Access
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
            An existing admin will need to approve your account before you can log in.
          </p>
        </div>

        {done ? (
          <div
            style={{
              background: '#ecfdf5',
              color: '#065f46',
              fontSize: 13,
              padding: '14px 16px',
              borderRadius: 10,
              textAlign: 'center',
            }}
          >
            Request submitted. You'll be able to log in once an admin approves your account.
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={() => router.push('/admin/login')}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  background: '#111827',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Go to login
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  color: '#111827',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Email or Phone
              </label>
              <input
                type="text"
                value={emailOrPhone}
                onChange={e => setEmailOrPhone(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  color: '#111827',
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  color: '#111827',
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  fontSize: 13,
                  padding: '10px 14px',
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: 10,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#9ca3af' : '#111827',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {loading ? 'Submitting…' : 'Request Access'}
            </button>

            <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 16 }}>
              Already approved?{' '}
              <button
                type="button"
                onClick={() => router.push('/admin/login')}
                style={{ color: '#111827', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Log in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}