import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface ActionDropdownProps {
  onEdit: () => void;
  onDelete: () => void;
  stopPropagation?: boolean;
}

export function ActionDropdown({
  onEdit,
  onDelete,
  stopPropagation = true,
}: ActionDropdownProps) {
  return (
    <div className="absolute bottom-2 right-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(event) => stopPropagation && event.stopPropagation()}
            className="flex h-8 w-8 items-center justify-center hover:rounded-full hover:border hover:border-gray-200 hover:bg-white text-gray-600 hover:text-gray-900 hover:shadow cursor-pointer"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(event) => {
              if (stopPropagation) event.stopPropagation();
              onEdit();
            }}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Update
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(event) => {
              if (stopPropagation) event.stopPropagation();
              onDelete();
            }}
            className="gap-2 text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
