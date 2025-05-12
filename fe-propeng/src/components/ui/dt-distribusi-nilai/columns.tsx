import { ColumnDef } from "@tanstack/react-table";
import { Schema } from "@/components/ui/dt-distribusi-nilai/schema";
import { DataTableColumnHeader } from "@/components/ui/dt-distribusi-nilai/sort";
import { DataTableRowActions } from "@/components/ui/dt-distribusi-nilai/actions";
import { Badge } from "../badge";

export const nilaiColumns: ColumnDef<Schema>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama Siswa" />
    ),
    enableSorting: true,
    cell: ({ row }) => (
      <span className="max-w-[250px] truncate font-medium capitalize">
        {row.getValue("name")}
      </span>
    ),
  },
  {
    accessorKey: "score",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nilai Siswa" />
    ),
    enableSorting: true,
    cell: ({ row }) => (
      <span className="w-[80px] block">{row.getValue("score")}</span>
    ),
  },
  {
    accessorKey: "mean",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Nilai Rata-Rata Mata Pelajaran"
      />
    ),
    enableSorting: true,
    cell: ({ row }) => (
      <span className="w-[80px] block">{row.getValue("mean")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    enableSorting: true,
    cell: ({ getValue }) => {
      const s = getValue<string>()!;
      return s.includes("atas") ? (
        <Badge variant="secondary">{s}</Badge>
      ) : (
        <Badge className="bg-yellow-100 text-yellow-800">{s}</Badge>
      );
    },
  },
  {
    id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Aksi" />
    ),
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
  },
];
