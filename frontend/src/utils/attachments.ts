export type UploadedImage = {
  url: string;
  publicId?: string;
};

export const uploadImages = async ({
  files,
  token,
  endpoint,
}: {
  files: File[];
  token: string;
  endpoint: string;
}) => {
  if (!files.length) return [];

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to upload images");
  }

  return Array.isArray(data.images) ? (data.images as UploadedImage[]) : [];
};
