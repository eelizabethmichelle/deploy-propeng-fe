'use client';

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Activity, XCircle, LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComponentSummary, SubjectStatusType, SubjectSummary } from "./schema";
import { DataTableColumnHeader } from "./sort";
import { SubjectListRowActions } from "./subject-list-row-actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../tooltip";

export const statusOptions = [
    { value: 'Terisi Penuh', label: 'Terisi Penuh', icon: CheckCircle, iconColorClass: "text-green-600" }, 
    { value: 'Dalam Proses', label: 'Dalam Proses', icon: LoaderIcon, iconColorClass: "text-primary" }, 
    { value: 'Belum Dimulai', label: 'Belum Dimulai', icon: XCircle, iconColorClass: "text-red-500" },
];

const renderStatusBadge = (status: SubjectStatusType | undefined | null, typeLabel: string) => {
    if (!status) {
        return <span className="text-xs text-muted-foreground">{typeLabel}: N/A</span>; 
    }

    const option = statusOptions.find(opt => opt.value === status);
    if (!option) {
        return <span className="text-xs">{typeLabel}: {status}</span>;
    }

    return (
        <div className="flex items-center space-x-1 whitespace-nowrap">
            <span className="text-xs font-medium">{typeLabel}:</span>
            <Badge variant="outline" className="bg-white text-xs px-1.5 h-5 font-normal">
                <option.icon className={cn("h-3 w-3", option.iconColorClass)} style={{ marginRight: '2px' }} />
                <span>{option.label}</span>
            </Badge>
        </div>
    );
};

export const subjectListColumns: ColumnDef<SubjectSummary>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Mata Pelajaran" />,
        cell: ({ row }) => (
            <Link href={`/guru/manajemennilai/inputnilai/${row.original.id}`} className="hover:underline font-medium">
                {row.original.name}
            </Link>
        ),
        enableSorting: true, enableHiding: false,
    },
    {
        accessorKey: "academicYear",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tahun Ajaran" />,
        cell: ({ row }) => {
            const originalValue = row.getValue("academicYear") as string;

            if (!originalValue || originalValue === "N/A" || originalValue.includes('/')) {
                return <div className="text-center text-sm">{originalValue || 'N/A'}</div>;
            }

            const startYear = parseInt(originalValue, 10);

            if (!isNaN(startYear)) {
                const endYear = startYear + 1;
                const formattedYear = `${startYear}/${endYear}`;
                return <div className="text-center text-sm">TA {formattedYear}</div>; 
            }
            return <div className="text-center text-sm">{originalValue}</div>;
        },
        enableSorting: true,
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
        size: 120,
    },
    {
        id: 'knowledgeWeightCalc',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Bobot Pengetahuan" />,
        cell: ({ row }) => {
            const components = row.original.components;
            const knowledgeWeight = components
                ?.filter(comp => comp.type === 'Pengetahuan')
                .reduce((sum, comp) => sum + (comp.weight ?? 0), 0)
                ?? 0;

            return (
                <div className={cn(
                    "text-center",
                    knowledgeWeight !== 100 && "text-yellow-600 font-semibold"
                )}>
                    {knowledgeWeight}%
                </div>
            );
        },
        enableSorting: true,
        sortingFn: (rowA, rowB, columnId) => {
            const weightA = rowA.original.components?.filter(c=>c.type === 'Pengetahuan').reduce((s,c)=> s + (c.weight ?? 0), 0) ?? 0;
            const weightB = rowB.original.components?.filter(c=>c.type === 'Pengetahuan').reduce((s,c)=> s + (c.weight ?? 0), 0) ?? 0;
            return weightA - weightB;
        },
        size: 130, 
    },
    {
        id: 'skillWeightCalc',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Bobot Keterampilan" />,
        cell: ({ row }) => {
            const components = row.original.components;
            const skillWeight = components
                ?.filter(comp => comp.type === 'Keterampilan')
                .reduce((sum, comp) => sum + (comp.weight ?? 0), 0)
                ?? 0;

            return (
                <div className={cn(
                    "text-center",
                    skillWeight !== 100 && "text-yellow-600 font-semibold" 
                )}>
                    {skillWeight}%
                </div>
            );
        },
        enableSorting: true,
        sortingFn: (rowA, rowB, columnId) => {
            const weightA = rowA.original.components?.filter(c=>c.type === 'Keterampilan').reduce((s,c)=> s + (c.weight ?? 0), 0) ?? 0;
            const weightB = rowB.original.components?.filter(c=>c.type === 'Keterampilan').reduce((s,c)=> s + (c.weight ?? 0), 0) ?? 0;
            return weightA - weightB;
        },
        size: 130,
    },
    {
        accessorKey: "knowledgeComponents",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Komponen Penilaian Pengetahuan" />,
        cell: ({ row }) => {
        const components: ComponentSummary[] | undefined = row.original.components;

        if (!components || !Array.isArray(components) || components.length === 0) {
            return <span className="text-xs text-muted-foreground">Belum Diatur</span>;
        }

        const knowledgeComponents = components.filter(c => c.type === 'Pengetahuan');

        const knowledgeNames = knowledgeComponents.map(c => c.name).join(", ") || "-";
        
        const renderComponentGroup = (
            label: string,
            componentList: ComponentSummary[],
            allNamesTooltip: string,
            labelColorClass: string
        ) => {
            if (componentList.length === 0) {
                return (
                    <div className="text-xs mb-1 last:mb-0 flex items-center flex-wrap gap-x-1">
                        <span className={cn("font-medium", labelColorClass)}>{label}:</span>
                        <span className="text-muted-foreground">Belum Dibuat</span>
                    </div>
                );
            }
            const firstComponentName = componentList[0]?.name ?? 'N/A';
            const remainingCount = componentList.length - 1;

            return (
                <div className="text-xs mb-1 last:mb-0 flex items-center flex-wrap gap-x-1">
                    <span className={cn("font-medium", labelColorClass)}>{label}:</span>
                    
                    <Badge
                                variant="outline" 
                                className="bg-white h-5 px-1.5 font-normal text-xs whitespace-nowrap"
                            >
                                {firstComponentName}
                            </Badge>

                            {remainingCount > 0 && (
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge
                                                variant="outline" 
                                                className="bg-white h-5 px-1.5 text-xs whitespace-nowrap cursor-default"
                                            >
                                                +{remainingCount}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p className="text-xs">{allNamesTooltip}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            
                    )}
                </div>
            );
        };

        return (
            <div className="flex flex-col gap-y-1">
                {renderComponentGroup(
                    'Pengetahuan',
                    knowledgeComponents,
                    knowledgeNames,
                    'text-foreground'
                )}
            </div>
        );
    },
    enableSorting: false,
        filterFn: (row, id, value: string[]) => {
            const components = row.original.components;
            if (!components || value.length === 0) return true;
            return components.some(comp => value.includes(comp.name));
        },
    },
    {
        accessorKey: "skillComponents",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Komponen Penilaian Keterampilan" />,
        cell: ({ row }) => {
        const components: ComponentSummary[] | undefined = row.original.components;

        if (!components || !Array.isArray(components) || components.length === 0) {
            return <span className="text-xs text-muted-foreground">Belum Diatur</span>;
        }

        const skillComponents = components.filter(c => c.type === 'Keterampilan');
        const skillNames = skillComponents.map(c => c.name).join(", ") || "-";
        
        const renderComponentGroup = (
            label: string,
            componentList: ComponentSummary[],
            allNamesTooltip: string,
            labelColorClass: string
        ) => {
            if (componentList.length === 0) {
                return (
                    <div className="text-xs mb-1 last:mb-0 flex items-center flex-wrap gap-x-1">
                        <span className={cn("font-medium", labelColorClass)}>{label}:</span>
                        <span className="text-muted-foreground">Belum Dibuat</span>
                    </div>
                );
            }
            const firstComponentName = componentList[0]?.name ?? 'N/A';
            const remainingCount = componentList.length - 1;

            return (
                <div className="text-xs mb-1 last:mb-0 flex items-center flex-wrap gap-x-1">
                    <span className={cn("font-medium", labelColorClass)}>{label}:</span>
                    
                    <Badge
                                variant="outline" 
                                className="bg-white h-5 px-1.5 font-normal text-xs whitespace-nowrap"
                            >
                                {firstComponentName}
                            </Badge>

                            {remainingCount > 0 && (
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge
                                                variant="outline" 
                                                className="bg-white h-5 px-1.5 text-xs whitespace-nowrap cursor-default"
                                            >
                                                +{remainingCount}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p className="text-xs">{allNamesTooltip}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            
                    )}
                </div>
            );
        };

        return (
            <div className="flex flex-col gap-y-1">
                {renderComponentGroup(
                    'Keterampilan',
                    skillComponents,
                    skillNames,
                    'text-foreground'
                )}
            </div>
        );
    },
    enableSorting: false,
        filterFn: (row, id, value: string[]) => {
            const components = row.original.components;
            if (!components || value.length === 0) return true;
            return components.some(comp => value.includes(comp.name));
        },
    },
    {
        id: "detailedStatus",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status Pengisian Pengetahuan" />,
        cell: ({ row }) => {
            const statusP = row.original.statusPengetahuan;
            const statusK = row.original.statusKeterampilan;
            return (
                <div className="flex flex-col gap-y-1 items-start">
                    {renderStatusBadge(statusP, 'Pengetahuan')}
                </div>
            );
        },
        enableSorting: false, 
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
            const statusValues = Array.isArray(filterValue) ? filterValue : [];

            if (statusValues.length === 0) {
                return true;
            }
            const statusP = row.original.statusPengetahuan;
            const statusK = row.original.statusKeterampilan;

            return statusValues.includes(statusP) || statusValues.includes(statusK);
        },
        size: 150,
    },
    {
        id: "detailedStatus2",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status Pengisian Keterampilan" />,
        cell: ({ row }) => {
            const statusP = row.original.statusPengetahuan;
            const statusK = row.original.statusKeterampilan;
            return (
                <div className="flex flex-col gap-y-1 items-start">
                    {renderStatusBadge(statusK, 'Keterampilan')}
                </div>
            );
        },
        enableSorting: false, 
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
            const statusValues = Array.isArray(filterValue) ? filterValue : [];

            if (statusValues.length === 0) {
                return true;
            }
            const statusP = row.original.statusPengetahuan;
            const statusK = row.original.statusKeterampilan;

            return statusValues.includes(statusP) || statusValues.includes(statusK);
        },
        size: 150,
    },

    {
        id: 'actions',
        header: () => <div className="text- pl-1">Aksi</div>,
        cell: ({ row }) => <div className="text-center"><SubjectListRowActions row={row} /></div>,
        enableSorting: false, enableHiding: false, size: 60,
    }
];