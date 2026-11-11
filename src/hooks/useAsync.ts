import { useCallback, useEffect, useState, type DependencyList } from 'react'

export function useAsync<T>(loader: () => Promise<T>, dependencies: DependencyList = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    try { setData(await loader()) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os dados.') } finally { setLoading(false) }
  // The caller intentionally controls when an inline loader is refreshed.
  // eslint-disable-next-line react-hooks/use-memo, react-hooks/exhaustive-deps
  }, dependencies)
  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, error, refresh, setData }
}
