import { Link, useRouter } from "@tanstack/react-router";
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
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { Separator } from "./ui/separator";

const navItems = [
  { to: "/", icon: Calendar, label: "Week" },
  { to: "/summary", icon: ChartPie, label: "Summary" },
  { to: "/recurring", icon: RefreshCw, label: "Recurring" },
  { to: "/lending", icon: HandCoins, label: "Lending" },
  { to: "/income", icon: Wallet, label: "Income" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const router = useRouter();
  const pathname = router.state.location.pathname;

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
                    <SidebarMenuButton
                      asChild
                      isActive={
                        item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)
                      }
                      tooltip={item.label}
                    >
                      <Link to={item.to}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/settings"} tooltip="Settings">
                <Link to="/settings">
                  <Settings className="size-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
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
