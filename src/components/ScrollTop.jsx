import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export default function ScrollTop() {
  const { pathname, hash } = useLocation()
  const navigation = useNavigationType()

  useEffect(() => {
    if (hash || navigation === 'POP') {
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash, navigation])

  return null
}
