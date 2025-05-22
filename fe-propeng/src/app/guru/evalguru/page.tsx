'use client';

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { Search, Settings, ChevronLeft, ChevronRight, EyeOff, FileX } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
  PaginationState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { CaretSortIcon, ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SubjectEvaluation {
  matapelajaran_id: number;
  nama_matapelajaran: string;
  tahun_ajaran: string;
  total_siswa: number;
  total_pengisi_evaluasi: number;
  skor_rata_rata: Record<string, string>;
  response_rate?: number; // Calculated field
  // Add numeric scores for sorting
  score_1?: number;
  score_2?: number;
  score_3?: number;
  score_4?: number;
}

interface ApiResponse {
  status: number;
  message: string;
  data: SubjectEvaluation[];
}

const variableLabels: Record<string, string> = {
  "1": "Materi Pelajaran",
  "2": "Proses Pembelajaran",
  "3": "Pengelolaan Kelas",
  "4": "Evaluasi Pembelajaran",
};

// Column header component with sorting functionality
interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: any;
  title: string;
}

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <CaretSortIcon className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Menaik
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Menurun
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Sembunyikan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function DataTablePagination({ table }: { table: any }) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredRowModel().rows.length} dari{" "}
        {table.getCoreRowModel().rows.length} data
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Baris per halaman</p>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1"
          >
            {[5, 10, 20, 30, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
            {table.getPageCount()}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Halaman sebelumnya</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Halaman berikutnya</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EvaluationOverviewPage() {
  const [evaluationData, setEvaluationData] = useState<SubjectEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Function to get response rate color based on percentage
  const getResponseRateColor = (totalResponses: number, totalStudents: number) => {
    if (totalStudents === 0) return "text-gray-400";
    
    const responseRate = (totalResponses / totalStudents) * 100;
    
    if (responseRate === 100) {
      return "text-green-500";
    } else if (responseRate >= 50) {
      return "text-yellow-500";
    } else {
      return "text-red-500";
    }
  };

  // Function to get color based on evaluation score
  const getEvaluationScoreColor = (score: string | null | undefined) => {
    if (score === null || score === undefined) return "text-gray-400";
    
    // Extract numeric value from string like "3.00 / 5.00"
    const numericScore = extractScore(score);
    console.log("Numeric Score:", numericScore);
    if (numericScore >= 4) {
      return "text-green-500 font-medium";
    } else if (numericScore >= 2) {
      return "text-yellow-500 font-medium";
    } else {
      return "text-red-500 font-medium";
    }
  };

  // Function to calculate and format response rate
  const formatResponseRate = (totalResponses: number, totalStudents: number) => {
    if (totalStudents === 0) return "0%";
    const responseRate = (totalResponses / totalStudents) * 100;
    return `${responseRate.toFixed(0)}%`;
  };

  // Function to check if a subject has any evaluations
  const hasEvaluations = (subject: SubjectEvaluation) => {
    return Object.keys(subject.skor_rata_rata).length > 0;
  };

  // Extract numeric score from string like "4.5 / 5.0"
  const extractScore = (scoreString: string): number => {
    if (!scoreString) return 0;
    const match = scoreString.match(/^([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };
  // Preprocess data to include response rate and numeric scores for sorting
  const processedData = useMemo(() => {
    return evaluationData.map(item => {
      // Prepare object with response rate
      const processedItem: SubjectEvaluation = {
        ...item,
        response_rate: item.total_siswa > 0 
          ? (item.total_pengisi_evaluasi / item.total_siswa * 100) 
          : 0,
        score_1: 0,
        score_2: 0,
        score_3: 0,
        score_4: 0
      };
      
      // Add numeric scores for each variable for sorting
      Object.entries(item.skor_rata_rata).forEach(([varId, scoreStr]) => {
        if (varId === "1") processedItem.score_1 = extractScore(scoreStr);
        else if (varId === "2") processedItem.score_2 = extractScore(scoreStr);
        else if (varId === "3") processedItem.score_3 = extractScore(scoreStr);
        else if (varId === "4") processedItem.score_4 = extractScore(scoreStr);
      });
      
      return processedItem;
    });
  }, [evaluationData]);

  // Define table columns
  const columns = useMemo<ColumnDef<SubjectEvaluation>[]>(() => [
    {
      accessorKey: "nama_matapelajaran",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mata Pelajaran" />
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("nama_matapelajaran")}</div>,
    },
    {
      accessorKey: "tahun_ajaran",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tahun Ajaran" />
      ),
    },
    {
      accessorKey: "response_rate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Respons Siswa" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-center">
            <div className="flex flex-col items-center">
              <span className={getResponseRateColor(item.total_pengisi_evaluasi, item.total_siswa)}>
                {item.total_pengisi_evaluasi} / {item.total_siswa}
              </span>
              <span className={`text-xs ${getResponseRateColor(item.total_pengisi_evaluasi, item.total_siswa)}`}>
                {formatResponseRate(item.total_pengisi_evaluasi, item.total_siswa)}
              </span>
            </div>
          </div>
        );
      },
    },
    // Create sortable columns for each evaluation variable
    ...(Object.entries(variableLabels).map(([id, label]) => ({
      id: `variable_${id}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={label} />
      ),
      accessorKey: `score_${id}` as keyof SubjectEvaluation,
      sortingFn: "basic",      cell: ({ row }) => {
        const item = row.original;
        const score = item.skor_rata_rata[id];
        return (
          <div className="text-center">
            <span className={getEvaluationScoreColor(score)}>
              {score || "-"}
            </span>
          </div>
        );
      },
    })) as ColumnDef<SubjectEvaluation>[]),
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const item = row.original;
        const hasData = hasEvaluations(item);
        
        return (
          <div className="text-center">
            <Link 
              href={hasData ? `/guru/evalguru/${item.matapelajaran_id}` : "#"}
              onClick={(e) => {
                if (!hasData) {
                  e.preventDefault();
                  toast.error("Tidak ada data evaluasi untuk mata pelajaran ini");
                }
              }}
            >
              <Button 
                variant="outline" 
                size="sm"
                className={!hasData ? "opacity-50 cursor-not-allowed" : ""}
              >
                Detail
              </Button>
            </Link>
          </div>
        );
      },
    },
  ], []);

  // Table instance
  const table = useReactTable({
    data: processedData,
    columns,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      globalFilter: searchQuery,
      columnVisibility,
      pagination,
    },
    onGlobalFilterChange: setSearchQuery,
  });

  useEffect(() => {
    const fetchEvaluations = async () => {
      setIsLoading(true);
      try {
        const token =
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken");
        if (!token) {
          setError("Token tidak ditemukan. Silakan login ulang.");
          return;
        }
        const response = await fetch("/api/evalguru/guru/matpel", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        const data: ApiResponse = await response.json();
        
        if (!response.ok) {
          setError(data.message || "Gagal mengambil data evaluasi");
          toast.error(data.message || "Gagal mengambil data evaluasi");
          return;
        }
        
        setEvaluationData(data.data || []);
      } catch (error: any) {
        setError(error.message || "Terjadi kesalahan saat mengambil data evaluasi");
        toast.error(error.message || "Terjadi kesalahan saat mengambil data evaluasi");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, []);
  if (isLoading) {
    return <div className="h-full flex-1 flex-col space-y-4 p-8 md:flex">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold tracking-tight">
            Manajemen Evaluasi Guru
          </h2>
          <p className="text-muted-foreground">
            Lihat semua evaluasi kelas kamu
          </p>
        </div>
      </div>
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <p>Loading data evaluasi...</p>
        </CardContent>
      </Card>
    </div>;
  }
    if (error) {
    return <div className="h-full flex-1 flex-col space-y-4 p-8 md:flex">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold tracking-tight">
            Manajemen Evaluasi Guru
          </h2>
          <p className="text-muted-foreground">
            Lihat semua evaluasi kelas kamu
          </p>
        </div>
      </div>
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    </div>;  }
    if (evaluationData.length === 0) {
    return <div className="h-full flex-1 flex-col space-y-4 p-8 md:flex">
      <div className="flex flex-col space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <h2 className="text-3xl font-semibold tracking-tight">
              Manajemen Evaluasi Guru
            </h2>
            <p className="text-muted-foreground">
              Lihat semua evaluasi kelas kamu
            </p>
          </div>
        </div>
      </div>
      <Card className="border border-muted">
        <CardHeader>
          <CardTitle className="text-lg">Evaluasi Guru</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center py-10">
          <FileX className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground">Tidak ada data evaluasi yang tersedia.</p>
          <p className="text-center text-muted-foreground text-sm mt-1">Silakan hubungi administrator untuk informasi lebih lanjut.</p>
        </CardContent>
      </Card>
    </div>;
  }
  return (
    <div className="h-full flex-1 flex-col space-y-4 p-8 md:flex">
      <div className="flex flex-col space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <h2 className="text-3xl font-semibold tracking-tight">
              Manajemen Evaluasi Guru
            </h2>
            <p className="text-muted-foreground">
              Lihat semua evaluasi kelas kamu
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari mata pelajaran..."
                className="pl-8 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Tampilkan kolom</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Tampilkan kolom</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id.startsWith("variable_") 
                          ? variableLabels[column.id.replace("variable_", "")]
                          : column.id === "nama_matapelajaran"
                          ? "Mata Pelajaran"
                          : column.id === "tahun_ajaran"
                          ? "Tahun Ajaran"
                          : column.id === "response_rate"
                          ? "Respons Siswa"
                          : column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-center">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (                  <TableRow>
                    <TableCell
                      colSpan={table.getAllColumns().length}
                      className="h-24 text-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Tidak ada data yang sesuai dengan pencarian</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-2">
        <DataTablePagination table={table} />
      </div>
      
      <div className="mt-2 text-sm text-muted-foreground">
        <p>Keterangan:</p>
        <p>Tombol Detail hanya aktif untuk mata pelajaran yang sudah memiliki evaluasi.</p>
        <p>Klik pada header kolom untuk mengurutkan data.</p>
        <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Baik (4.0 -- 5.0)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span>Cukup (2.0 -- 4.0)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Kurang (0.0 -- 2.0)</span>
                </div>
              </div>
      </div>
    </div>
  );
}