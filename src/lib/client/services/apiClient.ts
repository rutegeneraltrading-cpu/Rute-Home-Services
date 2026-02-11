interface GetDataProps {
  slug?: string;
  filter?: string;
  category?: string;
  path: string;
}

interface GetServerSideDataProps {
  path: string;
  slug?: string;
  category?: string;
}

export const getData = async ({
  slug,
  filter,
  category,
  path,
}: GetDataProps) => {
  const url = `/api/${path}/${slug ? `?id=${slug}` : ''}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filter, category, slug }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return null;
  }
};

export const getServerSideData = async ({
  path,
  slug,
  category,
}: GetServerSideDataProps) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug, category }),
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // If slug is provided and data is returned, it's a single item
    if (slug && result?.data) {
      return { data: result.data };
    }

    return result || { data: [] };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { data: null };
  }
};

type Filterable = {
  title?: string;
  short_desc?: string;
  category?: string;
};

export const filterValues = <T extends Filterable>(
  data: T[],
  filter: string,
): T[] => {
  if (!filter) return data;
  const lowerCaseFilter = filter.trim().toLowerCase();

  return data.filter((item) => {
    return (
      item.title?.toLowerCase().includes(lowerCaseFilter) ||
      item.short_desc?.toLowerCase().includes(lowerCaseFilter) ||
      item.category?.toLowerCase().includes(lowerCaseFilter)
    );
  });
};
