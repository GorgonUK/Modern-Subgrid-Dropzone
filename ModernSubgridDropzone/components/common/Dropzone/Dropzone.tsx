import * as React from 'react';
import { FileIcon, Trash2Icon, CloudUploadIcon, UploadIcon, ArrowUpDown, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { DropEvent, DropzoneOptions, FileRejection } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';
import { Button } from '../shadcn/ui/button';
import { cn } from '../shadcn/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../shadcn/ui/table";
import { Checkbox } from "../shadcn/ui/checkbox";
import { Input } from "../shadcn/ui/input";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

type DropzoneContextType = {
  src?: File[];
  accept?: DropzoneOptions['accept'];
  maxSize?: DropzoneOptions['maxSize'];
  minSize?: DropzoneOptions['minSize'];
  maxFiles?: DropzoneOptions['maxFiles'];
};

const renderBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)}${units[unitIndex]}`;
};

const formatList = (items: string[]) => {
  if (items.length === 0) {
    return '';
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  const allButLast = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return `${allButLast}, and ${last}`;
};

const DropzoneContext = createContext<DropzoneContextType | undefined>(
  undefined
);

export type DropzoneProps = Omit<DropzoneOptions, 'onDrop'> & {
  src?: File[];
  className?: string;
  onDrop?: (
    acceptedFiles: File[],
    fileRejections: FileRejection[],
    event: DropEvent
  ) => void;
  children?: ReactNode;
};

export const Dropzone = ({
  accept,
  maxFiles = 1,
  maxSize,
  minSize,
  onDrop,
  onError,
  disabled,
  src,
  className,
  children,
  ...props
}: DropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles,
    maxSize,
    minSize,
    onError,
    disabled,
    onDrop: (acceptedFiles, fileRejections, event) => {
      if (fileRejections.length > 0) {
        const firstMessage = fileRejections.at(0)?.errors.at(0)?.message;
        if (firstMessage) onError?.(new Error(firstMessage));
        // Do not return; proceed with accepted files
      }

      if (acceptedFiles.length > 0) {
        onDrop?.(acceptedFiles, fileRejections, event);
      }
    },
    ...props,
  });

  return (
    <DropzoneContext.Provider
      key={JSON.stringify(src)}
      value={{ src, accept, maxSize, minSize, maxFiles }}
    >
      <Button
        className={cn(
          'relative h-auto w-full flex-col overflow-hidden p-8',
          isDragActive && 'outline-none ring-1 ring-ring',
          className
        )}
        disabled={disabled}
        type="button"
        variant="outline"
        {...getRootProps()}
      >
        <input {...getInputProps()} disabled={disabled} />
        {children}
      </Button>
    </DropzoneContext.Provider>
  );
};

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext);

  if (!context) {
    throw new Error('useDropzoneContext must be used within a Dropzone');
  }

  return context;
};

export type DropzoneContentProps = {
  children?: ReactNode;
  className?: string;
};

const maxLabelItems = 3;

export const DropzoneContent = ({
  children,
  className,
}: DropzoneContentProps): JSX.Element | null => {
  const { src } = useDropzoneContext();

  if (!src) {
    return null;
  }

  if (children) {
    return <>{children}</>;
  }

  return (
    <div className={cn('flex flex-col items-center justify-center hover:bg-[#F7F7F7] p-8', className)}>
      <CloudUploadIcon className="size-8" />
      <div>
        <p className="font-semibold">Upload files</p>
        <p className="text-sm text-muted-foreground">
          Click here or drag and drop to upload
        </p>
      </div>
    </div>
  );
};

export type DropzoneEmptyStateProps = {
  children?: ReactNode;
  className?: string;
};

export const DropzoneEmptyState = ({
  children,
  className,
}: DropzoneEmptyStateProps): JSX.Element | null => {
  const { src, accept, maxSize, minSize, maxFiles } = useDropzoneContext();

  if (src) {
    return null;
  }

  if (children) {
    return <>{children}</>;
  }

  let caption = '';



  if (minSize && maxSize) {
    caption += ` between ${renderBytes(minSize)} and ${renderBytes(maxSize)}`;
  } else if (minSize) {
    caption += ` at least ${renderBytes(minSize)}`;
  } else if (maxSize) {
    caption += ` less than ${renderBytes(maxSize)}`;
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UploadIcon size={16} />
      </div>
      <p className="my-2 w-full truncate text-wrap font-medium">
        Upload {maxFiles === 1 ? 'a file' : 'files'}
      </p>
      <p className="w-full truncate text-wrap text-muted-foreground text-xs">
        Drag and drop or click to upload
      </p>
      {caption && (
        <p className="text-wrap text-muted-foreground text-xs">{caption}.</p>
      )}
    </div>
  );
};

type FileRow = {
  index: number;
  name: string;
  size: number;
  fileId?: string;
  createdon?: any;
  progress?: number;
}

export function DropzoneFileList({
  files,
  onRemove,
  className,
  progressMap,
  deletingIds,
}: {
  files: File[];
  onRemove: (index: number) => void | Promise<void>;
  className?: string;
  progressMap?: Record<string, number>;
  deletingIds?: Record<string, boolean>;
}) {
  if (!files?.length) return null;

  const data: FileRow[] = files.map((file, idx) => ({
    index: idx,
    name: file.name,
    size: file.size,
    fileId: (file as any).fileId,
    createdon: (file as any).createdon,
    progress: progressMap?.[(file as any).__uploadKey || file.name],
  }));

  const columns: ColumnDef<FileRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
      
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="!p-0">Name <ArrowUpDown className="ml-1 h-4 w-4" /></Button>
      ),
      cell: ({ row }) => {
        const deleting = !!row.original.fileId && !!deletingIds?.[row.original.fileId];
        return (
          <div className={cn("flex items-center gap-2", deleting && "msd-deleting")}>{row.original.name}</div>
        );
      },
    },
    {
      accessorKey: "size",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="!p-0">
          Size <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span>{`${(row.original.size / (1024 * 1024)).toFixed(2)} MB`}</span>,
    },
    {
      id: "actions",
      header: () => <span >Actions</span>,
      cell: ({ row }) => {
        const deleting = !!row.original.fileId && !!deletingIds?.[row.original.fileId];
        return (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Remove ${row.original.name}`}
            onClick={() => onRemove(row.original.index)}
            disabled={deleting}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        )
      },
      enableSorting: false,
    },
  ];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const deleteSelected = async () => {
    const selected = table.getSelectedRowModel().rows.map(r => r.original.index);
    if (!selected.length) return;
    // delete from highest index to lowest to avoid reindexing issues
    const sorted = [...selected].sort((a, b) => b - a);
    for (const idx of sorted) {
      await Promise.resolve(onRemove(idx));
    }
  };

  return (
    <div className={cn("mt-3 flex flex-col gap-2", className)}>
      <div className="flex items-center py-2 px-2 min-w-max justify-between">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
          className="px-2 max-w-[200px]"
        />
        {table.getSelectedRowModel().rows.length > 0 && (
  <div className="ml-auto space-x-2">
    <Button
      variant="outline"
      size="sm"
      onClick={deleteSelected}
    >
      <Trash2Icon className="h-4 w-4" />
      Delete
    </Button>
  </div>
)}

      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const p = row.original.progress;
                const deleting = !!row.original.fileId && !!deletingIds?.[row.original.fileId];
                const uploadingClass = p !== undefined ? (p === 0 ? "msd-uploading-indeterminate" : "msd-uploading") : undefined;
                const styleProp = p !== undefined && p !== 0 ? ({ ["--msd-progress" as any]: `${p}%` } as React.CSSProperties) : undefined;
                return (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className={cn(uploadingClass, deleting && "msd-deleting")} style={styleProp}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-2">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      </div>
    </div>
  );
}
