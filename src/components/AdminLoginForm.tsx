'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FUN_EMAIL = 'monira@primegen.test' // temporary easter egg -- safe to delete this whole block later

export default function AdminLoginForm({ redirectTo = '/admin-dashboard' }: { redirectTo?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'change'>('login')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'success'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [funModalOpen, setFunModalOpen] = useState(false)
  const [toast, setToast] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      if (mode === 'change') {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match.')
        }
        if (newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters.')
        }

        // 1. Authenticate with current credentials to get session token
        const loginRes = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })

        if (!loginRes.ok) {
          throw new Error('Invalid current email or password.')
        }

        const loginData = await loginRes.json()
        const userId = loginData?.user?.id

        if (!userId) throw new Error('Authentication failed.')

        // 2. Patch user document with the new password
        const patchRes = await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ password: newPassword }),
        })

        if (!patchRes.ok) {
          throw new Error('Failed to update password. Please try again.')
        }

        setStatus('success')
        setToast('Password updated successfully 🔒')
        setTimeout(() => {
          router.push(redirectTo)
          router.refresh()
        }, 1500)
        return
      }

      // ===== Standard Login Logic =====
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
      setErrorMsg(err?.message || 'Action failed')
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

  const inputClass = "w-full px-3.5 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#149911]"
  const labelClass = "block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5"

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfffc] px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-[#01172f]/10 p-8 md:p-10 shadow-sm transition-all duration-300">
        <div className="w-10 h-[3px] bg-[#149911] mb-6" />
        <h1 className="text-2xl font-black uppercase tracking-tight text-[#01172f] mb-2">
          {mode === 'login' ? 'Login' : 'Change Password'}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {mode === 'login' 
            ? 'Sign in to access the Primegen dashboard.' 
            : 'Enter your current credentials to update your password.'}
        </p>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label className={labelClass}>
              {mode === 'login' ? 'Password' : 'Current Password'}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {mode === 'change' && (
            <>
              <div>
                <label className={labelClass}>New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  minLength={6}
                />
              </div>
              <div>
                <label className={labelClass}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  minLength={6}
                />
              </div>
            </>
          )}
        </div>

        {status === 'error' && <p className="text-sm text-red-600 mb-4">{errorMsg}</p>}

        <button
          type="submit"
          disabled={status === 'submitting' || status === 'success'}
          className="w-full py-3 bg-[#3D5F3B] text-white font-bold uppercase tracking-wide text-sm hover:bg-[#01172f] transition-colors disabled:opacity-50"
        >
          {status === 'submitting' 
            ? (mode === 'login' ? 'Signing in...' : 'Updating...') 
            : status === 'success' 
              ? 'Success!'
              : (mode === 'login' ? 'Sign In' : 'Update Password')
          }
        </button>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'change' : 'login')
              setErrorMsg('')
              setPassword('')
              setNewPassword('')
              setConfirmPassword('')
            }}
            className="text-[10px] font-bold uppercase tracking-widest text-[#01172f]/40 hover:text-[#149911] transition-colors"
          >
            {mode === 'login' ? 'Change your password?' : 'Back to Login'}
          </button>
        </div>
      </form>

      {/* ===== Temporary fun modal -- safe to delete this whole block later ===== */}
      {funModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-8 text-center shadow-[0_30px_80px_-20px_rgba(1,23,47,0.35)]">
            <div className="w-8 h-[3px] bg-[#149911] mx-auto mb-5" />
            <h2 className="text-xl font-black text-[#01172f] mb-6">Kanino ka lang Monira?</h2>
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
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-[#01172f] text-white px-10 py-5 font-bold text-[16px] shadow-lg animate-[fadeInDown_0.3s_ease-out]">
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