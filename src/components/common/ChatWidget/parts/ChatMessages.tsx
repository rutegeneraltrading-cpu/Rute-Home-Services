'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/lib/types/chat';

interface ChatMessagesProps {
  messages: Message[];
  isPending: boolean;
  error: Error | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onActionMessage?: (text: string) => void;
}

export const ChatMessages = ({
  messages,
  isPending,
  error,
  messagesEndRef,
  onActionMessage,
}: ChatMessagesProps) => {
  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-4 no-scrollbar">
      <div className="space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm ${
                message.role === 'user'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.role === 'user' ? (
                <p className="whitespace-pre-wrap wrap-break-word">
                  {message.content}
                </p>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-base font-bold mt-2 mb-1">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold mt-1.5 mb-0.5">{children}</h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-sm font-semibold mt-1 mb-0.5">{children}</h4>
                    ),
                    p: ({ children }) => (
                      <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-outside pl-4 mb-1.5 space-y-0.5">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-outside pl-4 mb-1.5 space-y-0.5">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    a: ({ href, children }) => {
                      const isExternal = href?.startsWith('http');
                      return (
                        <a
                          href={href}
                          target={isExternal ? '_blank' : '_self'}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                          className="text-green-600 hover:text-green-700 underline cursor-pointer"
                        >
                          {children}
                        </a>
                      );
                    },
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 text-xs font-mono">
                        {children}
                      </code>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-green-600 pl-3 italic text-gray-500 my-1.5">
                        {children}
                      </blockquote>
                    ),
                    hr: () => <hr className="border-gray-600 my-2" />,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-2 rounded-lg border border-gray-200">
                        <table
                          className="w-full text-xs border-collapse"
                          onClick={(e) => {
                            if (!onActionMessage) return;
                            const row = (e.target as Element).closest('tbody tr') as HTMLTableRowElement | null;
                            if (!row) return;
                            const firstCell = row.querySelector('td:first-child');
                            const idText = firstCell?.textContent?.trim();
                            if (idText) onActionMessage(`Tell me more details about ${idText}`);
                          }}
                        >
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-gray-100">{children}</thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="divide-y divide-gray-200">{children}</tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="transition-colors in-[tbody]:hover:bg-green-50 in-[tbody]:cursor-pointer">
                        {children}
                      </tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-2.5 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-2.5 py-2 text-gray-800 whitespace-nowrap">{children}</td>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          </motion.div>
        ))}

        {isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 text-gray-500 max-w-[80%] p-3 rounded-lg text-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-gray-500">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="bg-red-50 border border-red-300 text-red-600 p-2 rounded text-xs">
              Error: {error.message}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
