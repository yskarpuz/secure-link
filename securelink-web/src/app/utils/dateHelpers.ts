export const calculateDaysRemaining = (expiryDate: string | undefined): string => {
  if (!expiryDate) return "";
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Expires today";
  if (diffDays === 1) return "1 day remaining";
  return `${diffDays} days remaining`;
};

export const formatExpiryDate = (expiryDate: string | undefined): string => {
  if (!expiryDate) return "No expiry";
  
  const date = new Date(expiryDate);
  return date.toLocaleDateString();
};

