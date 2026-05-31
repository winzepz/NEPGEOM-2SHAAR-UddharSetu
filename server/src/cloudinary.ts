import { v2 as cloudinary } from 'cloudinary'

export function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are not fully configured.')
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
}

export function createUploadSignature(folder: string) {
  configureCloudinary()

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME as string
  const apiKey = process.env.CLOUDINARY_API_KEY as string
  const apiSecret = process.env.CLOUDINARY_API_SECRET as string
  const timestamp = Math.round(Date.now() / 1000)
  const uploadFolder = `uddharsetu/${folder}`
  const signature = cloudinary.utils.api_sign_request(
    {
      folder: uploadFolder,
      timestamp,
    },
    apiSecret as string,
  )

  return {
    apiKey,
    cloudName,
    folder: uploadFolder,
    signature,
    timestamp,
  }
}
