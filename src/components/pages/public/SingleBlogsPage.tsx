import Image from 'next/image';

import { IBlogs } from '@/lib/types';
import { dateFormat } from '@/lib/client';
import { RelatedBlogs, RichTextOptions } from '@/components/common';

interface SingleBlogsPageProps {
  blog: IBlogs;
}

const SingleBlogsPage = ({ blog }: SingleBlogsPageProps) => {
  return (
    <div className="container mx-auto flex flex-col items-center text-slate-900 md:py-16 py-14">
      <div className="flex flex-col md:gap-16 gap-8 xl:w-[70%] lg:w-[75%]">
        <div className="flex flex-col md:gap-8 gap-4 md:px-6 w-full">
          <h1 className="md:text-4xl text-2xl font-bold text-slate-800 capitalize text-start">
            {blog.title}
          </h1>
          <div className="md:block hidden">
            <hr className="text-slate-100" />
            <div className="flex md:flex-row flex-col md:items-center md:justify-between py-3 gap-1">
              <div className="flex flex-row items-center justify-center gap-3">
                <Image
                  src={
                    blog?.auther_image?.fields?.file?.url
                      ? `https:${blog.auther_image.fields.file.url}`
                      : 'https://images.ctfassets.net/f5mq357xxj80/5ZBxFnsbUIfhDA1ABqryHU/a607b9906774c3986a5a006282d73346/HomePageImage.webp'
                  }
                  width={60}
                  height={60}
                  alt={blog.auther || 'Author'}
                  className="rounded-full border-2 border-success"
                  loading="lazy"
                />
                <div className="md:text-start text-center">
                  <h3 className="text-xl font-medium leading-none">
                    {blog.auther}
                  </h3>
                  <span className="text-sm text-slate-500 font-normal leading-none pl-px">
                    {blog.auther_role}
                  </span>
                </div>
              </div>
              <div className="flex flex-row md:justify-end justify-between md:gap-8 gap-2">
                <span className="bg-slate-200 text-slate-500 text-xs rounded px-2 py-1">
                  {blog.read_time}
                </span>
                <span className="text-slate-500 text-sm">
                  {blog.updatedAt ? dateFormat(blog.updatedAt) : ''}
                </span>
              </div>
            </div>
            <hr className="text-slate-100 w-full" />
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="md:hidden flex flex-row justify-between gap-2">
              <span className="bg-slate-200 text-slate-500 text-xs rounded px-2 py-1">
                {blog.read_time}
              </span>
              <span className="text-slate-500 text-sm">
                {blog.updatedAt ? dateFormat(blog.updatedAt) : ''}
              </span>
            </div>
            <Image
              src={
                blog?.image?.fields?.file?.url
                  ? `https:${blog.image.fields.file.url}`
                  : 'https://images.ctfassets.net/f5mq357xxj80/5ZBxFnsbUIfhDA1ABqryHU/a607b9906774c3986a5a006282d73346/HomePageImage.webp'
              }
              width={800}
              height={400}
              alt={blog.title}
              className="rounded-lg w-full"
              loading="lazy"
            />
          </div>
          <div>
            <RichTextOptions richTextContent={blog.content} />
          </div>
        </div>
        <div className="md:px-6.5">
          <RelatedBlogs category={blog.category || ''} id={blog.id} />
        </div>
      </div>
    </div>
  );
};

export default SingleBlogsPage;
