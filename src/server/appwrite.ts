import { createServerOnlyFn } from '@tanstack/react-start'
import { Client, ExecutionMethod, Functions } from 'node-appwrite'
import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'

const SESSION_COOKIE = 'appwrite_session'

const getEnv = createServerOnlyFn(() => {
  const endpoint = process.env.APPWRITE_ENDPOINT
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY
  const functionId = process.env.APPWRITE_FUNCTION_ID

  if (!endpoint || !projectId) {
    throw new Error(
      'Missing APPWRITE_ENDPOINT or APPWRITE_PROJECT_ID',
    )
  }

  return {
    endpoint,
    projectId,
    apiKey,
    functionId,
  }
})

function createClient() {
  const { endpoint, projectId } = getEnv()

  return new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
}


export const adminClient = createServerOnlyFn(() => {
  const { apiKey } = getEnv()

  if (!apiKey) {
    throw new Error('Missing APPWRITE_API_KEY')
  }

  return createClient().setKey(apiKey)
})


export const sessionClient = createServerOnlyFn(
  (secret: string) => {
    if (!secret) {
      throw new Error('Missing Appwrite session secret')
    }

    return createClient().setSession(secret)
  },
)

export const readCookie = createServerOnlyFn(() => {
  return getCookie(SESSION_COOKIE)
})

export const setSessionCookie = createServerOnlyFn(
  (value: string) => {
    setCookie(SESSION_COOKIE, value, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    })
  },
)

export const clearSessionCookie = createServerOnlyFn(() => {
  deleteCookie(SESSION_COOKIE, {
    path: '/',
  })
})


export const callFunction = createServerOnlyFn(
  async (
    secret: string,
    method: ExecutionMethod,
    body?: unknown,
  ) => {
    const { functionId } = getEnv()

    if (!functionId) {
      throw new Error('Missing APPWRITE_FUNCTION_ID')
    }

    const functions = new Functions(sessionClient(secret))

    const execution = await functions.createExecution({
      functionId,
      // The Function routes on path; the default "/" matches nothing (404).
      xpath: '/personal-account',
      method,
      headers: { 'content-type': 'application/json' },
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    })

    const status = execution.responseStatusCode

    if (status < 200 || status >= 300) {
      // Surface the Function's own message (e.g. a validation issue).
      let detail = ''
      try {
        const body = JSON.parse(execution.responseBody)
        detail = body.issues?.[0]?.message ?? body.message ?? ''
      } catch {}

      throw new Error(
        detail || `Appwrite function failed with status ${status}`,
      )
    }

    return execution
  },
)