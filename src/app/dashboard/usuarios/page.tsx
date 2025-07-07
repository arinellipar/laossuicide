"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Filter,
  Loader2,
  ChevronDown,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Activity,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import React from "react";

// ============= INTERFACES E TIPOS =============
interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  createdAt: string;
  address?: string | null;
  phone?: string | null;
  zipCode?: string | null;
  _count?: {
    sessions: number;
  };
}

interface CurrentUser {
  id: string;
  role: UserRole;
  name: string | null;
  email: string | null;
}

interface Stats {
  totalUsers: number;
  recentUsers: number;
  activeSessions: number;
  roleDistribution: Record<UserRole, number>;
}

// ============= CONSTANTES E CONFIGURAÇÕES =============
const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  STAFF: 2,
  USER: 1,
};

const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: ShieldCheck,
    description: "Acesso total ao sistema",
  },
  ADMIN: {
    label: "Admin",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Shield,
    description: "Gerencia usuários e conteúdo",
  },
  STAFF: {
    label: "Staff",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: UserIcon,
    description: "Acesso limitado ao conteúdo",
  },
  USER: {
    label: "Usuário",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    icon: UserIcon,
    description: "Fã do LAOS",
  },
};

// ============= COMPONENTE PRINCIPAL =============
export default function UsersManagementPage() {
  // Estados
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // ============= FUNÇÕES DE BUSCA DE DADOS =============
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) throw new Error("Erro ao buscar usuário atual");
      const data = await response.json();
      setCurrentUser(data);
    } catch (error) {
      console.error("Erro ao buscar usuário atual:", error);
      setError("Erro ao carregar informações do usuário");
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Erro ao buscar usuários");
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      setError("Erro ao carregar lista de usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Erro ao buscar estatísticas");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  }, []);

  // ============= VERIFICAÇÕES DE PERMISSÃO =============
  const canEditUser = useCallback(
    (targetUser: User): boolean => {
      if (!currentUser) return false;

      // Não pode editar a si mesmo
      if (currentUser.id === targetUser.id) return false;

      const currentUserHierarchy = ROLE_HIERARCHY[currentUser.role];
      const targetUserHierarchy = ROLE_HIERARCHY[targetUser.role];

      // Só pode editar usuários com hierarquia menor
      return currentUserHierarchy > targetUserHierarchy;
    },
    [currentUser]
  );

  const getAvailableRoles = useCallback((): UserRole[] => {
    if (!currentUser) return [];

    const currentUserHierarchy = ROLE_HIERARCHY[currentUser.role];

    // Retorna roles que o usuário atual pode atribuir
    return (Object.keys(ROLE_HIERARCHY) as UserRole[]).filter((role) => {
      const roleHierarchy = ROLE_HIERARCHY[role];
      return roleHierarchy < currentUserHierarchy;
    });
  }, [currentUser]);

  // ============= AÇÕES DE MUTAÇÃO =============
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUserId(userId);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar role");
      }

      // Atualizar lista local
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      // Atualizar estatísticas
      await fetchStats();
    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      setError(
        error instanceof Error ? error.message : "Erro ao atualizar role"
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (
      !confirm(
        "Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    try {
      setDeletingUserId(userId);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao deletar usuário");
      }

      // Remover da lista local
      setUsers((prev) => prev.filter((user) => user.id !== userId));

      // Atualizar estatísticas
      await fetchStats();
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      setError(
        error instanceof Error ? error.message : "Erro ao deletar usuário"
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  // ============= FILTROS COMPUTADOS =============
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm);

      const matchesRole = selectedRole === "all" || user.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  // ============= LIFECYCLE HOOKS =============
  useEffect(() => {
    Promise.all([fetchCurrentUser(), fetchUsers(), fetchStats()]);
  }, [fetchCurrentUser, fetchUsers, fetchStats]);

  // ============= COMPONENTES AUXILIARES =============
  const RoleBadge = ({ role }: { role: UserRole }) => {
    const config = ROLE_CONFIG[role];
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold border ${config.color}`}
        >
          {config.label}
        </span>
      </div>
    );
  };

  const UserDetailsModal = ({
    user,
    onClose,
  }: {
    user: User;
    onClose: () => void;
  }) => {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-black/90 backdrop-blur-2xl rounded-2xl p-8 max-w-md w-full border border-purple-500/30"
          >
            <h3 className="text-2xl font-bold mb-6">Detalhes do Usuário</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Nome</p>
                <p className="text-lg font-semibold">
                  {user.name || "Não informado"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Role</p>
                <div className="mt-1">
                  <RoleBadge role={user.role} />
                </div>
              </div>

              {user.phone && (
                <div>
                  <p className="text-sm text-gray-400">Telefone</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {user.phone}
                  </p>
                </div>
              )}

              {user.address && (
                <div>
                  <p className="text-sm text-gray-400">Endereço</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {user.address}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-400">Cadastro</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>

              {user._count && (
                <div>
                  <p className="text-sm text-gray-400">Sessões Ativas</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {user._count.sessions}
                  </p>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="mt-8 w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold"
            >
              Fechar
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ============= RENDERIZAÇÃO PRINCIPAL =============
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

      {/* Notificações */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
          >
            <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 font-semibold">Erro</p>
              <p className="text-sm text-gray-300 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Notice */}
      {currentUser && currentUser.role !== "SUPER_ADMIN" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-yellow-400 font-semibold">
              Permissões Limitadas
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Como {ROLE_CONFIG[currentUser.role].label.toLowerCase()}, você
              pode
              {currentUser.role === "ADMIN"
                ? " gerenciar usuários comuns e staff"
                : " apenas visualizar usuários"}
              .
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
              <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 inline-flex mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.totalUsers}</p>
              <p className="text-gray-400 text-sm">Total de Usuários</p>
            </div>
          </motion.div>

          {Object.entries(ROLE_CONFIG).map(([role, config], index) => {
            const count = stats.roleDistribution[role as UserRole] || 0;
            const Icon = config.icon;

            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 1) * 0.1 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
                  <div
                    className={`p-3 rounded-xl ${
                      config.color.split(" ")[0]
                    } inline-flex mb-4`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-3xl font-bold mb-1">{count}</p>
                  <p className="text-gray-400 text-sm">{config.label}s</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black/50 backdrop-blur-xl rounded-xl border border-purple-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
          />
        </div>

        {/* Role Filter */}
        <div className="relative">
          <button
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            className="px-6 py-3 bg-black/50 backdrop-blur-xl rounded-xl border border-purple-500/30 hover:border-pink-500/50 transition-all flex items-center gap-2 min-w-[200px]"
          >
            <Filter className="w-5 h-5" />
            <span>
              {selectedRole === "all"
                ? "Todos os Roles"
                : ROLE_CONFIG[selectedRole as UserRole]?.label || selectedRole}
            </span>
            <ChevronDown
              className={`w-4 h-4 ml-auto transition-transform ${
                filterMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {filterMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 right-0 w-full bg-black/90 backdrop-blur-xl rounded-xl border border-purple-500/30 overflow-hidden z-20"
              >
                <button
                  onClick={() => {
                    setSelectedRole("all");
                    setFilterMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-purple-500/10 transition-colors ${
                    selectedRole === "all" ? "bg-purple-500/20" : ""
                  }`}
                >
                  Todos os Roles
                </button>
                {(Object.keys(ROLE_CONFIG) as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setSelectedRole(role);
                      setFilterMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-purple-500/10 transition-colors flex items-center gap-2 ${
                      selectedRole === role ? "bg-purple-500/20" : ""
                    }`}
                  >
                    {React.createElement(ROLE_CONFIG[role].icon, {
                      className: "w-4 h-4",
                    })}
                    {ROLE_CONFIG[role].label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-400">Nenhum usuário encontrado</p>
          {searchTerm || selectedRole !== "all" ? (
            <p className="text-sm text-gray-500 mt-2">
              Tente ajustar os filtros de busca
            </p>
          ) : null}
        </div>
      ) : (
        <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-purple-500/30 bg-purple-500/5">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-semibold">
                    Usuário
                  </th>
                  <th className="text-left p-4 text-gray-400 font-semibold">
                    Email
                  </th>
                  <th className="text-left p-4 text-gray-400 font-semibold">
                    Role
                  </th>
                  <th className="text-left p-4 text-gray-400 font-semibold">
                    Cadastro
                  </th>
                  <th className="text-center p-4 text-gray-400 font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => {
                  const canEdit = canEditUser(user);
                  const availableRoles = getAvailableRoles();
                  const isUpdating = updatingUserId === user.id;
                  const isDeleting = deletingUserId === user.id;

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {React.createElement(ROLE_CONFIG[user.role].icon, {
                              className: `w-5 h-5 ${
                                ROLE_CONFIG[user.role].color.split(" ")[1]
                              }`,
                            })}
                          </div>
                          <div>
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="font-semibold hover:text-pink-400 transition-colors text-left"
                            >
                              {user.name || "Sem nome"}
                            </button>
                            {currentUser && user.id === currentUser.id && (
                              <span className="ml-2 text-xs text-pink-400">
                                (Você)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-gray-400">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <RoleBadge role={user.role} />

                          {canEdit && availableRoles.length > 0 && (
                            <select
                              value={user.role}
                              onChange={(e) =>
                                updateUserRole(
                                  user.id,
                                  e.target.value as UserRole
                                )
                              }
                              disabled={isUpdating}
                              className="ml-2 px-3 py-1 bg-black/50 rounded-lg border border-purple-500/30 text-sm cursor-pointer hover:border-pink-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value={user.role}>
                                {ROLE_CONFIG[user.role].label}
                              </option>
                              {availableRoles.map((role) => (
                                <option key={role} value={role}>
                                  Alterar para {ROLE_CONFIG[role].label}
                                </option>
                              ))}
                            </select>
                          )}

                          {isUpdating && (
                            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
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
                          {canEdit ? (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSelectedUser(user)}
                                className="p-2 rounded-lg bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/50 transition-colors"
                                title="Ver detalhes"
                              >
                                <Edit className="w-4 h-4 text-purple-400" />
                              </motion.button>

                              {currentUser?.role === "SUPER_ADMIN" && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => deleteUser(user.id)}
                                  disabled={isDeleting}
                                  className="p-2 rounded-lg bg-red-500/20 backdrop-blur-xl border border-red-500/30 hover:border-red-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Deletar usuário"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  )}
                                </motion.button>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 border-t border-purple-500/20 bg-purple-500/5">
            <p className="text-sm text-gray-400 text-center">
              Mostrando {filteredUsers.length} de {users.length} usuários
            </p>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
