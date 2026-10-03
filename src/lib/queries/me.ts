import { queryOptions } from '@tanstack/react-query'

import { getMe } from '#/server/auth.functions'

export const meQuery = queryOptions({
  queryKey: ['me'],
  queryFn: () => getMe(),
  staleTime: 60_000,
})