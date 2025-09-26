import Brand from "./Brand";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex">
      <div className="hidden lg:flex flex-1 bg-[color:var(--color-secondary)] text-white items-center justify-center p-12">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-3">Bem-vindo(a) ao GUIEDUC</h1>
          <p className="text-white/90">Sua plataforma educacional acessível em qualquer dispositivo — web, Android e iOS.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">{children}</div>
    </div>
  );
}
