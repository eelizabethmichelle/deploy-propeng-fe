import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <Image 
                src="/404.png" 
                alt="404 Not Found" 
                width={500} 
                height={500} 
                className="mb-4"
            />
            <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
            <Link href="/" passHref>
                <Button className="mt-4">Go back to home</Button>
            </Link>
        </div>
    );
}

export default NotFoundPage;
