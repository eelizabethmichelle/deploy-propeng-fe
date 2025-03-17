// src/app/admin/detail-kelas/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Check } from "lucide-react";
import { DataTable } from "@/components/ui/data-table-detail-class-components/data-table";
import { columns } from "@/components/ui/data-table-detail-class-components/columns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SelectPills } from "@/components/ui/multiple-select";

// Schema for class name validation
const classNameSchema = z.object({
    namaKelas: z.string()
        .min(1, { message: "Nama kelas wajib diisi" })
        .regex(
            /^(X|IX|IV|V?I{0,3})([A-Za-z]+)$/,
            { message: "Format kelas harus diawali dengan angka Romawi (X, XI, XII) dan diakhiri dengan huruf (A, B, C, dst)" }
        ),
});

// Schema for homeroom teacher validation
const homeroomSchema = z.object({
    waliKelas: z.string().min(1, { message: "Wali kelas wajib dipilih" }),
});

// Schema for adding students
const addStudentsSchema = z.object({
    angkatan: z.string().min(1, { message: "Angkatan wajib dipilih" }),
    siswa: z.array(z.string()).min(1, { message: "Minimal satu siswa harus dipilih" }),
});

export default function ClassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.id;
    const [classData, setClassData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // State for modals
    const [isEditClassNameOpen, setIsEditClassNameOpen] = useState(false);
    const [isEditHomeroomOpen, setIsEditHomeroomOpen] = useState(false);
    const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
    const [isRemoveStudentsOpen, setIsRemoveStudentsOpen] = useState(false);

    // State for available teachers and students
    const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
    const [availableStudents, setAvailableStudents] = useState<any[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // State for selected students to remove
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    // Previous selection ref to prevent infinite loops
    const prevSelectedStudentsRef = useRef<string[]>([]);

    // Forms
    const classNameForm = useForm<z.infer<typeof classNameSchema>>({
        resolver: zodResolver(classNameSchema),
        defaultValues: {
            namaKelas: "",
        },
    });

    const homeroomForm = useForm<z.infer<typeof homeroomSchema>>({
        resolver: zodResolver(homeroomSchema),
        defaultValues: {
            waliKelas: "",
        },
    });

    const addStudentsForm = useForm<z.infer<typeof addStudentsSchema>>({
        resolver: zodResolver(addStudentsSchema),
        defaultValues: {
            angkatan: "",
            siswa: [],
        },
    });

    // Function to get auth token
    const getAuthToken = () => {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";
        if (!token) {
            console.error("No authentication token found");
            router.push("/login");
            return null;
        }
        return token;
    };

    // Fetch class details
    useEffect(() => {
        const fetchClassDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = getAuthToken();
                if (!token) return;

                // Fetch class details with students included
                const response = await fetch(`http://127.0.0.1:8000/api/kelas/${classId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem("accessToken");
                        sessionStorage.removeItem("accessToken");
                        router.push("/login");
                        return;
                    }
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                const data = await response.json();

                if (data.status === 201) {
                    // Set class data
                    setClassData({
                        id: data.id,
                        namaKelas: data.namaKelas,
                        tahunAjaran: data.tahunAjaran,
                        waliKelas: data.waliKelas,
                        totalSiswa: data.totalSiswa,
                        isActive: data.isActive,
                        angkatan: data.angkatan
                    });

                    // Set default value for class name form
                    classNameForm.setValue("namaKelas", data.namaKelas);

                    // Set students data
                    setStudents(data.siswa || []);

                    // Show toast for special cases
                    if (data.message === "Tidak ada wali kelas di kelas ini") {
                        toast.warning("Tidak ada wali kelas", {
                            description: "Kelas ini belum memiliki wali kelas"
                        });
                    } else if (data.message === "Tidak ada siswa di kelas ini") {
                        toast.warning("Tidak ada siswa", {
                            description: "Kelas ini belum memiliki siswa"
                        });
                    }
                } else {
                    throw new Error(data.errorMessage || "Failed to fetch class details");
                }
            } catch (err: any) {
                console.error("Error fetching data:", err);
                setError(err.message || "An error occurred while fetching data");

                toast.error("Gagal memuat data", {
                    description: err.message || "Terjadi kesalahan saat mengambil data kelas"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchClassDetails();
    }, [classId, router]);


    // Update form values when classData changes
    useEffect(() => {
        if (classData) {
            classNameForm.setValue("namaKelas", classData.namaKelas);
        }
    }, [classData, classNameForm]);

    // Fetch available teachers when edit homeroom modal opens
    useEffect(() => {
        if (isEditHomeroomOpen) {
            const fetchAvailableTeachers = async () => {
                setLoadingTeachers(true);
                try {
                    const token = getAuthToken();
                    if (!token) {
                        router.push("/login");
                        return;
                    }

                    const response = await fetch("http://127.0.0.1:8000/api/kelas/list_available_homeroom/", {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        },
                    });

                    if (response.status === 401) {
                        localStorage.removeItem("accessToken");
                        sessionStorage.removeItem("accessToken");
                        router.push("/login");
                        return;
                    }

                    const data = await response.json();

                    if (data.status === 200) {
                        setAvailableTeachers(data.data);
                        if (data.data && data.data.length > 0) {
                            homeroomForm.setValue("waliKelas", data.data[0].id.toString());
                        }
                    } else if (data.status === 404) {
                        setAvailableTeachers([]);
                        toast.error("Tidak ada guru yang tersedia", {
                            description: "Semua guru sudah menjadi wali kelas",
                        });
                    } else {
                        throw new Error(data.errorMessage || "Gagal mendapatkan daftar guru");
                    }
                } catch (err: any) {
                    console.error("Error fetching available teachers:", err);
                    toast.error("Gagal mengambil data guru", { description: err.message });
                } finally {
                    setLoadingTeachers(false);
                }
            };

            fetchAvailableTeachers();
        }
    }, [isEditHomeroomOpen, router, homeroomForm]);

    // Fetch available students when angkatan changes
    const selectedAngkatan = addStudentsForm.watch("angkatan");

    useEffect(() => {
        if (!selectedAngkatan || !isAddStudentsOpen) return;

        const fetchAvailableStudents = async () => {
            setLoadingStudents(true);
            setAvailableStudents([]);

            try {
                const token = getAuthToken();
                if (!token) {
                    router.push("/login");
                    return;
                }

                const normalizedAngkatan = parseInt(selectedAngkatan);

                const response = await fetch(`http://127.0.0.1:8000/api/kelas/list_available_student/${normalizedAngkatan}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    localStorage.removeItem("accessToken");
                    sessionStorage.removeItem("accessToken");
                    router.push("/login");
                    return;
                }

                const data = await response.json();

                if (data.status === 200) {
                    setAvailableStudents(data.data);
                    addStudentsForm.setValue("siswa", []);
                } else if (data.status === 404) {
                    setAvailableStudents([]);
                    toast.warning("Tidak ada siswa", {
                        description: `Tidak ada siswa tanpa kelas untuk angkatan ${normalizedAngkatan}`,
                    });
                } else {
                    throw new Error(data.errorMessage || "Gagal mendapatkan daftar siswa");
                }
            } catch (err: any) {
                console.error("Error fetching available students:", err);
                toast.error("Gagal mengambil data siswa", { description: err.message });
            } finally {
                setLoadingStudents(false);
            }
        };

        fetchAvailableStudents();
    }, [selectedAngkatan, isAddStudentsOpen, router, addStudentsForm]);

    // Add this near the top of your component
    const handleBackNavigation = () => {
        // Force a refresh of the list page when navigating back
        router.push("/admin/lihat-kelas");
    };


    // Generate angkatan options
    const tahunAjaran = parseInt(classData?.tahunAjaran || new Date().getFullYear().toString());
    const angkatanOptions = [
        tahunAjaran - 2,
        tahunAjaran - 1,
        tahunAjaran,
        tahunAjaran + 1,
        tahunAjaran + 2,
    ].map((year) => ({
        value: year.toString(),
        label: year.toString(),
    }));

    // Filter students based on search term
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nisn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle form submissions
    const onUpdateClassName = async (data: z.infer<typeof classNameSchema>) => {
        try {
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }

            const response = await fetch(`http://127.0.0.1:8000/api/kelas/update_nama_kelas/${classId}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    namaKelas: data.namaKelas,
                }),
            });

            const responseData = await response.json();

            if (responseData.status === 200) {
                setClassData((prev: any) => ({
                    ...prev,
                    namaKelas: data.namaKelas,
                }));

                toast("", {
                    description: (
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
                                <Check className="text-background w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-foreground font-sans">Nama Kelas Diperbarui!</p>
                                <p className="text-sm text-muted-foreground font-sans">
                                    Nama kelas berhasil diperbarui menjadi {data.namaKelas}
                                </p>
                            </div>
                        </div>
                    ),
                });

                setIsEditClassNameOpen(false);
            } else {
                throw new Error(responseData.errorMessage || "Gagal memperbarui nama kelas");
            }
        } catch (err: any) {
            console.error("Error updating class name:", err);
            toast.error("Gagal memperbarui nama kelas", {
                description: err.message,
            });
        }
    };

    const onUpdateHomeroom = async (data: z.infer<typeof homeroomSchema>) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch(`http://127.0.0.1:8000/api/kelas/update_wali_kelas/${classId}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    waliKelas: parseInt(data.waliKelas),
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem("accessToken");
                    sessionStorage.removeItem("accessToken");
                    router.push("/login");
                    return;
                }
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const responseData = await response.json();

            if (responseData.status === 200) {
                // Find the teacher name from the selected ID
                const selectedTeacher = availableTeachers.find(
                    teacher => teacher.id.toString() === data.waliKelas
                );

                setClassData((prev: any) => ({
                    ...prev,
                    waliKelas: selectedTeacher?.name || "Unknown",
                }));

                toast("", {
                    description: (
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
                                <Check className="text-background w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-foreground font-sans">Wali Kelas Diperbarui!</p>
                                <p className="text-sm text-muted-foreground font-sans">
                                    Wali kelas berhasil diperbarui
                                </p>
                            </div>
                        </div>
                    ),
                });

                // Signal that the list page needs to refresh
                localStorage.setItem('kelas_data_refresh', 'true');

                setIsEditHomeroomOpen(false);
            } else {
                throw new Error(responseData.errorMessage || "Gagal memperbarui wali kelas");
            }
        } catch (err: any) {
            console.error("Error updating homeroom teacher:", err);
            toast.error("Gagal memperbarui wali kelas", {
                description: err.message || "Terjadi kesalahan saat memperbarui wali kelas",
            });
        }
    };

    const onAddStudents = async (data: z.infer<typeof addStudentsSchema>) => {
        try {
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }

            const studentIds = data.siswa
                .filter(id => id !== null && id !== undefined && id !== "")
                .map(id => parseInt(id));

            const response = await fetch(`http://127.0.0.1:8000/api/kelas/add_siswa_to_kelas/${classId}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    students: studentIds,
                    angkatan: parseInt(data.angkatan)
                }),
            });

            const responseData = await response.json();

            if (responseData.status === 200) {
                // Refresh the class data to get updated student list
                const refreshResponse = await fetch(`http://127.0.0.1:8000/api/kelas/${classId}/`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });

                const refreshData = await refreshResponse.json();

                if (refreshData.status === 201) {
                    setClassData({
                        id: refreshData.id,
                        namaKelas: refreshData.namaKelas,
                        tahunAjaran: refreshData.tahunAjaran,
                        waliKelas: refreshData.waliKelas,
                        totalSiswa: refreshData.totalSiswa,
                        isActive: refreshData.isActive,
                        angkatan: refreshData.angkatan
                    });

                    setStudents(refreshData.siswa || []);
                }

                toast("", {
                    description: (
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
                                <Check className="text-background w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-foreground font-sans">Siswa Ditambahkan!</p>
                                <p className="text-sm text-muted-foreground font-sans">
                                    {studentIds.length} siswa berhasil ditambahkan ke kelas
                                </p>
                            </div>
                        </div>
                    ),
                });

                setIsAddStudentsOpen(false);
                addStudentsForm.reset();
            } else {
                throw new Error(responseData.errorMessage || "Gagal menambahkan siswa");
            }

        } catch (err: any) {
            console.error("Error adding students:", err);
            toast.error("Gagal menambahkan siswa", {
                description: err.message,
            });
        }
    };

    const onRemoveStudents = async () => {
        if (selectedStudents.length === 0) {
            toast.error("Tidak ada siswa yang dipilih", {
                description: "Pilih minimal satu siswa untuk dihapus dari kelas",
            });
            return;
        }

        try {
            const token = getAuthToken();
            if (!token) return;

            // Log the selected students for debugging
            console.log("Selected students to remove:", selectedStudents);

            let successCount = 0;
            let errorCount = 0;

            // Process each student deletion one by one
            for (const studentId of selectedStudents) {
                try {
                    // Make sure studentId is valid
                    if (!studentId) {
                        console.error(`Invalid student ID: ${studentId}`);
                        errorCount++;
                        continue;
                    }

                    // Log the URL being called for debugging
                    const url = `http://127.0.0.1:8000/api/kelas/delete_siswa_from_kelas/${classId}/${studentId}/`;
                    console.log(`Deleting student with URL: ${url}`);

                    const response = await fetch(url, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        }
                    });

                    // Check if response is OK
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`Error response (${response.status}):`, errorText);

                        if (response.status === 401) {
                            localStorage.removeItem("accessToken");
                            sessionStorage.removeItem("accessToken");
                            router.push("/login");
                            return;
                        }

                        errorCount++;
                        continue;
                    }

                    // Try to parse the JSON response
                    const responseText = await response.text();
                    let responseData;

                    try {
                        responseData = JSON.parse(responseText);
                    } catch (e) {
                        console.error("Failed to parse response as JSON:", responseText);
                        errorCount++;
                        continue;
                    }

                    if (responseData.status === 200) {
                        successCount++;
                    } else {
                        errorCount++;
                        console.error(`Failed to delete student ${studentId}: ${responseData.errorMessage}`);
                    }
                } catch (err) {
                    errorCount++;
                    console.error(`Error deleting student ${studentId}:`, err);
                }
            }

            // Update UI based on results
            if (successCount > 0) {
                // Update the students list by removing the deleted students
                setStudents(prev => prev.filter(student => !selectedStudents.includes(student.id.toString())));

                // Update total students count
                setClassData((prev: { totalSiswa: number; }) => ({
                    ...prev,
                    totalSiswa: prev.totalSiswa - successCount,
                }));

                // Show success toast
                toast("", {
                    description: (
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
                                <Check className="text-background w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-foreground font-sans">Siswa Dihapus!</p>
                                <p className="text-sm text-muted-foreground font-sans">
                                    {successCount} siswa berhasil dihapus dari kelas
                                    {errorCount > 0 ? ` (${errorCount} gagal)` : ''}
                                </p>
                            </div>
                        </div>
                    ),
                });

                // Signal that the list page needs to refresh
                localStorage.setItem('kelas_data_refresh', 'true');
            } else {
                toast.error("Gagal menghapus siswa", {
                    description: "Tidak ada siswa yang berhasil dihapus dari kelas",
                });
            }

            setIsRemoveStudentsOpen(false);
            setSelectedStudents([]);
        } catch (err: any) {
            console.error("Error removing students:", err);
            toast.error("Gagal menghapus siswa", {
                description: err.message || "Terjadi kesalahan saat menghapus siswa",
            });
        }
    };



    // Handle row selection for student removal
    // In your detail-kelas/[id]/page.tsx
    const handleRowSelectionChange = (selectedRows: string[]) => {
        // Log the selected rows for debugging
        console.log("Selected rows:", selectedRows);

        // Make sure we're getting valid IDs
        const validSelectedRows = selectedRows.filter(id => id !== null && id !== undefined && id !== "");

        // Compare with previous selection to avoid unnecessary updates
        if (JSON.stringify(prevSelectedStudentsRef.current) !== JSON.stringify(validSelectedRows)) {
            prevSelectedStudentsRef.current = validSelectedRows;
            setSelectedStudents(validSelectedRows);
        }
    };


    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    if (error) {
        return (
            <div className="p-8 flex flex-col items-center justify-center">
                <div className="text-red-500 mb-4">Error: {error}</div>
                <Button onClick={() => router.push("/admin/lihat-kelas")}>
                    Kembali ke Daftar Kelas
                </Button>
            </div>
        );
    }

    return (
        <div className="h-full flex-1 flex-col space-y-6 p-8 md:flex">
            <Toaster />

            {/* Class Name with Edit Icon */}
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Kelas {classData?.namaKelas}</h1>
                <Dialog open={isEditClassNameOpen} onOpenChange={setIsEditClassNameOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Nama Kelas</DialogTitle>
                            <DialogDescription>
                                Masukkan nama kelas baru dengan format yang sesuai
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...classNameForm}>
                            <form onSubmit={classNameForm.handleSubmit(onUpdateClassName)} className="space-y-4">
                                <FormField
                                    control={classNameForm.control}
                                    name="namaKelas"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Kelas</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: XA, XIB, XIIC" {...field} />
                                            </FormControl>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Format: Angka romawi (X, XI, XII) diikuti dengan huruf (A, B, C, dst)
                                            </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter className="sm:justify-end">
                                    <div className="flex gap-4">
                                        <DialogClose asChild>
                                            <Button type="button" variant="secondary">
                                                Batal
                                            </Button>
                                        </DialogClose>
                                        <Button type="submit">Simpan</Button>
                                    </div>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Wali Kelas Card */}
            <Card className="w-full max-w-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-500">Wali Kelas</span>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-blue-800">
                                {classData?.waliKelas || "Belum ada wali kelas"}
                            </span>
                            <Dialog open={isEditHomeroomOpen} onOpenChange={setIsEditHomeroomOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Edit Wali Kelas</DialogTitle>
                                        <DialogDescription>
                                            Pilih guru yang akan menjadi wali kelas
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...homeroomForm}>
                                        <form onSubmit={homeroomForm.handleSubmit(onUpdateHomeroom)} className="space-y-4">
                                            <FormField
                                                control={homeroomForm.control}
                                                name="waliKelas"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Wali Kelas</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            defaultValue={availableTeachers.length > 0 ? availableTeachers[0].id.toString() : undefined}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={loadingTeachers ? "Memuat..." : "Pilih wali kelas"} />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {availableTeachers.length === 0 && !loadingTeachers && (
                                                                    <div className="p-2 text-gray-500 text-center">
                                                                        Tidak ada guru yang tersedia
                                                                    </div>
                                                                )}
                                                                {availableTeachers.map((teacher) => (
                                                                    <SelectItem
                                                                        key={teacher.id}
                                                                        value={teacher.id.toString()}
                                                                    >
                                                                        {teacher.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <DialogFooter className="sm:justify-end">
                                                <div className="flex gap-4">
                                                    <DialogClose asChild>
                                                        <Button type="button" variant="secondary">
                                                            Batal
                                                        </Button>
                                                    </DialogClose>
                                                    <Button type="submit">Simpan</Button>
                                                </div>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Students Table */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Cari nama siswa, NISN, username"
                        className="w-[300px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dialog open={isAddStudentsOpen} onOpenChange={setIsAddStudentsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-800 hover:bg-blue-900">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Siswa
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Tambah Siswa</DialogTitle>
                            <DialogDescription>
                                Pilih siswa yang akan ditambahkan ke kelas
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...addStudentsForm}>
                            <form onSubmit={addStudentsForm.handleSubmit(onAddStudents)} className="space-y-4">
                                <FormField
                                    control={addStudentsForm.control}
                                    name="angkatan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Angkatan</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih angkatan" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {angkatanOptions.map((option) => (
                                                        <SelectItem
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={addStudentsForm.control}
                                    name="siswa"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Siswa</FormLabel>
                                            <FormControl>
                                                {selectedAngkatan ? (
                                                    <div>
                                                        <SelectPills
                                                            data={availableStudents
                                                                .filter(siswa => siswa.id !== null && siswa.id !== undefined)
                                                                .map((siswa) => ({
                                                                    id: siswa.id.toString(),
                                                                    name: siswa.name,
                                                                }))}
                                                            value={field.value
                                                                .map(id => {
                                                                    const student = availableStudents.find(s => s.id.toString() === id);
                                                                    return student ? student.name : '';
                                                                })
                                                                .filter(Boolean)}
                                                            onValueChange={(selectedStudentNames) => {
                                                                const selectedStudentIds = selectedStudentNames
                                                                    .map(name => {
                                                                        const student = availableStudents.find(s => s.name.trim() === name.trim());
                                                                        return student ? student.id.toString() : null;
                                                                    })
                                                                    .filter(id => id !== null) as string[];
                                                                field.onChange(selectedStudentIds);
                                                            }}
                                                            placeholder={loadingStudents ? "Memuat..." : "Cari nama siswa"}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="border rounded p-2 text-gray-500 text-sm">
                                                        Pilih angkatan terlebih dahulu
                                                    </div>
                                                )}
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter className="sm:justify-end">
                                    <div className="flex gap-4">
                                        <DialogClose asChild>
                                            <Button type="button" variant="secondary">
                                                Batal
                                            </Button>
                                        </DialogClose>
                                        <Button type="submit">Tambah</Button>
                                    </div>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Delete Students Button (shown when rows are selected) */}
            {selectedStudents.length > 0 && (
                <div className="flex justify-end">
                    <Dialog open={isRemoveStudentsOpen} onOpenChange={setIsRemoveStudentsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                Hapus Siswa ({selectedStudents.length})
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Hapus Siswa</DialogTitle>
                                <DialogDescription>
                                    Apakah Anda yakin ingin menghapus {selectedStudents.length} siswa yang terpilih?
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="sm:justify-end">
                                <div className="flex gap-4">
                                    <Button type="button" onClick={onRemoveStudents} variant="secondary">
                                        Ya, Hapus
                                    </Button>
                                    <DialogClose asChild>
                                        <Button type="button">Batal</Button>
                                    </DialogClose>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
            
            <DataTable
                columns={columns}
                data={filteredStudents}
                onRowSelectionChange={(selectedRows) => {
                    // Make sure selectedRows contains valid student IDs
                    const validSelectedRows = selectedRows.filter(id => id !== null && id !== undefined && id !== "");
                    handleRowSelectionChange(validSelectedRows);
                }}
            />

        </div>
    );
}
function triggerRefresh() {
    throw new Error("Function not implemented.");
}

