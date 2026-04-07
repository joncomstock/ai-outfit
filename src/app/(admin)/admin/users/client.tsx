"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  onboardingState: string;
  budgetRange: string;
  createdAt: string;
}

export function AdminUsersClient() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      toast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const onboardingBadgeVariant = (state: string) => {
    if (state === "complete") return "success" as const;
    if (state === "signup") return "warning" as const;
    return "default" as const;
  };

  return (
    <div>
      <div className="mb-10">
        <span className="label-text text-on-surface-variant tracking-widest mb-2 block">ADMINISTRATION</span>
        <h1 className="font-serif text-display-sm text-on-surface">User Management</h1>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1">
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button variant="secondary" onClick={handleSearch}>Search</Button>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-container-low animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="text-left py-3 label-text text-on-surface-variant text-label-md tracking-widest">NAME</th>
                <th className="text-left py-3 label-text text-on-surface-variant text-label-md tracking-widest">EMAIL</th>
                <th className="text-left py-3 label-text text-on-surface-variant text-label-md tracking-widest">ONBOARDING</th>
                <th className="text-left py-3 label-text text-on-surface-variant text-label-md tracking-widest">JOINED</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                  <td className="py-4 text-body-md text-on-surface font-sans">{user.displayName || "—"}</td>
                  <td className="py-4 text-body-md text-on-surface-variant font-sans">{user.email}</td>
                  <td className="py-4">
                    <Badge variant={onboardingBadgeVariant(user.onboardingState)}>
                      {user.onboardingState}
                    </Badge>
                  </td>
                  <td className="py-4 text-body-md text-on-surface-variant font-sans">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-8">
        <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </Button>
        <span className="text-body-md text-on-surface-variant font-sans">Page {page}</span>
        <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={users.length < 20}>
          Next
        </Button>
      </div>
    </div>
  );
}
