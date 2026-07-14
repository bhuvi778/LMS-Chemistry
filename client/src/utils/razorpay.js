export const getRazorpayLogoUrl = () => {
  const logoPath = '/logo-login.png';
  if (typeof window === 'undefined' || !window.location?.origin) return logoPath;
  return `${window.location.origin}${logoPath}`;
};
