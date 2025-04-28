// src/components/ui/summarystudent/attendance-summary.tsx
import React from 'react';
import { AttendanceSummaryData } from './schema'; // Sesuaikan path
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Sesuaikan path

interface AttendanceSummaryProps {
    data: AttendanceSummaryData | null;
    isLoading: boolean;
    error?: string | null;
}

const statusLabels: { [key: string]: string } = {
    Sakit: 'Sakit', Izin: 'Izin', Alfa: 'Tanpa Keterangan',
};

export function AttendanceSummary({ data, isLoading, error }: AttendanceSummaryProps) {
    const attendanceEntries = data?.rekap_kehadiran
        ? Object.entries(data.rekap_kehadiran)
            .filter(([status]) => status !== 'Hadir' && (data.rekap_kehadiran as any)[status] > 0)
            .sort(([a], [b]) => {
                const order = ['Sakit', 'Izin', 'Alfa']; return order.indexOf(a) - order.indexOf(b);
            }) : [];
    const hasDataToShow = attendanceEntries.length > 0;
    const isAvailable = !isLoading && !error && data?.rekap_kehadiran;

    return (
        // Gunakan div agar styling konsisten dengan tabel nilai (tidak Card di dalam Card)
        <div className="mt-6 border-t pt-6">
            <h2 className="text-lg font-semibold mb-4 px-1">Kehadiran</h2>
            <div className="px-1">
                {isLoading && <p className="text-sm text-muted-foreground">Memuat data kehadiran...</p>}
                {error && !isLoading && <p className="text-sm text-destructive">{error}</p>}
                {!isLoading && !error && !isAvailable && <p className="text-sm text-muted-foreground">Data kehadiran tidak tersedia.</p>}
                {isAvailable && !hasDataToShow && <p className="text-sm text-muted-foreground">Tidak ada catatan absensi (selain hadir).</p>}
                {isAvailable && hasDataToShow && (
                    <div className="space-y-2 text-sm">
                        {attendanceEntries.map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center max-w-xs">
                                <span className="font-medium">{statusLabels[status] || status}</span>
                                <span>{count ?? 0} hari</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}