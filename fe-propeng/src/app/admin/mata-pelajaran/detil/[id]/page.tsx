"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Check, Search } from "lucide-react";
import { DataTable } from "@/components/ui/data-table-detail-class-components/data-table";
import { columns } from "@/components/ui/data-table-detail-class-components/columns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { custom, z } from "zod";
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

// Schema for homeroom teacher validation
const guruMatpelSchema = z.object({
    guruMatpel: z.string().min(1, { message: "Guru wajib dipilih" }),
});

// Schema for adding students
const addStudentsSchema = z.object({
    siswa: z.array(z.string()).min(1, { message: "Minimal satu siswa harus dipilih" }),
});
const customToast = {
    success: (title: string, description: string) => {
        toast.success(title, {
            description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>
        });
    },
    error: (title: string, description: string) => {
        toast.error(title, {
            description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>
        });
    },
    warning: (title: string, description: string) => {
        toast.warning(title, {
            description: <span style={{ color: "white", fontWeight: "500" }}>{description}</span>
        });
    }
};

export default function MatpelDetailPage() {
    const params = useParams();
    const router = useRouter();
    const matpelId = params.id;
    const [matpelData, setMatpelData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // State for modals
    const [isEditMatpelNameOpen, setIsEditMatpelNameOpen] = useState(false);
    const [isEditGuruMatpelOpen, setIsEditGuruMatpelOpen] = useState(false);
    const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
    const [isRemoveStudentsOpen, setIsRemoveStudentsOpen] = useState(false);

    // State for available teachers and students
    const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
    const [availableStudents, setAvailableStudents] = useState<any[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
    const [isTeacherSelectOpen, setIsTeacherSelectOpen] = useState(false);
    const teacherSelectRef = useRef<HTMLDivElement>(null);

    // Filter teachers based on search query
    const filteredTeachers = availableTeachers.filter(teacher =>
        teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase())
    );

    // Handle click outside to close the custom select
    useEffect(() => {
        function handleClickOutside(event: { target: any; }) {
            if (teacherSelectRef.current && !teacherSelectRef.current.contains(event.target)) {
                setIsTeacherSelectOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [teacherSelectRef]);

    // State for selected students to remove
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    // Previous selection ref to prevent infinite loops
    const prevSelectedStudentsRef = useRef<string[]>([]);

    // Forms
    type MatpelNameFormValues = {
        namaMatpel: string;
    };
    
    const matpelNameForm = useForm<MatpelNameFormValues>({
        defaultValues: {
            namaMatpel: "",
        },
    });    

    const guruMatpelForm = useForm<z.infer<typeof guruMatpelSchema>>({
        resolver: zodResolver(guruMatpelSchema),
        defaultValues: {
            guruMatpel: "",
        },
    });

    const addStudentsForm = useForm<z.infer<typeof addStudentsSchema>>({
        resolver: zodResolver(addStudentsSchema),
        defaultValues: {
            siswa: [],
        },
    });

    const getAuthToken = () => {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";
        if (!token) {
            console.error("No authentication token found");
            router.push("/login");
            return null;
        }
        return token;
    };

    const [studentSearchQuery, setStudentSearchQuery] = useState("");
    const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false);
    const studentSelectRef = useRef<HTMLDivElement>(null);

    const filteredStudents = searchTerm
        ? students.filter(student =>
            (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (student.nisn && student.nisn.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (student.username && student.username.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : students;

    const filteredAvailableStudents = studentSearchQuery
        ? availableStudents.filter(student =>
            (student.name && student.name.toLowerCase().includes(studentSearchQuery.toLowerCase())) ||
            (student.nisn && student.nisn.toLowerCase().includes(studentSearchQuery.toLowerCase())) ||
            (student.username && student.username.toLowerCase().includes(studentSearchQuery.toLowerCase()))
        )
        : availableStudents;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (studentSelectRef.current && !studentSelectRef.current.contains(event.target as Node)) {
                setIsStudentSelectOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [studentSelectRef]);

    useEffect(() => {
        const fetchMatpelDetail = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = getAuthToken();
                if (!token) {
                    router.push("/login");
                    return;
                }

                const response = await fetch(`/api/mata-pelajaran/detail`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token} Id ${matpelId}`,
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
                console.log("API Response:", data);

                if (data.status === 200) {
                    setMatpelData({
                        idMatpel: data.data.id,
                        namaMatpel: data.data.nama, 
                        kategoriMatpel: data.data.kategoriMatpel,
                        kodeMatpel: data.data.kode,
                        tahunAjaran: data.data.tahunAjaran,
                        guruMatpel: data.data.teacher.name,
                        totalSiswa: data.data.jumlah_siswa,
                        statusMatpel: data.data.status, 
                        angkatan: data.data.angkatan,
                        siswa_terdaftar: data.data.siswa_terdaftar
                    })

                    matpelNameForm.setValue("namaMatpel", data.data.nama);
                    setStudents(data.data.siswa_terdaftar || []);

                } else {
                    throw new Error(data.errorMessage || "Failed to fetch class details");
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                if (err instanceof Error) {
                    setError(err.message || "An error occurred while fetching data");
                } else {
                    setError("An error occurred while fetching data");
                }

                customToast.error("Gagal memuat data", "Terjadi kesalahan saat mengambil data Mata Pelajaran");
            } finally {
                setLoading(false);
            }
        };

        fetchMatpelDetail();
    }, [matpelId, router]);

    useEffect(() => {
        if (matpelData) {
            matpelNameForm.setValue("namaMatpel", matpelData.namaMatpel);
        }
    }, [matpelData, matpelNameForm]);

    useEffect(() => {
        if (isEditGuruMatpelOpen) {
            const fetchAvailableTeachers = async () => {
                setLoadingTeachers(true);
                try {
                    const token = getAuthToken();
                    if (!token) {
                        router.push("/login");
                        return;
                    }

                    const response = await fetch(`/api/mata-pelajaran/list-teacher`, {
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
                            guruMatpelForm.setValue("guruMatpel", data.data[0].id.toString());
                        }
                    } else {
                        throw new Error(data.errorMessage || "Gagal mendapatkan daftar guru");
                    }

                } catch (err: any) {
                    console.error("Error fetching available teachers:", err);
                    customToast.error("Gagal mengambil data guru", err.message || "Terjadi kesalahan saat mengambil data guru");

                } finally {
                    setLoadingTeachers(false);
                }
            };

            fetchAvailableTeachers();
        }
    }, [isEditGuruMatpelOpen, router, guruMatpelForm]);

    useEffect(() => {
        if (!isAddStudentsOpen) return;

        const fetchAvailableStudents = async () => {
            setLoadingStudents(true);
            setAvailableStudents([]);

            try {
                const token = getAuthToken();
                if (!token) {
                    router.push("/login");
                    return;
                }

                const response = await fetch(`/api/mata-pelajaran/list-student`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token} Angkatan ${matpelData.angkatan}`,
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
                    const registeredIds = matpelData?.siswa_terdaftar?.map((s: any) => s.id) ?? [];
                    const available = data.data.filter((student: any) => {
                        return !registeredIds.includes(student.id);
                    });

                    setAvailableStudents(available);
                    addStudentsForm.setValue("siswa", []);
                } else if (data.status === 404) {
                    setAvailableStudents([]);
                    customToast.warning("Tidak ada siswa", `Tidak ada siswa untuk angkatan ${matpelData.angkatan}`);
                } else {
                    throw new Error(data.errorMessage || "Gagal mendapatkan daftar siswa");
                }

            } catch (err) {
                console.error("Error fetching available students:", err);
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
                customToast.error("Gagal mengambil data siswa", errorMessage);

            } finally {
                setLoadingStudents(false);
            }
        };

        if (matpelData && Array.isArray(matpelData.siswa_terdaftar)) {
            fetchAvailableStudents();
        }

    }, [isAddStudentsOpen, router, addStudentsForm, matpelData]);

    const onUpdateMatpelName = async (data: MatpelNameFormValues) => {
        try {
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }

            const response = await fetch(`/api/mata-pelajaran/ubah`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: matpelId,
                    nama: data.namaMatpel
                }),
            });

            const responseData = await response.json();

            if (responseData.status === 200) {
                setMatpelData((prev: any) => ({
                    ...prev,
                    namaMatpel: data.namaMatpel,
                }));

                customToast.success(
                    "Nama Mata Pelajaran Berhasil Diperbarui!",
                    `Nama Mata Pelajaran berhasil diperbarui menjadi ${data.namaMatpel}`
                );                

                setIsEditMatpelNameOpen(false);
            } else {
                throw new Error(responseData.errorMessage || "Gagal memperbarui nama Mata Pelajaran");
            }

        } catch (err: any) {
            console.error("Error updating mata pelajaran name:", err);
            customToast.error("Gagal memperbarui nama Mata Pelajaran", err.message || "Terjadi kesalahan saat memperbarui nama Mata Pelajaran");  
        }
    };

    const onUpdateGuruMatpel = async (data: z.infer<typeof guruMatpelSchema>) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch(`/api/mata-pelajaran/ubah`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: matpelId,
                    teacher: parseInt(data.guruMatpel)
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
                const selectedTeacher = responseData.data.teacher

                setMatpelData((prev: any) => ({
                    ...prev,
                    guruMatpel: selectedTeacher?.name || "Unknown",
                }));

                customToast.success(
                    "Guru Berhasil Diperbarui!",
                    `Guru berhasil diperbarui menjadi ${selectedTeacher?.name}`
                );
                
                localStorage.setItem('mata_pelajaran_data_refresh', 'true');
                setIsEditGuruMatpelOpen(false);

            } else {
                throw new Error(responseData.errorMessage || "Gagal memperbarui Guru");
            }

        } catch (err: any) {
            customToast.error("Gagal memperbarui guru", err.message || "Terjadi kesalahan saat memperbarui guru");
        }
    };

    const onAddStudents = async (data: { siswa: any[] }) => {
        console.log("iya kepanggil kok heloahjshwbhjbwsjbhws")
        try {
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }

            const studentIds = data.siswa
                .filter(id => id !== null && id !== undefined && id !== "")
                .map(id => parseInt(id));

            console.log(`student ids: ${studentIds}`)
            if (studentIds.length === 0) {
                customToast.error("Tidak ada siswa yang dipilih", "Pilih minimal satu siswa untuk ditambahkan ke Mata Pelajaran");
                return;
            }

            const existingStudentIds = students.map(s => s.id);
            const allStudentIds = Array.from(new Set([...existingStudentIds, ...studentIds]));

            const selectedStudentObjects = studentIds.map(id => {
                const student = availableStudents.find(s => s.id === id || s.id.toString() === id.toString());
                return student;
            }).filter(Boolean);

            const response = await fetch(`/api/mata-pelajaran/ubah`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: matpelId,
                    siswa_terdaftar: allStudentIds,
                }),
            });

            const responseData = await response.json();

            if (responseData.status === 200) {
                const newStudents = selectedStudentObjects.map(student => ({
                    id: student.id,
                    name: student.name,
                    nisn: student.nisn || "",
                    username: student.username || "",
                }));

                setStudents(prevStudents => [...prevStudents, ...newStudents]);
                
                let prevStudents = 0;

                setMatpelData((prev: { totalSiswa: number }) => {
                    prevStudents = prev.totalSiswa;
                    return {
                        ...prev,
                        totalSiswa: newStudents.length,
                    };
                });

                customToast.success(
                    "Siswa Ditambahkan!",
                    `${newStudents.length - prevStudents} siswa berhasil ditambahkan ke Mata Pelajaran`
                );
                
                localStorage.setItem('mata_pelajaran_data_refresh', 'true');

                setIsAddStudentsOpen(false);
                addStudentsForm.reset();
                setStudentSearchQuery("");

            } else {
                throw new Error(responseData.errorMessage || "Gagal menambahkan siswa");
            }

        } catch (err) {
            console.error("Error adding students:", err);
            customToast.error("Gagal menambahkan siswa", "Terjadi kesalahan saat menambahkan siswa");
        }
    };

    const onRemoveStudents = async () => {
        if (selectedStudents.length === 0) {
            customToast.error("Tidak ada siswa yang dipilih", "Pilih minimal satu siswa untuk dihapus dari Mata Pelajaran");
            return;
        }
    
        try {
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }
    
            const remainingStudentIds = students
                .map(s => s.id)
                .filter(id => !selectedStudents.includes(id.toString()));
    
            const response = await fetch(`/api/mata-pelajaran/ubah`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: matpelId,
                    siswa_terdaftar: remainingStudentIds,
                }),
            });
    
            const responseData = await response.json();
    
            if (responseData.status === 200) {
                setStudents(prev => prev.filter(student => !selectedStudents.includes(student.id.toString())));

                setMatpelData((prev: { totalSiswa: number }) => ({
                    ...prev,
                    totalSiswa: remainingStudentIds.length,
                }));
    
                customToast.success(
                    "Siswa berhasil dihapus",
                    `${selectedStudents.length} siswa berhasil dihapus dari Mata Pelajaran`
                );
                
                localStorage.setItem('mata_pelajaran_data_refresh', 'true');
    
                setIsRemoveStudentsOpen(false);
                setSelectedStudents([]);
            } else {
                throw new Error(responseData.errorMessage || "Gagal menghapus siswa dari Mata Pelajaran");
            }
    
        } catch (err) {
            console.error("Error removing students:", err);
            customToast.error("Gagal menghapus siswa", "Terjadi kesalahan saat menghapus siswa");
        }
    };

    const handleRowSelectionChange = (selectedRows: string[]) => {
        const validSelectedRows = selectedRows.filter(id => id !== null && id !== undefined && id !== "");

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
                <Button onClick={() => router.push("/admin/mata-pelajaran")}>
                    Kembali ke Daftar Mata Pelajaran
                </Button>
            </div>
        );
    }

    return (
        <div className="h-full flex-1 flex-col space-y-6 p-8 md:flex">
            <Toaster />

            {/* Class Name with Edit Icon */}
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Mata Pelajaran {matpelData?.namaMatpel}</h1>
                <Dialog open={isEditMatpelNameOpen} onOpenChange={setIsEditMatpelNameOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Nama Mata Pelajaran</DialogTitle>
                            <DialogDescription>
                                Masukkan nama Mata Pelajaran baru
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...matpelNameForm}>
                            <form onSubmit={matpelNameForm.handleSubmit(onUpdateMatpelName)} className="space-y-4">
                                <FormField
                                    control={matpelNameForm.control}
                                    name="namaMatpel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Mata Pelajaran</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: Matematika" {...field} />
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
                                        <Button variant="default" type="submit">Simpan</Button>
                                    </div>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <p className="text-sm text-muted-foreground mt-1">
                Tahun Ajaran: {matpelData?.tahunAjaran}/{parseInt(matpelData?.tahunAjaran || 0) + 1} · Angkatan: {matpelData?.angkatan}
            </p>

            {/* Guru Card */}
            <Card className="w-full max-w-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-500">Guru</span>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-blue-800">
                                {matpelData?.guruMatpel || "Belum ada guru"}
                            </span>
                            <Dialog open={isEditGuruMatpelOpen} onOpenChange={setIsEditGuruMatpelOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Edit Guru</DialogTitle>
                                        <DialogDescription>
                                            Pilih guru yang akan mengampu mata pelajaran
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...guruMatpelForm}>
                                        <form onSubmit={guruMatpelForm.handleSubmit(onUpdateGuruMatpel)} className="space-y-4">
                                            <FormField
                                                control={guruMatpelForm.control}
                                                name="guruMatpel"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Guru</FormLabel>
                                                        <div className="relative" ref={teacherSelectRef}>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        placeholder={loadingTeachers ? "Memuat..." : "Cari guru..."}
                                                                        value={teacherSearchQuery}
                                                                        onChange={(e) => {
                                                                            setTeacherSearchQuery(e.target.value);
                                                                            if (!isTeacherSelectOpen) setIsTeacherSelectOpen(true);
                                                                        }}
                                                                        onFocus={() => setIsTeacherSelectOpen(true)}
                                                                        className={`${field.value ? "pr-10" : ""}`}
                                                                    />
                                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                        <Search className="h-4 w-4 text-gray-400" />
                                                                    </div>
                                                                </div>
                                                            </FormControl>

                                                            {isTeacherSelectOpen && (
                                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                                    {loadingTeachers ? (
                                                                        <div className="p-2 text-gray-500 text-center">Memuat...</div>
                                                                    ) : filteredTeachers.length === 0 ? (
                                                                        <div className="p-2 text-gray-500 text-center">
                                                                            {teacherSearchQuery ? "Tidak ditemukan guru" : "Tidak ada guru yang tersedia"}
                                                                        </div>
                                                                    ) : (
                                                                        filteredTeachers.map((teacher) => (
                                                                            <div
                                                                                key={teacher.id}
                                                                                className={`p-2 cursor-pointer hover:bg-gray-100 ${field.value === teacher.id.toString() ? "bg-gray-100" : ""
                                                                                    }`}
                                                                                onClick={() => {
                                                                                    field.onChange(teacher.id.toString());
                                                                                    setTeacherSearchQuery(teacher.name);
                                                                                    setIsTeacherSelectOpen(false);
                                                                                }}
                                                                            >
                                                                                {teacher.name}
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
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
                                                    <Button variant="default" type="submit">Simpan</Button>
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
                <div className="flex item-center gap-2">
                    {/* Delete Students Button (shown when rows are selected) */}
                    {selectedStudents.length > 0 && (
                        <Dialog open={isRemoveStudentsOpen} onOpenChange={setIsRemoveStudentsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="flex items-center gap-2">
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
                    )}
                    <Dialog open={isAddStudentsOpen} onOpenChange={setIsAddStudentsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default">
                                <Plus className="h-5 w-5 ml-2"/>
                                Tambah Siswa
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Tambah Siswa</DialogTitle>
                                <DialogDescription>
                                    Pilih siswa yang akan ditambahkan ke Mata Pelajaran
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...addStudentsForm}>
                                <form 
                                onSubmit={(e) => {
                                    const rawData = addStudentsForm.getValues();
                                    onAddStudents(rawData);
                                  }}                                
                                className="space-y-4">
                                    <FormField
                                        control={addStudentsForm.control}
                                        name="siswa"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Siswa</FormLabel>
                                                <div ref={studentSelectRef} className="relative">
                                                    <FormControl>
                                                        {loadingStudents ? (
                                                            <div className="border rounded p-2 text-gray-500 text-sm">
                                                                Memuat daftar siswa...
                                                            </div>
                                                        ) : availableStudents.length === 0 ? (
                                                            <div className="border rounded p-2 text-gray-500 text-sm">
                                                                Tidak ada siswa yang tersedia untuk angkatan ini
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                {/* Selected Students Tags */}
                                                                <div className="flex flex-wrap gap-2 mb-2">
                                                                    {field.value.map(studentId => {
                                                                        const student = availableStudents.find(s => s.id.toString() === studentId);
                                                                        return student ? (
                                                                            <div
                                                                                key={student.id}
                                                                                className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
                                                                            >
                                                                                <span className="mr-1">{student.name}</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        field.onChange(field.value.filter(id => id !== studentId));
                                                                                    }}
                                                                                    className="text-gray-500 hover:text-gray-700"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                        ) : null;
                                                                    })}
                                                                </div>

                                                                {/* Student Search Input */}
                                                                <div className="relative">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Cari nama siswa"
                                                                        value={studentSearchQuery}
                                                                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                                                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        onFocus={() => setIsStudentSelectOpen(true)}
                                                                    />
                                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                                                            <path d="M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z"></path>
                                                                            <path d="M21 21l-4.35-4.35"></path>
                                                                        </svg>
                                                                    </div>
                                                                </div>

                                                                {/* Dropdown for search results */}
                                                                {isStudentSelectOpen && (
                                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                                        {filteredAvailableStudents.length === 0 ? (
                                                                            <div className="p-2 text-gray-500 text-center">
                                                                                {studentSearchQuery ? "Tidak ditemukan siswa" : "Tidak ada siswa yang tersedia"}
                                                                            </div>
                                                                        ) : (
                                                                            filteredAvailableStudents
                                                                                .filter(student => !field.value.includes(student.id.toString()))
                                                                                .map((student) => (
                                                                                    <div
                                                                                        key={student.id}
                                                                                        className="p-2 cursor-pointer hover:bg-gray-100"
                                                                                        onClick={() => {
                                                                                            field.onChange([...field.value, student.id.toString()]);
                                                                                            setStudentSearchQuery("");
                                                                                        }}
                                                                                    >
                                                                                        <div className="font-medium">{student.name}</div>
                                                                                    </div>
                                                                                ))
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <div className="mt-2 text-sm text-gray-500">
                                                                    {field.value.length} siswa dipilih dari {availableStudents.length} siswa yang tersedia
                                                                </div>
                                                            </div>
                                                        )}
                                                    </FormControl>
                                                    <FormMessage />
                                                </div>
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
                                            <Button
                                                type="submit"
                                                disabled={addStudentsForm.watch("siswa").length === 0 || loadingStudents}
                                            >
                                                Tambah
                                            </Button>
                                        </div>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

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