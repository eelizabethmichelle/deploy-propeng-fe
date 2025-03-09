"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")

        if (token) {
            router.push("/dashboard") 
        } else {
            router.push("/login")
        }
    }, [router])

    return null 
}