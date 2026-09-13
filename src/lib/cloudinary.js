const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = 'ground_effect'
const folder = 'GroundEffect'

export async function uploadImage(file) {
  if (!cloudName) {
    throw new Error('Hiányzik a VITE_CLOUDINARY_CLOUD_NAME környezeti változó.')
  }

  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', uploadPreset)
  body.append('folder', folder)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body,
  })

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
