"use client";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { SelectPills } from "@/components/ui/multiple-select";

// Define interfaces for API responses
interface TeacherData {
    id: string;
    name: string;
    username?: string;
    nisp?: string;
    status?: string;
}

interface StudentData {
    id: string;
    name: string;
    nisn?: string;
    username?: string;
    angkatan: number;
}

// Base API URL
const BASE_API_URL = "http://203.194.113.127/api";

// Validation schema with Zod
const formSchema = z.object({
    namaKelas: z.string()
        .min(1, { message: "Nama kelas wajib diisi" })
        .regex(
            /^(X|XI|XII)([A-Za-z]+)$/,
            { message: "Format kelas harus diawali dengan angka Romawi (X, XI, XII) dan diakhiri dengan huruf (A, B, C, dst)" }
        ),
    tahunAjaran: z.string().min(1, { message: "Tahun ajaran wajib diisi" }),
    angkatan: z.string().min(1, { message: "Angkatan wajib dipilih" }),
    waliKelas: z.string().min(1, { message: "Wali kelas wajib dipilih" }),
    siswa: z.array(z.string()).min(1, { message: "Minimal satu siswa harus dipilih" }),
});


type FormData = z.infer<typeof formSchema>;

export default function TambahKelas() {
    const router = useRouter();
    const [availableTeachers, setAvailableTeachers] = useState<TeacherData[]>([]);
    const [availableStudents, setAvailableStudents] = useState<StudentData[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState<boolean>(true);
    const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isExplicitSubmit, setIsExplicitSubmit] = useState<boolean>(false);
    const currentYear = new Date().getFullYear();

    const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    // Filter teachers based on search query
    const filteredTeachers = availableTeachers.filter(teacher =>
        teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase())
    );

    // Handle click outside to close the custom select
    useEffect(() => {
        function handleClickOutside(event: { target: any; }) {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsSelectOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selectRef]);


    // Initialize form with default values
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            namaKelas: "",
            tahunAjaran: currentYear.toString(),
            angkatan: "",
            waliKelas: "",
            siswa: [],
        },
    });

    const selectedAngkatan = form.watch("angkatan");
    const tahunAjaran = parseInt(form.watch("tahunAjaran") || currentYear.toString());

    // Function to get auth token
    const getAuthToken = () => {
        return localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";
    };

    // Prevent Enter key from submitting in any input field
    const preventEnterKeySubmission = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    useEffect(() => {
        const fetchAvailableTeachers = async () => {
            setLoadingTeachers(true);
            try {
                const token = getAuthToken();
                if (!token) {
                    router.push("/login");
                    return;
                }

                const response = await fetch(`${BASE_API_URL}/kelas/list_available_homeroom/`, {
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
                        form.setValue("waliKelas", data.data[0].id.toString());
                    }
                    setError(null);
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
                setError("Gagal mengambil data guru: " + err.message);
            } finally {
                setLoadingTeachers(false);
            }
        };

        fetchAvailableTeachers();
    }, [router]);

    useEffect(() => {
        const fetchAvailableStudents = async () => {
            if (!selectedAngkatan) return;

            setLoadingStudents(true);
            setAvailableStudents([]);
            console.log("Fetching available students for angkatan:", selectedAngkatan);

            try {
                const token = getAuthToken();
                if (!token) {
                    router.push("/login");
                    return;
                }

                const normalizedAngkatan = parseInt(selectedAngkatan);

                const response = await fetch(`${BASE_API_URL}/kelas/list_available_student/${normalizedAngkatan}`, {
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
                    console.log("Available students data:", data.data);
                    setAvailableStudents(data.data);
                    form.setValue("siswa", []);
                } else if (data.status === 404) {
                    setAvailableStudents([]);
                    // Replace the existing toast.warning with this version that has a black description text
                    toast.warning("Tidak ada siswa", {
                        description: (
                            <span style={{
                                color: "#000000",       // Black text for maximum visibility
                                fontWeight: "500",      // Medium font weight for better readability
                            }}>
                                Tidak ada siswa tanpa kelas untuk angkatan {normalizedAngkatan}
                            </span>
                        ),
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

        if (selectedAngkatan) {
            fetchAvailableStudents();
        }
    }, [selectedAngkatan, form, router]);

    // Generate angkatan options
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

    const onSubmit = async (data: FormData) => {
        // Only proceed if explicitly submitted via button click
        if (!isExplicitSubmit) {
            console.log("Preventing automatic form submission");
            return;
        }

        console.log("Form submission triggered with data:", data);
        setIsSubmitting(true);

        try {
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }

            const studentIds = data.siswa
                .filter(id => id !== null && id !== undefined && id !== "")
                .map(id => parseInt(id));

            // In your onSubmit function
            const requestData = {
                namaKelas: data.namaKelas,
                tahunAjaran: parseInt(data.tahunAjaran),
                waliKelas: parseInt(data.waliKelas),
                angkatan: parseInt(data.angkatan),
                siswa: studentIds,
            };

            console.log("Submitting requestData:", requestData);

            const response = await fetch(`${BASE_API_URL}/kelas/create/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(requestData),
            });

            const responseData = await response.json();
            console.log("Response data:", responseData);

            if (responseData.status === 201) {
                toast.success("Kelas Berhasil Ditambahkan!", {
                    description: responseData.message || "Kelas baru telah berhasil dibuat.",
                });
                setTimeout(() => {
                    router.push("/admin/kelas/lihat-kelas");
                }, 1500);
            } else {
                throw new Error(responseData.errorMessage || "Gagal menambahkan kelas");
            }
        } catch (err: any) {
            console.error("Error creating class:", err);
            toast.error("Gagal Menambahkan Kelas", {
                description: err.message || "Terjadi kesalahan saat menambahkan kelas",
            });
        } finally {
            setIsSubmitting(false);
            setIsExplicitSubmit(false); // Reset the flag after submission
        }
    };

    return (
        <div className="flex justify-center items-start min-h-screen p-6 mt-10">
            <Toaster />
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>Tambah Kelas</CardTitle>
                    <CardDescription>Masukkan data kelas baru</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    {error && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
                    )}
                    <Form {...form}>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault(); // Prevent default form submission
                                if (isExplicitSubmit) {
                                    console.log("Form submitted via Tambah button");
                                    form.handleSubmit(onSubmit)(e); // Manually handle submission
                                } else {
                                    console.log("Preventing automatic form submission");
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault(); // Prevent form submission on Enter key
                                    console.log("Enter key pressed, preventing submission");
                                }
                            }}
                            className="space-y-4"
                        >
                            {/* Nama Kelas */}
                            <FormField
                                control={form.control}
                                name="namaKelas"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama Kelas</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Contoh: XA, XIB, XIIC"
                                                {...field}
                                                onKeyDown={preventEnterKeySubmission}
                                            />
                                        </FormControl>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Format: Angka romawi (X, XI, XII) diikuti dengan huruf (A, B, C, dst)
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            {/* Tahun Ajaran */}
                            <FormField
                                control={form.control}
                                name="tahunAjaran"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tahun Ajaran</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium">TA</span>
                                                <Input
                                                    type="number"
                                                    placeholder="Contoh: 2024"
                                                    className="flex-1"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        field.onChange(value);
                                                    }}
                                                    onKeyDown={preventEnterKeySubmission}
                                                />
                                                <span className="text-sm font-medium">/</span>
                                                <Input
                                                    type="number"
                                                    value={field.value ? (parseInt(field.value) + 1).toString() : ""}
                                                    className="flex-1"
                                                    disabled
                                                    readOnly
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            {/* Angkatan */}
                            <FormField
                                control={form.control}
                                name="angkatan"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Angkatan</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger onKeyDown={preventEnterKeySubmission}>
                                                    <SelectValue placeholder="Pilih angkatan" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {angkatanOptions.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                        onKeyDown={preventEnterKeySubmission}
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

                            {/* Wali Kelas - custom searchable dropdown */}
                            <FormField
                                control={form.control}
                                name="waliKelas"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Wali Kelas</FormLabel>
                                        <div className="relative" ref={selectRef}>
                                            <FormControl>
                                                <Input
                                                    placeholder={loadingTeachers ? "Memuat..." : "Cari wali kelas..."}
                                                    value={teacherSearchQuery}
                                                    onChange={(e) => {
                                                        setTeacherSearchQuery(e.target.value);
                                                        if (!isSelectOpen) setIsSelectOpen(true);
                                                    }}
                                                    onFocus={() => setIsSelectOpen(true)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            if (filteredTeachers.length > 0) {
                                                                const firstTeacher = filteredTeachers[0];
                                                                field.onChange(firstTeacher.id.toString());
                                                                setTeacherSearchQuery(firstTeacher.name);
                                                                setIsSelectOpen(false);
                                                            }
                                                        }
                                                    }}
                                                    className={`${form.formState.errors.waliKelas ? "border-red-500" : ""}`}
                                                />
                                            </FormControl>
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                                onClick={() => setIsSelectOpen(!isSelectOpen)}>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className={`transition-transform ${isSelectOpen ? "rotate-180" : ""}`}
                                                >
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </div>

                                            {isSelectOpen && (
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
                                                                    setIsSelectOpen(false);
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


                            {/* Siswa */}
                            <FormField
                                control={form.control}
                                name="siswa"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Siswa</FormLabel>
                                        <FormControl>
                                            {selectedAngkatan ? (
                                                <div
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.stopPropagation(); // Stop Enter key from bubbling to the form
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                >
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
                                                            console.log("Selected student names from SelectPills:", selectedStudentNames);
                                                            const selectedStudentIds = selectedStudentNames
                                                                .map(name => {
                                                                    const student = availableStudents.find(s => s.name.trim() === name.trim());
                                                                    return student ? student.id.toString() : null;
                                                                })
                                                                .filter(id => id !== null);
                                                            console.log("Converted student IDs:", selectedStudentIds);
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

                            {/* Submit Button */}
                            <div className="pt-2">
                                <Button
                                    className="w-full"
                                    type="submit"
                                    disabled={isSubmitting}
                                    onClick={() => setIsExplicitSubmit(true)}
                                >
                                    {isSubmitting ? "Menyimpan..." : "Tambah"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
