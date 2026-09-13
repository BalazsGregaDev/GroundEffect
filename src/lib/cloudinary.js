import { supabase } from './supabase.js'
import { compressImage, maxUploadBytes } from './compressImage.js'
import { functionErrorMessage } from './functionError.js'

async function requestSignature() {
  const { data, error } = await supabase.functions.invoke('sign-upload')

  if (error) {
    throw new Error(await functionErrorMessage(error, 'Az aláírás kérése nem sikerült.'))
  }

  return data
}

export async function uploadImage(file, onStage) {
  let prepared = file

  if (file.size > maxUploadBytes) {
    onStage?.('compress')
    prepared = await compressImage(file)
  }

  onStage?.('upload')

  const signature = await requestSignature()

  const body = new FormData()
  body.append('file', prepared)
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

export function coverUrl(url) {
  return cloudinaryUrl(url, 'f_auto,q_auto,w_1200')
}

export function cloudinaryUrl(url, transform) {
  if (!url.includes('/upload/')) {
    return url
  }

  return url.replace('/upload/', `/upload/${transform}/`)
}
