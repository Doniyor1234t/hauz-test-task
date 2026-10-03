import { meQuery } from '#/lib/queries/me.ts';
import { safeRedirect } from '#/lib/safe-redirect.ts';
import { sendCodeFn, verifyCodeFn } from '#/server/auth.functions.ts';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react';

export const Route = createFileRoute('/sign-in')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const search = useSearch({
    from: '/sign-in',
  }) as {
    redirect?: string | undefined
  }

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const redirectTo = safeRedirect(search.redirect)

  async function handleSendCode(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError(null)
    setLoading(true)

    try {
      const result = await sendCodeFn({
        data: {
          mail: email,
        },
      })

      if (!result.success || !result.userId) {
        throw new Error(result.error ?? 'Unable to send code')
      }

      setUserId(result.userId)
      setStep('code')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to send code',
      )
    } finally {
      setLoading(false)
    }
  }


  async function handleVerifyCode(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(null)
    setLoading(true)

    try {
      const result = await verifyCodeFn({
        data: {
          userId,
          mail: email,
          verifyCode: code,
        },
      })

      if (!result.success) {
        throw new Error(result.error ?? 'Invalid code')
      }

      // The session cookie is now set; refetch `me` so the header updates.
      await queryClient.invalidateQueries({ queryKey: meQuery.queryKey })


      await navigate({
        to: redirectTo,
      })
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Invalid code',
      )
    } finally {
      setLoading(false)
    }
  }

  if (step === 'email') {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">Hauz</div>

          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">
            Enter your email and we'll send you a one-time code.
          </p>

          <form className="auth-form" onSubmit={handleSendCode}>
            <label className="auth-label" htmlFor="email">
              Email
            </label>

            <input
              id="email"
              className="auth-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">Hauz</div>

        <h1 className="auth-title">Enter your code</h1>
        <p className="auth-subtitle">
          We sent a code to <strong>{email}</strong>.
        </p>

        <form className="auth-form" onSubmit={handleVerifyCode}>
          <label className="auth-label" htmlFor="code">
            Code
          </label>

          <input
            id="code"
            className="auth-input auth-input--code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(`${event.target.value}`)}
            required
          />

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Verify code'}
          </button>

          <button
            type="button"
            className="auth-link"
            disabled={loading}
            onClick={() => {
              setStep('email')
              setCode('')
              setError(null)
            }}
          >
            Use a different email
          </button>
        </form>
      </div>
    </main>
  )
}
