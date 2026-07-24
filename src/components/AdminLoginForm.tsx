'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FUN_EMAIL = 'monira@primegen.test' // temporary easter egg -- safe to delete this whole block later

export default function AdminLoginForm({ redirectTo = '/admin-dashboard' }: { redirectTo?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [funModalOpen, setFunModalOpen] = useState(false)
  const [toast, setToast] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Invalid email or password')
      }

      if (email.trim().toLowerCase() === FUN_EMAIL) {
        setFunModalOpen(true)
        setStatus('idle')
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err?.message || 'Login failed')
    }
  }

  function handleFunChoice(choice: 'ken' | 'other') {
    setFunModalOpen(false)
    if (choice === 'ken') {
      setToast('Perfect choice 💚')
      setTimeout(() => {
        router.push(redirectTo)
        router.refresh()
      }, 1100)
    } else {
      setToast('Not a chance 😤')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfffc] px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-[#01172f]/10 p-8 md:p-10">
        <div className="w-10 h-[3px] bg-[#149911] mb-6" />
        <h1 className="text-2xl font-black uppercase tracking-tight text-[#01172f] mb-2">
          Login
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Sign in to access the Primegen dashboard.
        </p>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#149911]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#149911]"
            />
          </div>
        </div>

        {status === 'error' && <p className="text-sm text-red-600 mb-4">{errorMsg}</p>}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full py-3 bg-[#3D5F3B] text-white font-bold uppercase tracking-wide text-sm hover:bg-[#01172f] transition-colors disabled:opacity-50"
        >
          {status === 'submitting' ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* ===== Temporary fun modal -- safe to delete this whole block later ===== */}
      {funModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-8 text-center shadow-[0_30px_80px_-20px_rgba(1,23,47,0.35)]">
            <div className="w-8 h-[3px] bg-[#149911] mx-auto mb-5" />
            <h2 className="text-xl font-black text-[#01172f] mb-6">Kanino ka lang?</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleFunChoice('ken')}
                className="py-3 bg-[#3D5F3B] text-white font-bold uppercase tracking-wide text-sm hover:bg-[#149911] transition-colors"
              >
                Sayo lang Ken
              </button>
              <button
                onClick={() => handleFunChoice('other')}
                className="py-3 border border-gray-300 text-gray-500 font-bold uppercase tracking-wide text-sm hover:border-gray-400 transition-colors"
              >
                Sa iba
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-[#01172f] text-white px-10 py-5 font-bold text-2xl shadow-lg animate-[fadeInDown_0.3s_ease-out]">
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  )
}
