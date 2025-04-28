// app/(404-layout)/not-found.tsx
'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 md:px-8">
      <div className="flex flex-col md:flex-row items-center justify-center gap-12 max-w-6xl w-full">
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="relative w-72 h-72 md:w-[420px] md:h-[420px]">
            <Image
              src="/images/404.png"
              alt="Page not found"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-[#041765] leading-tight">
            404 - Page Not Found
          </h1>
          <p className="mt-4 text-gray-600 text-lg md:text-xl">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Button
            className="mt-6 bg-[#041765] text-white hover:bg-[#041765]/90"
            onClick={() => router.push('/')}
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
}
