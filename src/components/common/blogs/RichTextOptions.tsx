import { FC, ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import {
  BLOCKS,
  MARKS,
  INLINES,
  type Document,
  type Block,
  type Inline,
} from '@contentful/rich-text-types';
import {
  documentToReactComponents,
  type Options,
} from '@contentful/rich-text-react-renderer';

import { renderCode } from '@/lib/client';
import { StructuredContentType } from '@/lib/types';

interface RichTextOptionsProps {
  richTextContent?: Document | StructuredContentType;
}

type RichTextNode = {
  data?: {
    target?: { fields?: Record<string, unknown> };
    url?: string;
  };
  content?: Array<{ value?: string }>;
};

const RichTextOptions: FC<RichTextOptionsProps> = ({ richTextContent }) => {
  const options: Options = {
    renderNode: {
      [BLOCKS.HEADING_2]: (_: Block | Inline, children: ReactNode) => (
        <h2 className="md:text-4xl text-2xl font-extrabold text-slate-800 my-4">
          {children}
        </h2>
      ),
      [BLOCKS.HEADING_3]: (_: Block | Inline, children: ReactNode) => (
        <h3 className="md:text-3xl text-xl font-bold text-slate-800 my-4">
          {children}
        </h3>
      ),
      [BLOCKS.HEADING_4]: (_: Block | Inline, children: ReactNode) => (
        <h4 className="md:text-2xl text-lg font-semibold text-slate-800 my-3">
          {children}
        </h4>
      ),
      [BLOCKS.PARAGRAPH]: (_: Block | Inline, children: ReactNode) => (
        <p className="text-base leading-relaxed text-slate-700 my-2">
          {children}
        </p>
      ),
      [BLOCKS.EMBEDDED_ASSET]: (node: Block | Inline) => {
        const richNode = node as unknown as RichTextNode;
        const fields = richNode?.data?.target?.fields || {};
        const file = fields.file as { url?: string } | undefined;
        const title = fields.title as string | undefined;
        const imageUrl = file?.url ? `https:${file.url}` : '';
        return imageUrl ? (
          <Image
            src={imageUrl}
            alt={title || 'Embedded Image'}
            width={800}
            height={400}
            className="w-full rounded-lg shadow-md my-4"
            loading="lazy"
          />
        ) : null;
      },
      [BLOCKS.OL_LIST]: (_: Block | Inline, children: ReactNode) => (
        <ol className="list-decimal ml-6 space-y-2 text-slate-500">
          {children}
        </ol>
      ),
      [BLOCKS.UL_LIST]: (_: Block | Inline, children: ReactNode) => (
        <ul className="list-disc ml-6 space-y-2 text-slate-500">{children}</ul>
      ),
      [BLOCKS.LIST_ITEM]: (_: Block | Inline, children: ReactNode) => (
        <li className="text-base text-slate-500">{children}</li>
      ),
      [BLOCKS.HR]: () => (
        <hr className="border-t border-slate-300 md:my-12 my-6" />
      ),
      [BLOCKS.QUOTE]: (_: Block | Inline, children: ReactNode) => (
        <blockquote className="border-l-4 border-primary pl-4 italic text-warning my-4">
          {children}
        </blockquote>
      ),
      [BLOCKS.EMBEDDED_ENTRY]: (node: Block | Inline) => {
        const richNode = node as unknown as RichTextNode;
        const entryData = (richNode.data?.target?.fields || {}) as Record<
          string,
          unknown
        >;
        const imageUrl =
          (entryData?.image as { fields?: { file?: { url?: string } } })?.fields
            ?.file?.url || undefined;
        return (
          <Link
            href={(entryData?.slug as string) || '#'}
            className="flex flex-col border border-slate-200 rounded-lg hover:bg-slate-100 my-8"
          >
            <div className="bg-slate-100 border-b border-slate-300 px-2 py-3 rounded-t-lg">
              Related Blog
            </div>
            <div className="flex md:flex-row flex-col justify-between px-2 py-3">
              <div className="md:w-[80%]">
                <h3 className="text-lg font-semibold text-slate-700">
                  {(entryData?.title as string)?.slice(0, 60)}...
                </h3>
                <p className="text-slate-600">
                  {(entryData?.shortDesc as string)?.slice(0, 110)}...
                </p>
              </div>
              <div
                className={clsx(
                  'md:w-28 w-full h-28 bg-cover bg-no-repeat bg-center',
                  'rounded-lg md:mr-3',
                )}
                style={{
                  backgroundImage: imageUrl
                    ? `url('https:${imageUrl}')`
                    : undefined,
                }}
              />
            </div>
          </Link>
        );
      },
      [INLINES.HYPERLINK]: (node: Block | Inline) => {
        const richNode = node as unknown as RichTextNode;
        const uri = richNode.data?.url as string | undefined;
        const label = richNode.content?.[0]?.value || 'Open link';
        return (
          <a
            href={uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-info underline font-semibold hover:underline hover:text-info/65"
          >
            {label}
          </a>
        );
      },
      [INLINES.ASSET_HYPERLINK]: (node: Block | Inline) => {
        const richNode = node as unknown as RichTextNode;
        const fields = richNode.data?.target?.fields || {};
        const file = fields.file as { url?: string } | undefined;
        const imageUrl = file?.url ? `https:${file.url}` : '';
        const label = richNode.content?.[0]?.value || 'View asset';
        return (
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-info underline font-semibold hover:underline hover:text-info/65"
          >
            {label}
          </a>
        );
      },
      [INLINES.ENTRY_HYPERLINK]: (node: Block | Inline) => {
        const richNode = node as unknown as RichTextNode;
        const url = richNode.data?.url as string | undefined;
        const label = richNode.content?.[0]?.value || 'View Entry';
        return (
          <a href={`${url}`} className="text-info font-bold hover:underline">
            {label}
          </a>
        );
      },
    },
    renderMark: {
      [MARKS.BOLD]: (text: ReactNode) => (
        <strong className="font-bold">{text}</strong>
      ),
      [MARKS.ITALIC]: (text: ReactNode) => <em className="italic">{text}</em>,
      [MARKS.UNDERLINE]: (text: ReactNode) => (
        <span className=" bg-warning decoration-solid text-slate-950 px-1">
          {text}
        </span>
      ),
      [MARKS.CODE]: (text: ReactNode) => (
        <div className="text-slate-100 bg-slate-800 p-4 rounded-md overflow-x-auto">
          {renderCode(String(text))}
        </div>
      ),
      [MARKS.SUBSCRIPT]: (text: ReactNode) => (
        <sub className="text-xs align-sub">{text}</sub>
      ),
      [MARKS.SUPERSCRIPT]: (text: ReactNode) => (
        <sup className="text-xs align-super">{text}</sup>
      ),
      [MARKS.STRIKETHROUGH]: (text: ReactNode) => (
        <span className="line-through">{text}</span>
      ),
    },
  };

  if (!richTextContent) {
    return <p className="text-slate-500">No content available.</p>;
  }

  // Type guard to check if it's a Document type
  const isDocument = (
    content: Document | StructuredContentType,
  ): content is Document => {
    return 'nodeType' in content && content.nodeType === 'document';
  };

  if (!isDocument(richTextContent)) {
    return <p className="text-slate-500">Content format not supported.</p>;
  }

  return documentToReactComponents(richTextContent, options);
};

export default RichTextOptions;
