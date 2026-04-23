/**
 * Share product utility
 * Handles Web Share API and clipboard fallback
 */

interface ShareProductOptions {
  productId: string;
  productName: string;
  onSuccess?: (message: string) => void;
  onError?: (error: Error) => void;
}

export const shareProduct = async ({
  productId,
  productName,
  onSuccess,
  onError,
}: ShareProductOptions): Promise<void> => {
  try {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/productpage/${productId}`
        : "";

    const shareData = {
      title: productName,
      text: `Check out ${productName} on Verdora!`,
      url: shareUrl,
    };

    if (navigator.share) {
      // Use native Web Share API if available
      try {
        await navigator.share(shareData);
        onSuccess?.("Product shared successfully!");
      } catch (error) {
        // User cancelled share dialog
        console.log("Share cancelled:", error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        onSuccess?.("Product link copied to clipboard!");
      } catch {
        // Last resort: show alert
        alert(`Share link: ${shareUrl}`);
        onError?.(new Error("Failed to copy to clipboard"));
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Share failed");
    onError?.(err);
  }
};
