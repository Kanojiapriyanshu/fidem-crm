"use client";

import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminPagination from "./pagination";

type TableAlign = "left" | "center" | "right";
type SortOrder = "asc" | "desc";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getTextAlignClass(align: TableAlign = "left") {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

function getJustifyClass(align: TableAlign = "left") {
  if (align === "center") return "justify-center";
  if (align === "right") return "justify-end";
  return "justify-start";
}

export interface AdminTableColumn<T> {
  id: string;
  header: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  sortField?: string;
  align?: TableAlign;
  headerClassName?: string;
  cellClassName?: string;
  widthClassName?: string;
}

export interface AdminTablePaginationConfig {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  rowOptions?: readonly number[];
  loading?: boolean;
  className?: string;
  showRowsSelector?: boolean;
  showSummary?: boolean;
}

export interface AdminTableExpandable<T> {
  expandedRowId: string | null;
  onToggle: (rowId: string, row: T) => void;
  renderExpandedRow: (row: T) => React.ReactNode;
  canExpand?: (row: T) => boolean;
  expandedRowClassName?: string;
  expandedCellClassName?: string;
}

export interface AdminTableActions<T> {
  header?: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
  align?: TableAlign;
  headerClassName?: string;
  cellClassName?: string;
}

export interface AdminTableProps<T> {
  data: T[];
  columns: AdminTableColumn<T>[];
  rowKey: (row: T, index: number) => string;

  loading?: boolean;
  loadingRows?: number;
  error?: string | null;

  emptyTitle?: string;
  emptyDescription?: string;

  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (field: string) => void;

  expandable?: AdminTableExpandable<T>;
  actions?: AdminTableActions<T>;
  pagination?: AdminTablePaginationConfig;

  onRowClick?: (row: T, rowId: string) => void;
  rowClassName?: (row: T, index: number, isExpanded: boolean) => string;

  className?: string;
  containerClassName?: string;
  tableClassName?: string;
  bodyClassName?: string;
  headerRowClassName?: string;
}

function SortHead({
  label,
  field,
  sortable,
  sortBy,
  sortOrder,
  align = "left",
  headerClassName,
  onSort,
}: {
  label: React.ReactNode;
  field: string;
  sortable?: boolean;
  sortBy?: string;
  sortOrder?: SortOrder;
  align?: TableAlign;
  headerClassName?: string;
  onSort?: (field: string) => void;
}) {
  const isActive = sortable && sortBy === field;

  return (
    <TableHead
      className={cx(
        "py-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500",
        getTextAlignClass(align),
        sortable && "cursor-pointer select-none",
        headerClassName
      )}
      onClick={sortable && onSort ? () => onSort(field) : undefined}
    >
      <div className={cx("flex items-center gap-1", getJustifyClass(align))}>
        {label}
        {isActive ? (
          <span className="text-slate-500">
            {sortOrder === "asc" ? "↑" : "↓"}
          </span>
        ) : null}
      </div>
    </TableHead>
  );
}

function SkeletonRows({
  rows,
  colSpan,
}: {
  rows: number;
  colSpan: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="border-slate-100">
          {Array.from({ length: colSpan }).map((__, cellIndex) => (
            <TableCell key={cellIndex} className="py-4">
              <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function AdminTable<T>({
  data,
  columns,
  rowKey,
  loading = false,
  loadingRows = 6,
  error = null,
  emptyTitle = "No data found",
  emptyDescription = "Try adjusting filters or refreshing the data.",
  sortBy,
  sortOrder = "desc",
  onSort,
  expandable,
  actions,
  pagination,
  onRowClick,
  rowClassName,
  className,
  containerClassName,
  tableClassName,
  bodyClassName,
  headerRowClassName,
}: AdminTableProps<T>) {
  const hasExpandable = Boolean(expandable);
  const hasActions = Boolean(actions);

  const totalColumns =
    columns.length + (hasExpandable ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className={cx("w-full", className)}>
      {error ? (
        <div className="mx-4 mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 md:mx-5">
          {error}
        </div>
      ) : null}

      <div
        className={cx(
          "overflow-hidden rounded-l border border-slate-200 bg-white shadow-sm",
          containerClassName
        )}
      >
        <div className="overflow-x-auto">
          <Table className={cx("border-collapse", tableClassName)}>
            <TableHeader>
              <TableRow
                className={cx(
                  "border-b border-slate-200 hover:bg-transparent",
                  headerRowClassName
                )}
              >
                {hasExpandable ? <TableHead className="w-10 py-4" /> : null}

                {columns.map((column) => (
                  <SortHead
                    key={column.id}
                    label={column.header}
                    field={column.sortField || column.id}
                    sortable={column.sortable}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    align={column.align}
                    headerClassName={cx(
                      column.widthClassName,
                      column.headerClassName
                    )}
                    onSort={onSort}
                  />
                ))}

                {hasActions ? (
                  <TableHead
                    className={cx(
                      "py-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500",
                      getTextAlignClass(actions?.align || "right"),
                      actions?.headerClassName
                    )}
                  >
                    <div
                      className={cx(
                        "flex items-center",
                        getJustifyClass(actions?.align || "right")
                      )}
                    >
                      {actions?.header || "Actions"}
                    </div>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>

            <TableBody className={bodyClassName}>
              {loading ? (
                <SkeletonRows rows={loadingRows} colSpan={totalColumns} />
              ) : null}

              {!loading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={totalColumns} className="py-12 text-center">
                    <div className="mx-auto max-w-md space-y-2">
                      <p className="text-base font-extrabold text-slate-900">
                        {emptyTitle}
                      </p>
                      <p className="text-sm font-medium text-slate-500">
                        {emptyDescription}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading &&
                data.map((row, index) => {
                  const id = rowKey(row, index);
                  const canExpand = expandable?.canExpand
                    ? expandable.canExpand(row)
                    : Boolean(expandable);
                  const isExpanded = canExpand && expandable?.expandedRowId === id;
                  const isClickable = Boolean(onRowClick || (expandable && canExpand));

                  return (
                    <React.Fragment key={id}>
                      <TableRow
                        className={cx(
                          "border-b border-slate-100 transition last:border-b-0",
                          isClickable && "cursor-pointer",
                          isExpanded
                            ? "bg-slate-50"
                            : isClickable && "hover:bg-slate-50/70",
                          rowClassName?.(row, index, Boolean(isExpanded))
                        )}
                        onClick={() => {
                          if (onRowClick) {
                            onRowClick(row, id);
                            return;
                          }

                          if (expandable && canExpand) {
                            expandable.onToggle(id, row);
                          }
                        }}
                      >
                        {hasExpandable ? (
                          <TableCell className="pl-4 pr-1">
                            {canExpand ? (
                              isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              )
                            ) : null}
                          </TableCell>
                        ) : null}

                        {columns.map((column) => (
                          <TableCell
                            key={column.id}
                            className={cx(
                              "py-4",
                              getTextAlignClass(column.align),
                              column.widthClassName,
                              column.cellClassName
                            )}
                          >
                            {column.render(row, index)}
                          </TableCell>
                        ))}

                        {hasActions ? (
                          <TableCell
                            className={cx(
                              "py-4",
                              getTextAlignClass(actions?.align || "right"),
                              actions?.cellClassName
                            )}
                            onClick={(event) => event.stopPropagation()}
                          >
                            {actions?.render(row, index)}
                          </TableCell>
                        ) : null}
                      </TableRow>

                      {isExpanded && expandable ? (
                        <TableRow
                          className={cx(
                            "border-b border-slate-100 bg-slate-50/70 last:border-b-0",
                            expandable.expandedRowClassName
                          )}
                        >
                          <TableCell
                            colSpan={totalColumns}
                            className={cx(
                              "px-6 py-5",
                              expandable.expandedCellClassName
                            )}
                          >
                            {expandable.renderExpandedRow(row)}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </React.Fragment>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination ? (
        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          limit={pagination.limit}
          onPageChange={pagination.onPageChange}
          onLimitChange={pagination.onLimitChange}
          rowOptions={pagination.rowOptions}
          loading={pagination.loading ?? loading}
          className={pagination.className}
          showRowsSelector={pagination.showRowsSelector}
          showSummary={pagination.showSummary}
        />
      ) : null}
    </div>
  );
}