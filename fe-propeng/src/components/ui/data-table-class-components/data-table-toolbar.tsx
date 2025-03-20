// "use client";

// import { Table } from "@tanstack/react-table";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Search } from "lucide-react"; // Add the Search icon
// import { DataTableViewOptions } from "./data-table-view-options";
// import { TrashIcon } from "@radix-ui/react-icons";

// interface DataTableToolbarProps<TData> {
//   table: Table<TData>;
// }

// export function DataTableToolbar<TData>({
//   table,
// }: DataTableToolbarProps<TData>) {
//   return (
//     <div className="flex items-center justify-between">
//       <div className="flex items-center gap-2">
//         <Input
//           placeholder="Cari kelas"
//           value={table.getState().globalFilter ?? ""}
//           onChange={(event) => table.setGlobalFilter(event.target.value)}
//           className="h-10 w-[250px] lg:w-[350px] rounded-lg border border-gray-300"
//         />
//         <Button
//           variant="default"
//           size="sm"
//           className="bg-primary text-white rounded-lg h-10 px-4"
//           onClick={() => table.setGlobalFilter(table.getState().globalFilter)}
//         >
//           <Search className="h-4 w-4" />
//         </Button>
//       </div>

//       <div className="flex items-center gap-2">
//         {table.getFilteredSelectedRowModel().rows.length > 0 ? (
//           <Button variant="outline" size="sm">
//             <TrashIcon className="mr-2 size-4" aria-hidden="true" />
//             Delete ({table.getFilteredSelectedRowModel().rows.length})
//           </Button>
//         ) : null}
//         <DataTableViewOptions table={table} />
//       </div>
//     </div>
//   );
// }