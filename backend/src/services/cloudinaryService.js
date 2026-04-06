import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        public_id: `verdora/products/${Date.now()}-${fileName}`,
        folder: "verdora/products",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw error;
  }
};

export const uploadMultipleToCloudinary = async (files) => {
  try {
    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file.buffer, file.originalname),
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw error;
  }
};
