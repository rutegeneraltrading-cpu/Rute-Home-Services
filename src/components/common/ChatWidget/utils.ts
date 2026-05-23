export const formatMessage = (text: string): string => {
  return (
    text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`{3}[\s\S]*?`{3}/g, '')
      .replace(/`(.*?)`/g, '$1')
      // markdown links are preserved — rendered as <a> tags in ChatMessages
      .replace(/^#+\s+/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '\n• ')
      .replace(/^\s*(\d+)\.\s+/gm, '\n$1. ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .trim()
  );
};

export const suggestions = [
  {
    title: 'Our Services',
    description: 'What home services do you offer?',
    question: 'What home services do you offer and what are the prices?',
  },
  {
    title: 'Book a Service',
    description: 'How do I make a booking?',
    question: 'How do I book a service on your website?',
  },
  {
    title: 'Shop Products',
    description: 'What products are available?',
    question: 'What products do you sell and are they in stock?',
  },
  {
    title: 'Service Areas',
    description: 'Which areas do you cover?',
    question: 'Which areas and cities do you service?',
  },
];

export const excludedPaths = [
  '/admin',
  '/login',
  '/signup',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
];

export const widgetVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};
