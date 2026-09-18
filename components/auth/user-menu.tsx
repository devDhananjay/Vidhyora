"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Package, Settings, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/actions/auth/logout";
import type { SessionUser } from "@/types/user";
import { isSellerAdmin, isPlatformAdmin, roleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  user: SessionUser;
}

/** True only when the device can truly hover (desktop). Starts false to avoid mobile flash-close. */
function useFineHover() {
  const [fineHover, setFineHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setFineHover(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return fineHover;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const fineHover = useFineHover();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const clearCloseTimer = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const closeMenu = () => {
    clearCloseTimer();
    setOpen(false);
  };

  /** Desktop hover bridge — short delay so pointer can move into the panel. */
  const closeMenuSoon = () => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutAction();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hoverProps = fineHover
    ? {
        onPointerEnter: openMenu,
        onPointerLeave: closeMenuSoon,
      }
    : undefined;

  return (
    <DropdownMenu
      open={open}
      // Mobile needs modal so the opening tap doesn't immediately dismiss.
      // Desktop stays non-modal so hover can bridge into the panel.
      modal={!fineHover}
      onOpenChange={(next) => {
        if (next) openMenu();
        else closeMenu();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading}
          aria-label="Account menu"
          className="relative z-[10001]"
          {...hoverProps}
        >
          <User className="size-5 text-[#8b2e2e]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        className={cn(
          "relative z-[10002] w-56",
          "duration-100 data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "before:absolute before:-top-2 before:right-0 before:left-0 before:h-2 before:content-['']",
        )}
        onCloseAutoFocus={(event) => event.preventDefault()}
        {...hoverProps}
      >
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-[#8b2e2e]">
              {user.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs font-medium text-primary">
              {roleLabel(user.role)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings className="mr-2 size-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/orders">
            <Package className="mr-2 size-4" />
            My Orders
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/wishlist">
            <Heart className="mr-2 size-4" />
            Wishlist
          </Link>
        </DropdownMenuItem>

        {isSellerAdmin(user.role) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/seller">Seller Admin</Link>
            </DropdownMenuItem>
          </>
        )}

        {isPlatformAdmin(user.role) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">Super Admin</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/seller">Monitor Seller Admins</Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
          <LogOut className="mr-2 size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
