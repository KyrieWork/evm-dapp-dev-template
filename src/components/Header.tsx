'use client';

import Image from 'next/image';
import { ConnectButton } from './ConnectButton';
import { websiteConfig } from '@/config';

export const Header = () => {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/reown.svg"
              alt="Reown"
              width={40}
              height={40}
              priority
              className="h-10 w-10"
            />
            <h1 className="ml-3 text-lg font-semibold text-gray-900">{websiteConfig.title}</h1>
          </div>
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};
