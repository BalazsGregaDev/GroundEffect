import { supabase } from './supabase.js'

async function requestSignature() {
  const { data, error } = await supabase.functions.invoke('sign-upload')

  if (error) {
    const detail = await error.context?.json().catch(() => null)
    throw new Error(detail?.error ?? 'Az aláírás kérése nem sikerült.')
  }

  return data
}

export async function uploadImage(file) {
  const signature = await requestSignature()

  const body = new FormData()
  body.append('file', file)
  body.append('api_key', signature.apiKey)
  body.append('timestamp', signature.timestamp)
  body.append('folder', signature.folder)
  body.append('signature', signature.signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    { method: 'POST', body },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message ?? 'A feltöltés nem sikerült.')
  }

  return result.secure_url
}

export function cloudinaryUrl(url, transform) {
  if (!url.includes('/upload/')) {
    return url
  }

  return url.replace('/upload/', `/upload/${transform}/`)
}
