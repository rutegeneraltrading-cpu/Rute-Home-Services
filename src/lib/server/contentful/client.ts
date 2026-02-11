import { createClient } from 'contentful';

const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const CONTENTFUL_ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;
const CONTENTFUL_ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT;

if (
  !CONTENTFUL_SPACE_ID ||
  !CONTENTFUL_ACCESS_TOKEN ||
  !CONTENTFUL_ENVIRONMENT
) {
  throw new Error('Contentful environment variables are not properly set.');
}

const client = createClient({
  space: CONTENTFUL_SPACE_ID,
  accessToken: CONTENTFUL_ACCESS_TOKEN,
  environment: CONTENTFUL_ENVIRONMENT,
});

export default client;
