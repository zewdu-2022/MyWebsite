export const trackEvent = (name: string, data?: object) => {
  console.log(`[Analytics] Event: ${name}`, data);
  // In a production app, you would send this to a backend or a service like GA here
};

export const trackPageView = (viewName: string) => {
  console.log(`[Analytics] Page View: ${viewName}`);
};
