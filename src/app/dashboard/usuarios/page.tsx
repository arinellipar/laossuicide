"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Calendar,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN" | "STAFF";
  createdAt: string;
  _count?: {
    sessions: number;
  };
}

interface CurrentUser {
  id: string;
  role: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      setCurrentUser(data);
    } catch (error) {
      console.error("Erro ao buscar usuário atual:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const canEditUser = (targetUser: User): boolean => {
    if (!currentUser) return false;

    // Não pode editar a si mesmo
    if (currentUser.id === targetUser.id) return false;

    // SUPER_ADMIN pode editar qualquer um
    if (currentUser.role === "SUPER_ADMIN") return true;

    // ADMIN pode editar USER e STAFF, mas não outros ADMIN ou SUPER_ADMIN
    if (currentUser.role === "ADMIN") {
      return targetUser.role === "USER" || targetUser.role === "STAFF";
    }

    // STAFF não pode editar ninguém
    return false;
  };

  const getAvailableRoles = (targetUser: User): string[] => {
    if (!currentUser) return [];

    // SUPER_ADMIN pode atribuir qualquer role
    if (currentUser.role === "SUPER_ADMIN") {
      // Não permite rebaixar um SUPER_ADMIN para um role inferior
      if (targetUser.role === "SUPER_ADMIN") {
        return ["SUPER_ADMIN"];
      }
      return ["USER", "STAFF", "ADMIN", "SUPER_ADMIN"];
    }

    // ADMIN pode atribuir USER ou STAFF
    if (currentUser.role === "ADMIN") {
      return ["USER", "STAFF"];
    }

    return [];
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        // Atualizar a lista de usuários
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao atualizar role");
      }
    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      alert("Erro ao atualizar role");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao deletar usuário");
      }
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      alert("Erro ao deletar usuário");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <ShieldCheck className="w-5 h-5 text-red-400" />;
      case "ADMIN":
        return <Shield className="w-5 h-5 text-purple-400" />;
      case "STAFF":
        return <UserIcon className="w-5 h-5 text-blue-400" />;
      default:
        return <UserIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      SUPER_ADMIN: {
        label: "Super Admin",
        color: "bg-red-500/20 text-red-400 border-red-500/30",
      },
      ADMIN: {
        label: "Admin",
        color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      },
      STAFF: {
        label: "Staff",
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      },
      USER: {
        label: "Usuário",
        color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      },
    };

    const config = roleConfig[role as keyof typeof roleConfig];
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold border ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen px-4 md:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-black mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
            GERENCIAR USUÁRIOS
          </span>
        </h1>
        <p className="text-xl text-gray-400">
          Controle permissões e gerencie os fãs do LAOS
        </p>
      </motion.div>

      {/* Permission Notice */}
      {currentUser && currentUser.role !== "SUPER_ADMIN" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-semibold">
              Permissões Limitadas
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Como {currentUser.role === "ADMIN" ? "administrador" : "staff"},
              você pode
              {currentUser.role === "ADMIN"
                ? " alterar roles de usuários comuns para USER ou STAFF"
                : " apenas visualizar usuários"}
              .
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          {
            label: "Total de Usuários",
            value: users.length,
            icon: Users,
            gradient: "from-pink-500 to-rose-500",
          },
          {
            label: "Administradores",
            value: users.filter(
              (u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN"
            ).length,
            icon: Shield,
            gradient: "from-purple-500 to-indigo-500",
          },
          {
            label: "Staff",
            value: users.filter((u) => u.role === "STAFF").length,
            icon: UserIcon,
            gradient: "from-blue-500 to-cyan-500",
          },
          {
            label: "Usuários Comuns",
            value: users.filter((u) => u.role === "USER").length,
            icon: UserIcon,
            gradient: "from-gray-500 to-gray-600",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
              <div
                className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} inline-flex mb-4`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>

              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black/50 backdrop-blur-xl rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        {/* Role Filter */}
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-6 py-3 bg-black/50 backdrop-blur-xl rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none appearance-none cursor-pointer"
        >
          <option value="all">Todos os Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
          <option value="USER">Usuário</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full border-4 border-purple-500/30 border-t-pink-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-purple-500/30">
                <tr>
                  <th className="text-left p-4 text-gray-400">Usuário</th>
                  <th className="text-left p-4 text-gray-400">Email</th>
                  <th className="text-left p-4 text-gray-400">Role</th>
                  <th className="text-left p-4 text-gray-400">Cadastro</th>
                  <th className="text-center p-4 text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-purple-500/10 hover:bg-purple-500/5"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(user.role)}
                        <div>
                          <span className="font-semibold">
                            {user.name || "Sem nome"}
                          </span>
                          {currentUser && user.id === currentUser.id && (
                            <span className="ml-2 text-xs text-pink-400">
                              (Você)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{user.email}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(user.role)}
                        {canEditUser(user) && (
                          <select
                            value={user.role}
                            onChange={(e) =>
                              updateUserRole(user.id, e.target.value)
                            }
                            className="ml-2 px-3 py-1 bg-black/50 rounded-lg border border-purple-500/30 text-sm cursor-pointer hover:border-pink-500/50 transition-colors"
                          >
                            {getAvailableRoles(user).map((role) => (
                              <option key={role} value={role}>
                                {role === "USER" ? "Usuário" : role}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {canEditUser(user) ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 rounded-lg bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/50 transition-colors"
                            >
                              <Edit className="w-4 h-4 text-purple-400" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteUser(user.id)}
                              className="p-2 rounded-lg bg-red-500/20 backdrop-blur-xl border border-red-500/30 hover:border-red-400/50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </motion.button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
