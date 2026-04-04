/**
 * Kompres gambar menggunakan Canvas API sebelum diunggah
 * @param {File} file - File gambar asli
 * @param {Object} options - Opsi kompresi (maxWidth, quality)
 * @returns {Promise<Blob>} - Blob gambar hasil kompresi
 */
export async function compressImage(file, { maxWidth = 800, quality = 0.7 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Hitung rasio aspek untuk resize jika lebih lebar dari maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Konversi ke Blob (pilih format webp untuk kompresi terbaik, fallback jpeg)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Berikan nama file asli tapi ganti ekstensi atau sekadar blob
              resolve(blob)
            } else {
              reject(new Error('Gagal melakukan kompresi gambar'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = (e) => reject(e)
    }
    reader.onerror = (e) => reject(e)
  })
}
