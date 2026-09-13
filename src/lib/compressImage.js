export const maxUploadBytes = 10 * 1024 * 1024

const maxEdge = 2400
const minEdge = 600
const qualitySteps = [0.85, 0.7, 0.55, 0.4]

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Ezt a fájlt nem sikerült képként megnyitni.'))
    }

    image.src = url
  })
}

function drawScaled(image, edge) {
  const scale = Math.min(1, edge / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')

  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvas
}

function toBlob(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
}

export async function compressImage(file) {
  const image = await loadImage(file)
  const name = file.name.replace(/\.[^.]+$/, '')
  let edge = maxEdge

  while (edge >= minEdge) {
    const canvas = drawScaled(image, edge)

    for (const quality of qualitySteps) {
      const blob = await toBlob(canvas, quality)

      if (blob && blob.size <= maxUploadBytes) {
        return new File([blob], `${name}.webp`, { type: blob.type })
      }
    }

    edge = Math.round(edge / 2)
  }

  throw new Error('A képet nem sikerült 10 MB alá tömöríteni.')
}
