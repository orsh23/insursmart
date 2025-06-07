// utils/apiClient.js
import { toast } from "@/components/ui/use-toast";

/**
 * Wrapper for fetch API with JSON handling, error toast, and status checks
 *
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options (method, headers, body, etc)
 * @param {object} config - Optional config: { showErrorToast, showSuccessToast, successMessage }
 * @returns {Promise<any>} Parsed JSON response or throws error
 */
export async function apiClient(url, options = {}, config = {}) {
  const {
    showErrorToast = true,
    showSuccessToast = false,
    successMessage = "",
  } = config;

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const contentType = res.headers.get("Content-Type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message = isJson ? data?.error || res.statusText : res.statusText;
      throw new Error(message);
    }

    if (showSuccessToast && successMessage) {
      toast({ title: "✅ Success", description: successMessage });
    }

    return data;
  } catch (error) {
    if (showErrorToast) {
      toast({
        title: "❌ Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    }
    throw error;
  }
}