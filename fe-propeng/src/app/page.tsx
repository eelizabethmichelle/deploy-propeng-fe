"use client"
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {jwtDecode} from "jwt-decode";

interface TokenDecodePayload {
    token_type: string;
    exp: number;
    iat: number;
    jti: string;
    user_id: number;
    email: string;
    role: string;
}

const HomePage = () => {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

        if (!token) {
            console.log("Token tidak ditemukan, redirect ke /login");
            router.push("/login");
            return;
        }

        try {
            const decodedToken = jwtDecode<TokenDecodePayload>(token);
            console.log("Decoded JWT:", decodedToken);

            const { role, exp } = decodedToken;
            if (Date.now() >= exp * 1000) {
                console.error("Token expired, redirect ke /login");
                router.push("/login");
                return;
            }

            // Simpan role di storage
            localStorage.setItem("role", role);
            sessionStorage.setItem("role", role);

            console.log("Redirecting to:", role);
            redirectToRolePage(role, router);
        } catch (error) {
            console.error("Invalid token, redirect ke /login", error);
            router.push("/login");
        }
    }, [router]);

    return <div>Loading...</div>;
};

const redirectToRolePage = (role: string, router: any) => {
    switch (role) {
        case "admin":
            router.push("/profil");
            break;
        case "teacher":
            router.push("/profil");
            break;
        case "student":
            router.push("/profil");
            break;
        default:
            console.warn("Role tidak dikenal:", role);
            router.push("/");
            break;
    }
};

export default HomePage;
