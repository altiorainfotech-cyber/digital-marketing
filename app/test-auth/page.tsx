'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleLogin = async () => {
    setResult(null);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setResult(res);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Authentication Test Page</h1>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
        <h2>Session Status: {status}</h2>
        {session ? (
          <div>
            <p>✅ Authenticated as: {session.user?.email}</p>
            <p>Role: {session.user?.role}</p>
            <button onClick={() => signOut()}>Sign Out</button>
          </div>
        ) : (
          <p>❌ Not authenticated</p>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
        <h2>Test Login</h2>
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{ display: 'block', margin: '5px 0', padding: '5px', width: '300px' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{ display: 'block', margin: '5px 0', padding: '5px', width: '300px' }}
          />
          <button onClick={handleLogin} style={{ marginTop: '10px', padding: '5px 15px' }}>
            Test Login
          </button>
        </div>
        {result && (
          <div style={{ marginTop: '10px', padding: '10px', background: result.ok ? '#d4edda' : '#f8d7da' }}>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
