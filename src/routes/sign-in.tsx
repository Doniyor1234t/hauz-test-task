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
  const search = useSearch({
    from: '/sign-in',
  })

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
      <main>
        <h1>Sign in</h1>

        <form onSubmit={handleSendCode}>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          {error && <p role="alert">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send code'}
          </button>
        </form>
      </main>
    )
  }

  

  return (
    <main>
      <h1>Enter your code</h1>

      <p>
        We sent a code to <strong>{email}</strong>.
      </p>

      <form onSubmit={handleVerifyCode}>
        <label htmlFor="code">Code</label>

        <input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(`${event.target.value}`)}
          required
        />

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify code'}
        </button>

        <button
          type="button"
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
    </main>
  )
}
