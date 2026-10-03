import { meQuery } from '#/lib/queries/me.ts';
import { updateProfile } from '#/server/auth.functions.ts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react';



export const Route = createFileRoute('/profile')({
  // beforeLoad runs before any loader (including the root's), so on a hard
  // load the cache is still empty. Fetch it here rather than only reading it.
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(meQuery)

    if (!me) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.pathname,
        },
      })
    }

    if (!me.account) {
      throw redirect({
        to: '/onboarding',
      })
    }
  },

  component: ProfilePage,
})

function ProfilePage() {
  const { data: me } = useQuery(meQuery)
  const queryClient = useQueryClient()

  const account = me!.account!

  const [firstName, setFirstName] = useState(account.first_name)
  const [lastName, setLastName] = useState(account.last_name)
  const [contactEmail, setContactEmail] = useState(
    account.contact_email ?? '',
  )
  const [bio, setBio] = useState(account.bio ?? '')

  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (pending) {
      return
    }

    setPending(true)
    setMessage(null)
    setError(null)

    try {
      const changes: {
        firstName?: string | null
        lastName?: string | null
        contactEmail?: string | null
        bio?: string | null
      } = {}

      Object.assign(changes, {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        contactEmail: contactEmail.trim() || null,
        bio: bio.trim() || null,
      })

      await updateProfile({
        data: changes,
      })

      await queryClient.invalidateQueries({
        queryKey: meQuery.queryKey,
      })

      setMessage('Profile updated.')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to update profile',
      )
    } finally {
      setPending(false)
    }
  }
  const displayName =
    [account.first_name, account.last_name].filter(Boolean).join(' ') ||
    me!.user.name

  return (
    <main className="profile-page">
      <div className="auth-card profile-card">
        <div className="profile-header">
          <div className="profile-avatar" aria-hidden="true">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="profile-identity">
            <h1 className="auth-title">{displayName}</h1>
            <span className="profile-role">
              {ROLE_LABELS[account.role] ?? account.role}
            </span>
          </div>
        </div>

        <form className="auth-form profile-form" onSubmit={handleSubmit}>
          <div className="auth-row">
            <div className="auth-field">
              <label className="auth-label" htmlFor="first-name">
                First name
              </label>
              <input
                id="first-name"
                className="auth-input"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
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
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                disabled={pending}
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Contact email
            </label>
            <input
              id="email"
              className="auth-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              disabled={pending}
            />
          </div>

          <div className="auth-field">
            <div className="profile-label-row">
              <label className="auth-label" htmlFor="bio">
                Bio
              </label>
              <span className="profile-counter">
                {bio.length}/{BIO_MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="bio"
              className="auth-input profile-bio"
              rows={4}
              maxLength={BIO_MAX_LENGTH}
              placeholder="A few words about you"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              disabled={pending}
            />
          </div>

          {message && (
            <p className="auth-success" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <div className="profile-actions">
            <button
              type="submit"
              className="auth-button"
              disabled={pending}
            >
              {pending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

const BIO_MAX_LENGTH = 500

const ROLE_LABELS: Record<string, string> = {
  property_owner: 'Property owner',
  realtor: 'Realtor',
}
