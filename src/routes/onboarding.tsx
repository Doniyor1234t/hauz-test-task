import { completeOnboarding } from '#/server/auth.functions.ts';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react';

export const Route = createFileRoute('/onboarding')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'property_owner' | 'realtor'>(
    'property_owner',
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (pending) {
      return
    }

    setPending(true)
    setError(null)

    try {
      const result = await completeOnboarding({
        data: {
          firstName,
          lastName,
          role,
        },
      })

      if (result.status !== 200 && result.status !== 201) {
        throw new Error('Unable to complete onboarding')
      }

      await navigate({
        to: '/',
      })
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to complete onboarding',
      )
    } finally {
      setPending(false)
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-card auth-card--wide">
        <h1 className="auth-title">Complete your profile</h1>
        <p className="auth-subtitle">
          Tell us a little about yourself to get started.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-row">
            <div className="auth-field">
              <label className="auth-label" htmlFor="first-name">
                First name
              </label>
              <input
                id="first-name"
                className="auth-input"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                disabled={pending}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="last-name">
                Last name
              </label>
              <input
                id="last-name"
                className="auth-input"
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                disabled={pending}
              />
            </div>
          </div>

          <fieldset className="role-picker" disabled={pending}>
            <legend className="auth-label">I am a…</legend>

            {ROLE_OPTIONS.map((option) => (
              <label key={option.value} className="role-option">
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                />
                <span className="role-option__title">{option.title}</span>
                <span className="role-option__description">
                  {option.description}
                </span>
              </label>
            ))}
          </fieldset>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={pending}
          >
            {pending ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  )
}

const ROLE_OPTIONS = [
  {
    value: 'property_owner',
    title: 'Property owner',
    description: 'I own or manage property',
  },
  {
    value: 'realtor',
    title: 'Realtor',
    description: 'I help clients buy and sell',
  },
] as const
