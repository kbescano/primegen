'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FUN_EMAIL = 'monira@primegen.sales' // temporary easter egg -- safe to delete this whole block later

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

  // ✨ State to hold the dynamic redirect URL just in case the Easter Egg modal interrupts the flow
  const [resolvedRedirect, setResolvedRedirect] = useState(redirectTo)

  // ✨ Short chime on successful login/password change — generated, no audio file needed
  function playSuccessSound() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      const now = ctx.currentTime
      ;[523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, now + i * 0.09)
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.09 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.09)
        osc.stop(now + i * 0.09 + 0.3)
      })
    } catch {
      // Web Audio unsupported or blocked — fail silently
    }
  }

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
        const userRole = loginData?.user?.role // ✨ Get the user's role

        if (!userId) throw new Error('Authentication failed.')

        // ✨ Dynamically route Marketing role
        let finalRedirect = redirectTo
        if (userRole === 'marketing') {
          finalRedirect = '/admin-dashboard/inquiry-tracker'
        }

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
        playSuccessSound()
        setTimeout(() => {
          router.push(finalRedirect) // ✨ Use dynamic redirect
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

      // ✨ Parse successful login response to check role
      const loginData = await res.json()
      const userRole = loginData?.user?.role

      // ✨ Dynamically route Marketing role
      let finalRedirect = redirectTo
      if (userRole === 'marketing') {
        finalRedirect = '/admin-dashboard/inquiry-tracker'
      }

      // Save it to state in case the Easter Egg interrupts the redirect flow
      setResolvedRedirect(finalRedirect)

      if (email.trim().toLowerCase() === FUN_EMAIL) {
        setFunModalOpen(true)
        setStatus('idle')
        return
      }

      router.push(finalRedirect) // ✨ Use dynamic redirect
      router.refresh()
      playSuccessSound()

    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err?.message || 'Action failed')
    }
  }

  function handleFunChoice(choice: 'ken' | 'other') {
    setFunModalOpen(false)
    if (choice === 'ken') {
      setToast('Perfect choice 💚')
      playSuccessSound()
      setTimeout(() => {
        router.push(resolvedRedirect) // ✨ Uses the role-based redirect
        router.refresh()
      }, 1100)
    } else {
      setToast('Not a chance 😤')
    }
  }

  const inputClass =
    "w-full px-3.5 py-2.5 bg-[#0A0A0A] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#22C55E] transition-colors"
  const labelClass = "block text-[11px] font-bold uppercase tracking-wide text-white/40 mb-1.5"


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-6 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-[#111111] border border-white/10 p-8 md:p-10"
      >
        <div className="w-10 h-[3px] bg-[#22C55E] mb-6" />
        <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
          {mode === 'login' ? 'Login' : 'Change Password'}
        </h1>
        <p className="text-sm text-white/40 mb-8">
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

        {status === 'error' && <p className="text-sm text-red-400 mb-4">{errorMsg}</p>}

        <button
          type="submit"
          disabled={status === 'submitting' || status === 'success'}
          className="w-full py-3 bg-[#22C55E] text-[#0A0A0A] font-bold uppercase tracking-wide text-sm hover:bg-[#2ED573] transition-colors disabled:opacity-50"
        >
          {status === 'submitting'
            ? (mode === 'login' ? 'Signing in...' : 'Updating...')
            : status === 'success'
              ? 'Success!'
              : (mode === 'login' ? 'Sign In' : 'Update Password')
          }
        </button>

        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'change' : 'login')
              setErrorMsg('')
              setPassword('')
              setNewPassword('')
              setConfirmPassword('')
            }}
            className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-[#22C55E] transition-colors"
          >
            {mode === 'login' ? 'Change your password?' : 'Back to Login'}
          </button>
        </div>
      </form>

      {/* ===== Temporary fun modal -- safe to delete this whole block later ===== */}
      {funModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 max-w-sm w-full p-8 text-center">
            <div className="w-8 h-[3px] bg-[#22C55E] mx-auto mb-5" />
            <h2 className="text-xl font-black text-white mb-6">Kanino ka lang Monira?</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleFunChoice('ken')}
                className="py-3 font-bold uppercase tracking-wide text-sm text-[#0A0A0A] bg-[#22C55E] hover:bg-[#2ED573] transition-colors"
              >
                Sayo lang Ken
              </button>
              <button
                onClick={() => handleFunChoice('other')}
                className="py-3 border border-white/15 text-white/40 font-bold uppercase tracking-wide text-sm hover:border-white/30 hover:text-white/60 transition-colors"
              >
                Sa iba
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-[#111111] border border-white/10 text-white px-10 py-5 font-bold text-[16px] animate-[fadeInDown_0.3s_ease-out]">
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}