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

// Schema for class name validation
const classNameSchema = z.object({
    namaKelas: z.string()
        .min(1, { message: "Nama kelas wajib diisi" })
        .regex(
            /^(X|XI|XII)([A-Za-z]+)$/,
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

    const [studentSearchQuery, setStudentSearchQuery] = useState("");
    const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false);
    const studentSelectRef = useRef<HTMLDivElement>(null);

    // Add this where you define other state variables
    const filteredStudents = searchTerm
        ? students.filter(student =>
            (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (student.nisn && student.nisn.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (student.username && student.username.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : students;


    // Filter available students based on search query
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



    // Fetch class details
    // Fetch class details
    useEffect(() => {
        const fetchClassDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = getAuthToken();
                if (!token) return;

                console.log("Fetching class details for ID:", classId);

                // Use the new header format
                const response = await fetch(`/api/kelas/detail`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token} Id ${classId}`,
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
                    console.log("Students data from API:", data.siswa);
                    setStudents(data.siswa || []);
                    console.log("Students state after setting:", data.siswa || []);

                    // Show toast for special cases
                    if (data.message === "Tidak ada wali kelas di kelas ini") {
                        customToast.warning("Tidak ada wali kelas", "Kelas ini belum memiliki wali kelas" );
                    } else if (data.message === "Tidak ada siswa di kelas ini") {
                        customToast.warning("Tidak ada siswa", "Kelas ini belum memiliki siswa" );
                    }
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

                customToast.error("Gagal memuat data", "Terjadi kesalahan saat mengambil data kelas");
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

                    const response = await fetch(`/api/kelas/list-available-homeroom`, {
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
                        customToast.error("Tidak ada guru yang tersedia", "Semua guru sudah menjadi wali kelas");
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
    }, [isEditHomeroomOpen, router, homeroomForm]);

    // Fetch available students when angkatan changes
    const selectedAngkatan = addStudentsForm.watch("angkatan");

    // Fetch available students when angkatan changes
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

                // Log the API call for debugging
                console.log(`Fetching available students for angkatan: ${normalizedAngkatan}`);

                const response = await fetch(`/api/kelas/list-available-student?angkatan=${normalizedAngkatan}`, {
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
                console.log("Available students API response:", data);

                if (data.status === 200) {
                    console.log("Available students before filtering:", data.data);

                    // Filter students with isAssignedtoClass=false
                    const unassignedStudents = data.data.filter((student: { isAssignedtoClass: boolean; }) => student.isAssignedtoClass === false);
                    console.log("Unassigned students after filtering:", unassignedStudents);

                    setAvailableStudents(unassignedStudents);
                    addStudentsForm.setValue("siswa", []);
                } else if (data.status === 404) {
                    setAvailableStudents([]);
                    customToast.warning("Tidak ada siswa", `Tidak ada siswa tanpa kelas untuk angkatan ${normalizedAngkatan}`);
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

        fetchAvailableStudents();
    }, [selectedAngkatan, isAddStudentsOpen, router, addStudentsForm]);


    // Add this near the top of your component
    const handleBackNavigation = () => {
        // Force a refresh of the list page when navigating back
        router.push("/admin/kelas");
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


    // Handle form submissions
    const onUpdateClassName = async (data: z.infer<typeof classNameSchema>) => {
        try {
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }

            const response = await fetch(`/api/kelas/update-nama-kelas`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: classId,  // Include ID in the body
                    namaKelas: data.namaKelas
                }),
            });

            const responseData = await response.json();

            if (responseData.status === 200) {
                setClassData((prev: any) => ({
                    ...prev,
                    namaKelas: data.namaKelas,
                }));

                customToast.success(
                    "Nama Kelas Diperbarui!",
                    `Nama kelas berhasil diperbarui menjadi ${data.namaKelas}`
                );                

                setIsEditClassNameOpen(false);
            } else {
                throw new Error(responseData.errorMessage || "Gagal memperbarui nama kelas");
            }
        } catch (err: any) {
            console.error("Error updating class name:", err);
            customToast.error("Gagal memperbarui nama kelas", err.message || "Terjadi kesalahan saat memperbarui nama kelas");  
        }
    };

    const onUpdateHomeroom = async (data: z.infer<typeof homeroomSchema>) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch(`/api/kelas/update-wali-kelas`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: classId,  // Include ID in the body
                    waliKelas: parseInt(data.waliKelas)
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

                customToast.success(
                    "Wali Kelas Diperbarui!",
                    `Wali Kelas berhasil Diperbarui menjadi ${selectedTeacher?.name}`
                );
                

                // Signal that the list page needs to refresh
                localStorage.setItem('kelas_data_refresh', 'true');

                setIsEditHomeroomOpen(false);
            } else {
                throw new Error(responseData.errorMessage || "Gagal memperbarui wali kelas");
            }
        } catch (err: any) {
            console.error("Error updating homeroom teacher:", err);
            customToast.error("Gagal memperbarui wali kelas", err.message || "Terjadi kesalahan saat memperbarui wali kelas");
        }
    };

    const onAddStudents = async (data: { siswa: any[]; angkatan: string; }) => {
        try {
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }

            const studentIds = data.siswa
                .filter(id => id !== null && id !== undefined && id !== "")
                .map(id => parseInt(id));

            if (studentIds.length === 0) {
                customToast.error("Tidak ada siswa yang dipilih", "Pilih minimal satu siswa untuk ditambahkan ke kelas");
                return;
            }

            // Store the selected student objects before making the API call
            const selectedStudentObjects = studentIds.map(id => {
                const student = availableStudents.find(s => s.id === id || s.id.toString() === id.toString());
                return student;
            }).filter(Boolean);

            const response = await fetch(`/api/kelas/add-siswa`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: classId,  // Include ID in the body
                    students: studentIds,
                    angkatan: parseInt(data.angkatan)
                }),
            });

            const responseData = await response.json();

            if (responseData.status === 200) {
                // Update the students state directly with the newly added students
                const newStudents = selectedStudentObjects.map(student => ({
                    id: student.id,
                    name: student.name,
                    nisn: student.nisn || "",
                    username: student.username || "",
                    // Add any other properties that your student objects have
                }));

                // Update students state
                setStudents(prevStudents => [...prevStudents, ...newStudents]);

                // Update class data total students count
                setClassData((prev: { totalSiswa: any; }) => ({
                    ...prev,
                    totalSiswa: (prev.totalSiswa || 0) + newStudents.length
                }));

                // Remove the added students from available students
                setAvailableStudents(prevAvailableStudents =>
                    prevAvailableStudents.filter(student =>
                        !studentIds.includes(parseInt(student.id.toString()))
                    )
                );

                customToast.success(
                    "Siswa Ditambahkan!",
                    `${newStudents.length} siswa berhasil ditambahkan ke kelas`
                );
                

                // Signal that the list page needs to refresh when navigating back
                localStorage.setItem('kelas_data_refresh', 'true');

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
            customToast.error("Tidak ada siswa yang dipilih", "Pilih minimal satu siswa untuk dihapus dari kelas");
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

                    const response = await fetch(`/api/kelas/delete-siswa`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            classId: classId,
                            studentId: studentId
                        })
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
                customToast.success(
                    "Siswa berhasil dihapus",
                    `${successCount} siswa berhasil dihapus dari kelas`
                );

                // Signal that the list page needs to refresh
                localStorage.setItem('kelas_data_refresh', 'true');
            } else {
                customToast.error("Gagal menghapus siswa", "Terjadi kesalahan saat menghapus siswa");
            }

            setIsRemoveStudentsOpen(false);
            setSelectedStudents([]);
        } catch (err: any) {
            console.error("Error removing students:", err);
            customToast.error("Gagal menghapus siswa", "Terjadi kesalahan saat menghapus siswa");
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
                <Button onClick={() => router.push("/admin/kelas")}>
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
                                        <Button variant="default" type="submit">Simpan</Button>
                                    </div>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <p className="text-sm text-muted-foreground mt-1">
                Tahun Ajaran: {classData?.tahunAjaran}/{parseInt(classData?.tahunAjaran || 0) + 1} · Angkatan: {classData?.angkatan}
            </p>

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
                                                        <div className="relative" ref={teacherSelectRef}>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        placeholder={loadingTeachers ? "Memuat..." : "Cari wali kelas..."}
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
                                                                            {teacherSearchQuery ? "Tidak ditemukan wali kelas" : "Tidak ada guru yang tersedia"}
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
                                    Pilih siswa yang akan ditambahkan ke kelas
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...addStudentsForm}>
                                <form onSubmit={addStudentsForm.handleSubmit(onAddStudents)} className="space-y-4">
                                    {/* Keep the angkatan dropdown */}
                                    <FormField
                                        control={addStudentsForm.control}
                                        name="angkatan"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Angkatan</FormLabel>
                                                <Select
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        // Reset selected students when angkatan changes
                                                        addStudentsForm.setValue("siswa", []);
                                                        setStudentSearchQuery("");
                                                    }}
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

                                    {/* Replace the siswa field with a searchable multi-select */}
                                    <FormField
                                        control={addStudentsForm.control}
                                        name="siswa"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Siswa</FormLabel>
                                                <div ref={studentSelectRef} className="relative">
                                                    <FormControl>
                                                        {selectedAngkatan ? (
                                                            loadingStudents ? (
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
                                                            )
                                                        ) : (
                                                            <div className="border rounded p-2 text-gray-500 text-sm">
                                                                Pilih angkatan terlebih dahulu
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
                                                disabled={!selectedAngkatan || addStudentsForm.watch("siswa").length === 0 || loadingStudents}
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
function triggerRefresh() {
    throw new Error("Function not implemented.");
}
