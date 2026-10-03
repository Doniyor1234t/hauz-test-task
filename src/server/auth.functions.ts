import { createServerFn } from '@tanstack/react-start'
import { ID, Account } from 'node-appwrite'
import { adminClient, setSessionCookie } from './appwrite';
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
