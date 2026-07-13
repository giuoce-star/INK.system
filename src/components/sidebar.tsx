"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Calendar, Users, Brush, FileText,
  Wallet, Package, BarChart3, Settings, LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Sticker } from "@/components/stickers"

type NavItem = { href: string; label: string; icon: React.ElementType; soon?: boolean }

const nav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sessoes", label: "Agenda", icon: Calendar },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "#", label: "Projetos", icon: Brush, soon: true },
  { href: "#", label: "Orçamentos", icon: FileText, soon: true },
  { href: "#", label: "Financeiro", icon: Wallet, soon: true },
  { href: "#", label: "Estoque", icon: Package, soon: true },
  { href: "#", label: "Relatórios", icon: BarChart3, soon: true },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

const RED = "#ce2c2c"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function sair() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col shrink-0 border-r-2 border-black">

      {/* Logo */}
      <div className="px-6 pt-8 pb-6 flex items-center gap-3">
        <Sticker.Rosa size={38} style={{ flexShrink: 0 }} />
        <div>
          <span
            className="block text-[1.6rem] font-black tracking-[0.01em] leading-none"
            style={{ fontFamily: "'Syne', sans-serif", color: "#fff" }}
          >
            INK<span style={{ color: RED }}>.</span>system
          </span>
          <p className="text-[8px] text-white/50 tracking-[0.3em] uppercase mt-1.5 font-semibold">
            Gestão de Estúdio
          </p>
        </div>
      </div>

      {/* Divisória vermelha */}
      <div className="px-5 mb-3">
        <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${RED} 0%, rgba(255,255,255,0.08) 70%, transparent 100%)` }} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, soon }) => {
          const active = pathname === href && href !== "#"
          const content = (
            <div
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 select-none",
                active
                  ? "text-white font-bold"
                  : soon
                    ? "text-white/35"
                    : "text-white/70 hover:text-white hover:bg-sidebar-accent"
              )}
              style={active ? {
                background: "rgba(206,44,44,0.16)",
                boxShadow: "inset 0 0 0 1.5px rgba(206,44,44,0.45)",
              } : {}}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full" style={{ background: RED }} />
              )}
              <Icon size={16} strokeWidth={active ? 2.5 : 1.9} style={active ? { color: RED } : {}} />
              <span className="flex-1">{label}</span>
              {soon && (
                <span className="text-[8px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-white/10 text-white/40">
                  em breve
                </span>
              )}
            </div>
          )

          if (soon) {
            return (
              <div key={label} title="Em breve" className="cursor-default">{content}</div>
            )
          }
          return <Link key={label} href={href}>{content}</Link>
        })}
      </nav>

      {/* Rodapé */}
      <div className="p-4 pb-6">
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(206,44,44,0.08)", border: "1.5px solid rgba(206,44,44,0.25)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
            style={{ background: "rgba(206,44,44,0.2)", color: RED, fontFamily: "'Syne', sans-serif", border: `1.5px solid rgba(206,44,44,0.4)` }}
          >
            I
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-wide text-white" style={{ fontFamily: "'Syne', sans-serif" }}>INK.system</p>
            <p className="text-[10px] text-white/45 mt-0.5">Estúdio</p>
          </div>
          <button onClick={sair} title="Sair">
            <LogOut size={14} className="text-white/60 hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  )
}
