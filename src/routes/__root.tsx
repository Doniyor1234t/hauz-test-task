import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
  useNavigate,
} from '@tanstack/react-router'

import appCss from '../styles.css?url'
import { meQuery } from '#/lib/queries/me.ts';
import { logOut } from '#/server/auth.functions.ts';

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'HAUZ' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  loader: async ({ context }) => 
    context.queryClient.ensureQueryData(meQuery),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { data: me } = useQuery(meQuery)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  async function handleLogout() {
    await logOut()

    queryClient.setQueryData(meQuery.queryKey, null)

    navigate({
      to: '/sign-in',
    })
  }
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* The site header belongs here. See TASK.md. */}


        <header className="site-header">
          <Link to="/" className="site-logo">
            HAUZ
          </Link>

          <nav className="site-nav">
            {me ? (
              <>
                <Link to="/profile" className="site-user">
                  <span className="site-avatar" aria-hidden="true">
                    {(me.account?.first_name ?? me.user.name ?? '?')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                  {me.account?.first_name ?? me.user.name}
                </Link>

                <button
                  type="button"
                  className="site-button site-button--ghost"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link to="/sign-in" className="site-button">
                Sign in
              </Link>
            )}
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
