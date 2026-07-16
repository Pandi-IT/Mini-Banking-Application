import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '../../store/toastStore';
import { 
  getAdminUsers, getAdminAccounts, getAdminTransactions, 
  toggleUserBlock, toggleAccountBlock, getAdminStatistics 
} from '../../api/adminService';
import { 
  Users, Landmark, DollarSign, 
  ChevronLeft, ChevronRight, Activity, Database
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  // Tabs: 'users' | 'accounts' | 'transactions'
  const [activeTab, setActiveTab] = useState<'users' | 'accounts' | 'transactions'>('users');

  // Pagination states
  const [usersPage, setUsersPage] = useState(0);
  const [accountsPage, setAccountsPage] = useState(0);
  const [txPage, setTxPage] = useState(0);
  const [pageSize] = useState(10);

  // 1. Fetch System Stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStatistics,
  });
  const stats = statsData?.data;

  // 2. Fetch Users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['adminUsers', usersPage, pageSize],
    queryFn: () => getAdminUsers(usersPage, pageSize),
    enabled: activeTab === 'users',
  });
  const users = usersData?.data?.content || [];
  const usersTotalPages = usersData?.data?.totalPages || 0;

  // 3. Fetch Accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['adminAccounts', accountsPage, pageSize],
    queryFn: () => getAdminAccounts(accountsPage, pageSize),
    enabled: activeTab === 'accounts',
  });
  const accounts = accountsData?.data?.content || [];
  const accountsTotalPages = accountsData?.data?.totalPages || 0;

  // 4. Fetch Global Transactions
  const { data: txData, isLoading: isLoadingTx } = useQuery({
    queryKey: ['adminTransactions', txPage, pageSize],
    queryFn: () => getAdminTransactions(txPage, pageSize),
    enabled: activeTab === 'transactions',
  });
  const transactions = txData?.data?.content || [];
  const txTotalPages = txData?.data?.totalPages || 0;

  // 5. Block / Unblock User Mutation
  const userBlockMutation = useMutation({
    mutationFn: ({ userId, enabled }: { userId: number; enabled: boolean }) => toggleUserBlock(userId, enabled),
    onSuccess: (res) => {
      if (res.success) {
        addToast(`User ${res.data?.fullName} status updated!`, 'success');
        queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      } else {
        addToast(res.message, 'error');
      }
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Action failed.', 'error');
    }
  });

  // 6. Block / Unblock Account Mutation
  const accountBlockMutation = useMutation({
    mutationFn: ({ accNum, status }: { accNum: string; status: string }) => toggleAccountBlock(accNum, status),
    onSuccess: (res) => {
      if (res.success) {
        addToast(`Account ${res.data?.accountNumber} status is now ${res.data?.status}!`, 'success');
        queryClient.invalidateQueries({ queryKey: ['adminAccounts'] });
        queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      } else {
        addToast(res.message, 'error');
      }
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Action failed.', 'error');
    }
  });

  return (
    <div className="space-y-6 px-4 md:px-0 pb-12 select-none">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">System Administration</h1>
        <p className="text-sm text-slate-400 mt-1">Monitor system metrics and manage user safety overrides</p>
      </div>

      {/* Admin Dashboard Stats Summary */}
      {isLoadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          <div className="h-28 bg-slate-900/40 border border-slate-800 rounded-2xl" />
          <div className="h-28 bg-slate-900/40 border border-slate-800 rounded-2xl" />
          <div className="h-28 bg-slate-900/40 border border-slate-800 rounded-2xl" />
          <div className="h-28 bg-slate-900/40 border border-slate-800 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Card 1: Users count */}
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-800 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl" />
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Total Customers</span>
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-3">{stats?.totalUsers || 0} Users</div>
          </div>

          {/* Card 2: Accounts count */}
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-800 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-xl" />
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Total Bank Accounts</span>
              <Landmark className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-3">
              {stats?.totalAccounts || 0} Accounts
            </div>
          </div>

          {/* Card 3: Total Assets sum */}
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-800 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl" />
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Overall Holdings Balance</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-3">
              ${(stats?.totalBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Card 4: Action / Operations */}
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-800 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl" />
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>System Operations</span>
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-sm font-semibold text-slate-200 mt-3 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Core Server Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs selectors */}
      <div className="flex border-b border-slate-850 gap-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === 'users' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Users Log
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === 'accounts' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Accounts Log
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === 'transactions' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Global Ledgers
        </button>
      </div>

      {/* Content grid */}
      <div className="backdrop-blur-md bg-slate-900/20 border border-slate-800 rounded-2xl p-6">
        
        {/* Tab 1: Users List */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Customer Database</span>
              </h3>
            </div>

            {isLoadingUsers ? (
              <div className="space-y-3 animate-pulse py-4">
                <div className="h-10 bg-slate-900/45 rounded-xl" />
                <div className="h-10 bg-slate-900/45 rounded-xl" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No customers registered.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3">User ID</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/10">
                        <td className="py-3.5 font-mono text-xs text-indigo-400">{u.id}</td>
                        <td className="py-3.5">{u.fullName}</td>
                        <td className="py-3.5 text-xs text-slate-400">{u.email}</td>
                        <td className="py-3.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.enabled ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
                          }`}>
                            {u.enabled ? 'Enabled' : 'Blocked'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {u.role !== 'ADMIN' && (
                            <button
                              disabled={userBlockMutation.isPending}
                              onClick={() => userBlockMutation.mutate({ userId: u.id, enabled: !u.enabled })}
                              className={`text-xs font-semibold py-1 px-3 rounded-lg border transition-all cursor-pointer ${
                                u.enabled 
                                  ? 'border-rose-900/30 hover:border-rose-800/50 bg-rose-950/10 text-rose-400' 
                                  : 'border-emerald-900/30 hover:border-emerald-800/50 bg-emerald-950/10 text-emerald-400'
                              }`}
                            >
                              {u.enabled ? 'Block User' : 'Unblock'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Users Pagination */}
            {usersTotalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
                <span className="text-xs text-slate-400">Page {usersPage + 1} of {usersTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={usersPage === 0}
                    onClick={() => setUsersPage((p) => Math.max(0, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={usersPage >= usersTotalPages - 1}
                    onClick={() => setUsersPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Accounts List */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-400" />
                <span>Account Ledger Directories</span>
              </h3>
            </div>

            {isLoadingAccounts ? (
              <div className="space-y-3 animate-pulse py-4">
                <div className="h-10 bg-slate-900/45 rounded-xl" />
                <div className="h-10 bg-slate-900/45 rounded-xl" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No accounts created in system.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider font-semibold">
                      <th className="pb-3">Account Number</th>
                      <th className="pb-3">Owner</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3 text-right">Balance</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                    {accounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-900/10">
                        <td className="py-3.5 font-mono text-xs text-blue-400 font-semibold text-white">{acc.accountNumber}</td>
                        <td className="py-3.5 text-xs text-slate-400">User ID: {acc.userId}</td>
                        <td className="py-3.5 text-xs">{acc.accountType}</td>
                        <td className="py-3.5 text-right font-mono font-bold text-slate-200">
                          ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            acc.status === 'ACTIVE' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
                          }`}>
                            {acc.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            disabled={accountBlockMutation.isPending}
                            onClick={() => 
                              accountBlockMutation.mutate({ 
                                accNum: acc.accountNumber, 
                                status: acc.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' 
                              })
                            }
                            className={`text-xs font-semibold py-1 px-3 rounded-lg border transition-all cursor-pointer ${
                              acc.status === 'ACTIVE' 
                                ? 'border-rose-900/30 hover:border-rose-800/50 bg-rose-950/10 text-rose-400' 
                                : 'border-emerald-900/30 hover:border-emerald-800/50 bg-emerald-950/10 text-emerald-400'
                            }`}
                          >
                            {acc.status === 'ACTIVE' ? 'Suspend Account' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Accounts Pagination */}
            {accountsTotalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
                <span className="text-xs text-slate-400">Page {accountsPage + 1} of {accountsTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={accountsPage === 0}
                    onClick={() => setAccountsPage((p) => Math.max(0, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={accountsPage >= accountsTotalPages - 1}
                    onClick={() => setAccountsPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Transactions List */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Global Audit Logs</span>
              </h3>
            </div>

            {isLoadingTx ? (
              <div className="space-y-3 animate-pulse py-4">
                <div className="h-10 bg-slate-900/45 rounded-xl" />
                <div className="h-10 bg-slate-900/45 rounded-xl" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No transaction records generated.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3">Transaction ID</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Source Acc</th>
                      <th className="pb-3">Dest Acc</th>
                      <th className="pb-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-900/10">
                        <td className="py-3.5 font-mono text-xs text-indigo-400">{tx.id}</td>
                        <td className="py-3.5">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-850 text-slate-300 uppercase">
                            {tx.transactionType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono font-bold text-white">${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3.5 truncate max-w-xs text-xs text-slate-400">{tx.description}</td>
                        <td className="py-3.5 font-mono text-xs text-slate-500">{tx.sourceAccountNumber || 'N/A'}</td>
                        <td className="py-3.5 font-mono text-xs text-slate-500">{tx.destinationAccountNumber || 'N/A'}</td>
                        <td className="py-3.5 text-xs text-slate-400">{new Date(tx.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Transactions Pagination */}
            {txTotalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
                <span className="text-xs text-slate-400">Page {txPage + 1} of {txTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={txPage === 0}
                    onClick={() => setTxPage((p) => Math.max(0, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={txPage >= txTotalPages - 1}
                    onClick={() => setTxPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
export default AdminPanel;
