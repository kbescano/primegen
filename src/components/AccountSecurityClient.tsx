'use client'

import { useEffect, useState } from 'react'

type Status = 'loading' | 'off' | 'setting-up' | 'on' | 'disabling'

export default function AccountSecurityClient({ email }: { email: string }) {
  const [status, setStatus] = useState<Status>('loading')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/mfa/status', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setStatus(data.enabled ? 'on' : 'off'))
      .catch(() => setStatus('off'))
  }, [])

  async function startSetup() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/mfa/setup/start', { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to start setup')
      setQrDataUrl(data.qrDataUrl)
      setSecret(data.secret)
      setStatus('setting-up')
    } catch (e: any) {
      setError(e?.message || 'Failed to start setup')
    } finally {
      setBusy(false)
    }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/mfa/setup/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ secret, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Invalid code')
      setStatus('on')
      setCode('')
      setSecret('')
      setQrDataUrl('')
    } catch (e: any) {
      setError(e?.message || 'Invalid code')
    } finally {
      setBusy(false)
    }
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/mfa/setup/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to disable')
      setStatus('off')
      setPassword('')
    } catch (e: any) {
      setError(e?.message || 'Failed to disable')
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 border border-gray-300 rounded text-sm text-[#01172f] placeholder:text-gray-400 focus:outline-none focus:border-[#149911] focus:ring-1 focus:ring-[#149911]/25 transition-all'

  return (
    <div className="w-full max-w-[560px] mx-auto py-10 px-4">
      <div className="mb-8">
        <div className="w-10 h-[3px] bg-[#149911] mb-4" />
        <h1 className="text-[24px] font-black uppercase tracking-tight text-[#01172f] mb-2">
          Account Security
        </h1>
        <p className="text-[13px] text-gray-500">{email}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[15px] font-bold text-[#01172f]">Two-Factor Authentication</h2>
          {status !== 'loading' && (
            <span
              className={`text-[9px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                status === 'on'
                  ? 'bg-[#149911]/10 text-[#149911]'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {status === 'on' ? 'Enabled' : 'Not Enabled'}
            </span>
          )}
        </div>
        <p className="text-[12px] text-gray-500 leading-relaxed mb-6">
          Optional, and entirely up to you. When it&apos;s on, logging in needs your password
          <span className="font-bold text-[#01172f]"> and</span> a one-time code from your phone
          -- so even if someone got your password, they still couldn&apos;t get in.
        </p>

        {status === 'loading' && (
          <p className="text-[12px] text-gray-400 italic">Checking status...</p>
        )}

        {status === 'off' && (
          <button
            onClick={startSetup}
            disabled={busy}
            className="px-5 py-2.5 bg-[#01172f] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#149911] transition-colors disabled:opacity-50"
          >
            {busy ? 'Starting...' : 'Enable Two-Factor Authentication'}
          </button>
        )}

        {status === 'setting-up' && (
          <div className="flex flex-col gap-5">
            <ol className="flex flex-col gap-3 text-[12px] text-[#01172f] leading-relaxed list-decimal pl-4">
              <li>
                Install an authenticator app on your phone if you don&apos;t already have one --
                Google Authenticator, Microsoft Authenticator, Authy, and 1Password all work.
              </li>
              <li>
                Open the app, choose <span className="font-bold">&quot;Scan QR code&quot;</span> (or
                &quot;Add account&quot;), and point your camera at the code below.
              </li>
              <li>
                Your app will show a 6-digit code that changes every 30 seconds. Type the current
                one in below and confirm.
              </li>
            </ol>

            <div className="flex justify-center bg-gray-50 border border-gray-200 rounded-lg p-5">
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- local data URL
                <img src={qrDataUrl} alt="Scan with your authenticator app" width={200} height={200} />
              )}
            </div>

            <details className="text-[11px] text-gray-500">
              <summary className="cursor-pointer font-semibold text-gray-600">
                Can&apos;t scan? Enter this key manually instead
              </summary>
              <p className="mt-2 font-mono text-[11px] bg-gray-50 border border-gray-200 rounded px-3 py-2 break-all">
                {secret}
              </p>
            </details>

            <form onSubmit={confirmSetup} className="flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                  Enter the 6-digit code from your app
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className={`${inputClass} font-mono text-center text-[18px] tracking-[0.3em]`}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="px-5 py-2.5 bg-[#149911] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#103900] transition-colors disabled:opacity-50"
              >
                {busy ? 'Confirming...' : 'Confirm & Enable'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('off')
                  setQrDataUrl('')
                  setSecret('')
                  setCode('')
                  setError('')
                }}
                className="text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {status === 'on' && (
          <div className="flex flex-col gap-4">
            <p className="text-[12px] text-[#149911] font-semibold">
              Two-factor authentication is protecting this account.
            </p>
            <button
              onClick={() => setStatus('disabling')}
              className="self-start text-[11px] font-bold uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors"
            >
              Disable Two-Factor Authentication
            </button>
          </div>
        )}

        {status === 'disabling' && (
          <form onSubmit={disable} className="flex flex-col gap-3">
            <p className="text-[12px] text-gray-500">
              Enter your password to confirm turning this off.
            </p>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Current password"
              className={inputClass}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {busy ? 'Disabling...' : 'Confirm Disable'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('on')
                  setPassword('')
                  setError('')
                }}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {error && (
          <p className="mt-4 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
