import React from 'react';

export default function SectionTitle({ text1, text2, text3 }) {
  return (
    <div className="flex flex-col items-center text-center justify-center mt-24 px-4 max-w-3xl mx-auto space-y-2">
      {text1 && (
        <span className="text-xs font-bold tracking-widest text-purple-600 uppercase">
          {text1}
        </span>
      )}
      {text2 && (
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {text2}
        </h2>
      )}
      {text3 && (
        <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-xl">
          {text3}
        </p>
      )}
    </div>
  );
}
