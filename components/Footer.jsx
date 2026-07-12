import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-8 px-6 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 text-center">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        &copy; {new Date().getFullYear()} HostSuite. All rights reserved. Powered by Vobels Limited.
      </p>
    </footer>
  );
}
