import Image from 'next/image'
export default function ResultatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
        <header className="border-b-2 border-accent bg-primary">
             <div className="mx-auto flex w-full max-w-2xl flex-col gap-1 px-5 py-7 sm:px-8">
               <div className="flex flex-row items-center gap-3">
                 <Image src="/logo_ISPA.png" alt="Logo ISPA" width={48} height={48} className="h-18 w-50" />
                 <div className="flex flex-col gap-1">
     <span className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
                 ISPA — Institut Supérieur
               </span>
               <span className="font-serif text-lg leading-tight text-primary-foreground">
                 Classes Préparatoires
               </span>
                 </div>
               </div>
             </div>
           </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-1 px-5 py-6 sm:px-8">
          <p className="text-sm text-muted-foreground">
            Administration des Classes Préparatoires ISPA — session 2026
          </p>
          <p className="text-xs text-muted-foreground/80">
            Les résultats affichés sont fournis à titre informatif et font foi après confirmation du
            secrétariat.
          </p>
        </div>
      </footer>
    </div>
  )
}
