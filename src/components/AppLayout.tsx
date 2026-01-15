import { Link, useLocation } from "@tanstack/react-router";
import {
  Calendar,
  ChartPie,
  HandCoins,
  PiggyBank,
  RefreshCw,
  Settings,
  Wallet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { Separator } from "./ui/separator";

const navItems = [
  { to: "/", icon: Calendar, label: "Week" },
  { to: "/summary", icon: ChartPie, label: "Summary" },
  { to: "/recurring", icon: RefreshCw, label: "Recurring" },
  { to: "/lending", icon: HandCoins, label: "Lending" },
  { to: "/income", icon: Wallet, label: "Income" },
] as const;

function NavLink({
  to,
  icon: Icon,
  label,
  isActive,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
}) {
  const { setOpenMobile, isMobile } = useSidebar();

  return (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={label}
    >
      <Link
        to={to}
        onClick={() => {
          if (isMobile) {
            setOpenMobile(false);
          }
        }}
      >
        <Icon className="size-4" />
        <span>{label}</span>
      </Link>
    </SidebarMenuButton>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="h-12 flex items-center justify-center">
          <Link to="/" className="flex items-center gap-2 px-2">
            <PiggyBank className="size-5 text-primary" />
            <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">
              spendin
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <NavLink
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      isActive={
                        item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <NavLink
                to="/settings"
                icon={Settings}
                label="Settings"
                isActive={pathname === "/settings"}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="h-12 shrink-0 flex items-center gap-2 px-3 border-b">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-sm font-medium">
            {navItems.find((i) => (i.to === "/" ? pathname === "/" : pathname.startsWith(i.to)))
              ?.label ||
              (pathname === "/settings" ? "Settings" : "spendin")}
          </h1>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="max-w-md mx-auto h-full">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
