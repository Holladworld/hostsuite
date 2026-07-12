import React from 'react';

export default function Navbar() {
  return (
    <nav className="w-full py-4 px-6 flex justify-between items-center bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
      <div className="font-bold text-xl tracking-tight text-neutral-900 dark:text-white">
        Host<span className="text-purple-600">Suite</span>
      </div>
      <div className="flex gap-4">
        <button className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition">Log In</button>
        <button className="text-sm font-medium bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition">Get Started</button>
      </div>
    </nav>
  );
}
