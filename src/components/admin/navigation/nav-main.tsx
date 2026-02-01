'use client';

import Link from 'next/link';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useMediaQuery } from '@/lib/hooks';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface NavItem {
  title: string;
  url: string;
  icon: React.ReactNode;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

interface NavMainProps {
  items: NavItem[];
}

export function NavMain({ items }: NavMainProps) {
  const isLargeScreen = useMediaQuery('(min-width: 1024px)'); // lg breakpoint

  // Initialize based on screen size
  const [openItems, setOpenItems] = useState<Set<string>>(
    () =>
      new Set(
        items
          .filter((item) => item.items && item.items.length > 0)
          .filter(() => isLargeScreen) // Only open on lg+ screens
          .map((item) => item.title),
      ),
  );

  // When screen size changes, update open items
  const shouldAutoOpen = isLargeScreen;
  const currentOpen = Array.from(openItems).sort().join(',');
  const shouldOpen = items
    .filter((item) => item.items && item.items.length > 0)
    .filter(() => shouldAutoOpen)
    .map((item) => item.title)
    .sort()
    .join(',');

  if (shouldAutoOpen && currentOpen !== shouldOpen) {
    setOpenItems(
      new Set(
        items
          .filter((item) => item.items && item.items.length > 0)
          .map((item) => item.title),
      ),
    );
  } else if (!shouldAutoOpen && currentOpen !== '') {
    setOpenItems(new Set());
  }

  const setItemOpen = (title: string, open: boolean) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (open) {
        next.add(title);
      } else {
        next.delete(title);
      }
      return next;
    });
  };

  return (
    <SidebarMenu>
      {items.map((item) => {
        const hasSubItems = item.items && item.items.length > 0;
        const isOpen = openItems.has(item.title);

        if (!hasSubItems) {
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={item.isActive}
              >
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        }

        return (
          <Collapsible
            key={item.title}
            open={isOpen}
            onOpenChange={(open) => setItemOpen(item.title, open)}
            asChild
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  className="cursor-pointer"
                >
                  {item.icon}
                  <span>{item.title}</span>
                  {isOpen ? (
                    <ChevronDown className="ml-auto w-4 h-4" />
                  ) : (
                    <ChevronRight className="ml-auto w-4 h-4" />
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items &&
                    item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        );
      })}
    </SidebarMenu>
  );
}
