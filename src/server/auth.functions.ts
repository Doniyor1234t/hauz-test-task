import { createServerFn } from '@tanstack/react-start'
import { ID, Account, Query, TablesDB } from 'node-appwrite'
import { adminClient, clearSessionCookie, readCookie, sessionClient, setSessionCookie } from './appwrite';
import { z } from 'zod'

const mail = z.string().trim().email()

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export const verifyCode = z.string().trim().length(6, 'Code must be 6 characters long')

export const sendCodeFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ mail }).parse(input))
  .handler(async ({ data }) => {
    const { mail } = data

    const account = new Account(adminClient())

    try {
      const emailToken = await account.createEmailToken({
        userId: ID.unique(),
        email: mail,
      })
      return { success: true, userId: emailToken.userId }
    } catch (error) {
      console.error('Error sending magic link:', error)
      return { success: false, error: errorMessage(error) }
    }
  })

export const verifyCodeFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({
        mail,
        verifyCode,
        userId: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { verifyCode, userId } = data

    const account = new Account(adminClient())

    try {
      const session = await account.createSession({ userId, secret: verifyCode })
      setSessionCookie(session.secret)
      return { success: true }
    } catch (error) {
      console.error('Error verifying code:', error)
      return { success: false, error: errorMessage(error) }
    }
  })



export const getMe = createServerFn({ method: 'GET' }).handler(async () => {
    const secret = readCookie()

    if (!secret) return null

    let user
    try {
      user = await new Account(sessionClient(secret)).get()
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 401
      ) {
        clearSessionCookie()
        return null
      }

      throw error
    }

    // Uses the admin key, so a failure here says nothing about the user's
    // session — don't clear the cookie for it.
    let account = null
    try {
      const result = await new TablesDB(adminClient()).listRows({
        databaseId: "main",
        tableId: process.env.PERSONAL_ACCOUNTS_TABLE_ID || "",
        queries: [
          Query.equal('appwrite_user_id', user.$id),
          Query.limit(1),
        ],
      })
      account = result.rows[0] ?? null
    } catch (error) {
      console.error('Error loading personal account:', error)
    }

    return {
      user,
      account,
    }
  })

export const logOut = createServerFn({ method: 'POST' }).handler(
  async () => {
    const secret = readCookie()

    if (!secret) {
      return
    }

    try {
      const account = new Account(sessionClient(secret))

      await account.deleteSession({
        sessionId: 'current',
      })
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 401
      ) {
        // Already logged out/expired.
      } else {
        throw error
      }
    } finally {
      clearSessionCookie()
    }
  },
)