import { Logo } from '../components/ui/Logo';

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-900">
      <Logo variant="full" width={240} height={60} className="mb-8" />
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Environment Verified</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-400">The build environment is now stable and ready for Phase 2 integration.</p>
    </div>
  );
}