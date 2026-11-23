import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  UserPlus,
  Trash2,
  Download,
  Shield,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { toast } from "react-toastify";
import { publicRequest } from "../requestMethods";
import { downloadCsv } from "../utils/helpers";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await publicRequest.get("/users");
      setUsers(res.data || []);
    } catch {
      toast.error("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && (u.role || "user") !== roleFilter)
        return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [u.fullname, u.email, u.country, u.phone, u.role]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = async (id, nextRole) => {
    try {
      const res = await publicRequest.put(`/users/${id}`, { role: nextRole });
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data : u)));
      toast.success(`Role updated to ${nextRole}.`);
    } catch {
      toast.error("Failed to update role.");
    }
  };

  const handleToggleActive = async (user) => {
    const nextActive = user.isActive === false ? true : false;
    try {
      const res = await publicRequest.put(`/users/${user._id}`, {
        isActive: nextActive,
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? res.data : u))
      );
      toast.info(
        nextActive
          ? `${user.fullname} reactivated.`
          : `${user.fullname} suspended.`
      );
    } catch {
      toast.error("Failed to update account status.");
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user ${user.fullname} (${user.email})?`))
      return;
    try {
      await publicRequest.delete(`/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success("User deleted.");
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const handleExport = () => {
    if (!filtered.length) return toast.info("No users to export.");
    downloadCsv(
      `sendit-users-${new Date().toISOString().split("T")[0]}.csv`,
      filtered.map((u) => ({
        Name: u.fullname,
        Email: u.email,
        Phone: u.phone || "",
        Country: u.country || "",
        Address: u.address || "",
        Role: u.role || "user",
        Status: u.isActive === false ? "Suspended" : "Active",
      }))
    );
    toast.success("Users exported to CSV!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Directory & Fleet
          </span>
          <h1 className="font-display text-3xl font-extrabold mt-0.5">
            Users & Drivers ({filtered.length})
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link to="/newuser" className="btn-primary">
            <UserPlus className="w-4 h-4" /> New User
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, country..."
            className="admin-input pl-10"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "user", "driver", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                roleFilter === r
                  ? "bg-amber-400 text-slate-950"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Location & Phone</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const active = u.isActive !== false;
                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-500 font-bold text-xs flex items-center justify-center uppercase">
                            {(u.fullname || "U").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold">{u.fullname}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <p>{u.country || "—"}</p>
                        <p className="text-slate-500">{u.phone || u.address || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-amber-500" />
                          <select
                            value={u.role || "user"}
                            onChange={(e) =>
                              handleRoleChange(u._id, e.target.value)
                            }
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1 text-xs font-semibold capitalize"
                          >
                            <option value="user" className="bg-slate-900">
                              User
                            </option>
                            <option value="driver" className="bg-slate-900">
                              Driver
                            </option>
                            <option value="admin" className="bg-slate-900">
                              Admin
                            </option>
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            active
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-rose-500/15 text-rose-500"
                          }`}
                        >
                          {active ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Ban className="w-3 h-3" />
                          )}
                          {active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(u)}
                            className="btn-secondary py-1 px-2.5 text-xs"
                          >
                            {active ? "Suspend" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
