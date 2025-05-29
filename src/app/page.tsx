import { Header } from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="flex justify-center gap-8 space-y-8 rounded-lg bg-white p-6 shadow-md">
            <div>Content</div>
          </section>
        </div>
      </main>
    </div>
  );
}
