import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { getUserAccounts, createAccount } from '../../api/accountService';
import { deposit, withdraw, transfer, getTransactionHistory } from '../../api/transactionService';
import { 
  Landmark, ArrowUpRight, ArrowDownRight, RefreshCw, Plus, 
  ChevronLeft, ChevronRight, PieChart, Wallet, CreditCard, ArrowLeftRight 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  // Pagination and selection state
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(5);

  // Modal states
  const [activeModal, setActiveModal] = useState<'create' | 'deposit' | 'withdraw' | 'transfer' | null>(null);

  // Form states
  const [newAccType, setNewAccType] = useState('SAVINGS');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // 1. Fetch Accounts
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: () => (user ? getUserAccounts(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
  });

  const selectedAccount = accounts[selectedAccountIdx] || null;

  // 2. Fetch Selected Account Transaction History
  const { data: historyData, isLoading: isLoadingTx } = useQuery({
    queryKey: ['history', selectedAccount?.id, currentPage, pageSize],
    queryFn: () => 
      selectedAccount 
        ? getTransactionHistory(selectedAccount.id, { page: currentPage, size: pageSize })
        : Promise.resolve({ success: false, message: '', data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 5 } }),
    enabled: !!selectedAccount?.id,
  });

  const transactions = historyData?.data?.content || [];
  const totalPages = historyData?.data?.totalPages || 0;

  // 3. Mutation handlers
  const createAccountMutation = useMutation({
    mutationFn: (type: string) => (user ? createAccount(user.id, type) : Promise.reject('No User')),
    onSuccess: (res) => {
      if (res.success) {
        addToast('Account created successfully!', 'success');
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        setActiveModal(null);
      } else {
        addToast(res.message, 'error');
      }
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to create account.', 'error');
    }
  });

  const depositMutation = useMutation({
    mutationFn: ({ acc, amount }: { acc: string; amount: number }) => deposit(acc, amount),
    onSuccess: (res) => {
      if (res.success) {
        addToast(`Deposited $${depositAmount} successfully!`, 'success');
        setDepositAmount('');
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        queryClient.invalidateQueries({ queryKey: ['history', selectedAccount?.id] });
        setActiveModal(null);
      } else {
        addToast(res.message, 'error');
      }
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Deposit failed.', 'error');
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ acc, amount }: { acc: string; amount: number }) => withdraw(acc, amount),
    onSuccess: (res) => {
      if (res.success) {
        addToast(`Withdrew $${withdrawAmount} successfully!`, 'success');
        setWithdrawAmount('');
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        queryClient.invalidateQueries({ queryKey: ['history', selectedAccount?.id] });
        setActiveModal(null);
      } else {
        addToast(res.message, 'error');
      }
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Withdrawal failed.', 'error');
    }
  });

  const transferMutation = useMutation({
    mutationFn: ({ from, to, amount }: { from: string; to: string; amount: number }) => transfer(from, to, amount),
    onSuccess: (res) => {
      if (res.success) {
        addToast(`Transferred $${transferAmount} to ${transferTarget} successfully!`, 'success');
        setTransferAmount('');
        setTransferTarget('');
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        queryClient.invalidateQueries({ queryKey: ['history', selectedAccount?.id] });
        setActiveModal(null);
      } else {
        addToast(res.message, 'error');
      }
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Transfer failed.', 'error');
    }
  });

  // Calculate overall metrics
  const overallBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Generate chart data based on recent transactions list
  const chartData = transactions
    .slice()
    .reverse()
    .map((t) => ({
      name: new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      amount: t.amount,
      type: t.transactionType,
      value: t.transactionType === 'DEPOSIT' || t.transactionType === 'TRANSFER_IN' ? t.amount : -t.amount,
    }));

  return (
    <div className="p-4 md:p-0 space-y-6">
      {/* Welcome Message */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Welcome, {user?.fullName}!</h1>
          <p className="text-sm text-slate-400 mt-1">Here is your financial status overview</p>
        </div>
        <button
          onClick={() => setActiveModal('create')}
          className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Account</span>
        </button>
      </div>

      {isLoadingAccounts ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-32 bg-slate-900/40 border border-slate-800 rounded-2xl" />
          <div className="h-32 bg-slate-900/40 border border-slate-800 rounded-2xl" />
          <div className="h-32 bg-slate-900/40 border border-slate-800 rounded-2xl" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/20 backdrop-blur-sm">
          <Landmark className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white">No active bank accounts</h3>
          <p className="text-sm text-slate-400 mt-1.5 max-w-sm mb-6">
            Get started by creating your first savings or checking account with us to deposit funds.
          </p>
          <button
            onClick={() => setActiveModal('create')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-2.5 px-5 rounded-xl cursor-pointer"
          >
            Create First Account
          </button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Balance Card */}
            <div className="backdrop-blur-md bg-slate-900/30 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Portfolio Balance</span>
                <Wallet className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-4">
                ${overallBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Selected Account Balance */}
            {selectedAccount && (
              <div className="backdrop-blur-md bg-slate-900/30 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {selectedAccount.accountType} ({selectedAccount.accountNumber})
                  </span>
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-4">
                  ${selectedAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            )}

            {/* Total Assets / Quick Status */}
            <div className="backdrop-blur-md bg-slate-900/30 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Accounts</span>
                <Landmark className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-4">{accounts.length} Accounts</div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveModal('deposit')}
              className="flex items-center justify-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 text-slate-200 hover:text-white font-medium text-sm transition-colors duration-150 cursor-pointer"
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              <span>Deposit</span>
            </button>
            <button
              onClick={() => setActiveModal('withdraw')}
              className="flex items-center justify-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 text-slate-200 hover:text-white font-medium text-sm transition-colors duration-150 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              <span>Withdraw</span>
            </button>
            <button
              onClick={() => setActiveModal('transfer')}
              className="flex items-center justify-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 text-slate-200 hover:text-white font-medium text-sm transition-colors duration-150 cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
              <span>Transfer</span>
            </button>
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['accounts'] });
                queryClient.invalidateQueries({ queryKey: ['history'] });
                addToast('Data refreshed successfully', 'info');
              }}
              className="flex items-center justify-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 text-slate-200 hover:text-white font-medium text-sm transition-colors duration-150 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Account Selector Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Bank Account</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {accounts.map((acc, idx) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountIdx(idx);
                    setCurrentPage(0);
                  }}
                  className={`flex-shrink-0 w-60 p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    selectedAccountIdx === idx
                      ? 'border-indigo-500 bg-indigo-950/20'
                      : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase">{acc.accountType}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      acc.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {acc.status}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-3 font-mono">{acc.accountNumber}</div>
                  <div className="text-lg font-bold text-white mt-1">${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* History Table */}
            <div className="lg:col-span-2 backdrop-blur-md bg-slate-900/20 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
                  <span className="text-xs font-semibold text-indigo-400">Selected Account Ledger</span>
                </div>

                {isLoadingTx ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-10 bg-slate-900/60 rounded-xl" />
                    <div className="h-10 bg-slate-900/60 rounded-xl" />
                    <div className="h-10 bg-slate-900/60 rounded-xl" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    No transactions found for this account.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Description</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                        {transactions.map((tx) => {
                          const isInflow = tx.transactionType === 'DEPOSIT' || tx.transactionType === 'TRANSFER_IN';
                          return (
                            <tr key={tx.id} className="hover:bg-slate-900/10">
                              <td className="py-3.5">
                                <span className={`inline-flex items-center gap-1 text-xs uppercase font-bold px-2 py-0.5 rounded-full ${
                                  isInflow ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
                                }`}>
                                  {tx.transactionType.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3.5 truncate max-w-xs">{tx.description}</td>
                              <td className="py-3.5 text-xs text-slate-400">
                                {new Date(tx.timestamp).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className={`py-3.5 text-right font-semibold font-mono ${
                                isInflow ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {isInflow ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-4">
                  <span className="text-xs text-slate-400">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 0 || isLoadingTx}
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={currentPage >= totalPages - 1 || isLoadingTx}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recharts Analytics Panel */}
            <div className="backdrop-blur-md bg-slate-900/20 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Cash Flow Analytics</h2>
                  <PieChart className="w-4 h-4 text-indigo-400" />
                </div>

                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-500 text-sm border border-dashed border-slate-850 rounded-xl">
                    No chart data available. Make a deposit.
                  </div>
                ) : (
                  <div className="h-56 w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 text-center mt-4">
                Real-time transaction cash flow dynamics mapping deposits vs withdrawals.
              </p>
            </div>
          </div>
        </>
      )}

      {/* MODALS PANEL */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-white"
            >
              {/* 1. Create Account Modal */}
              {activeModal === 'create' && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Create Bank Account</h3>
                  <p className="text-xs text-slate-400 mb-6">Select an account type to initialize.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Account Type</label>
                      <select
                        value={newAccType}
                        onChange={(e) => setNewAccType(e.target.value)}
                        className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm"
                      >
                        <option value="SAVINGS">Savings Account</option>
                        <option value="CURRENT">Current Account</option>
                      </select>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        onClick={() => setActiveModal(null)}
                        className="py-2 px-4 rounded-xl border border-slate-850 bg-transparent text-sm hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => createAccountMutation.mutate(newAccType)}
                        disabled={createAccountMutation.isPending}
                        className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-sm flex items-center justify-center cursor-pointer"
                      >
                        {createAccountMutation.isPending ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Deposit Modal */}
              {activeModal === 'deposit' && selectedAccount && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Deposit Funds</h3>
                  <p className="text-xs text-slate-400 mb-6">To Account: {selectedAccount.accountNumber}</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Amount ($)</label>
                      <input
                        type="number"
                        placeholder="Min 1.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm font-semibold font-mono"
                      />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        onClick={() => setActiveModal(null)}
                        className="py-2 px-4 rounded-xl border border-slate-850 bg-transparent text-sm hover:bg-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => depositMutation.mutate({ acc: selectedAccount.accountNumber, amount: parseFloat(depositAmount) })}
                        disabled={depositMutation.isPending || !depositAmount || parseFloat(depositAmount) <= 0}
                        className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-medium text-sm flex items-center justify-center cursor-pointer"
                      >
                        {depositMutation.isPending ? 'Processing...' : 'Deposit'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Withdraw Modal */}
              {activeModal === 'withdraw' && selectedAccount && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Withdraw Funds</h3>
                  <p className="text-xs text-slate-400 mb-6">From Account: {selectedAccount.accountNumber}</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Amount ($)</label>
                      <input
                        type="number"
                        placeholder="Max available balance"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm font-semibold font-mono"
                      />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        onClick={() => setActiveModal(null)}
                        className="py-2 px-4 rounded-xl border border-slate-850 bg-transparent text-sm hover:bg-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => withdrawMutation.mutate({ acc: selectedAccount.accountNumber, amount: parseFloat(withdrawAmount) })}
                        disabled={withdrawMutation.isPending || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > selectedAccount.balance}
                        className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 font-medium text-sm flex items-center justify-center cursor-pointer"
                      >
                        {withdrawMutation.isPending ? 'Processing...' : 'Withdraw'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Transfer Modal */}
              {activeModal === 'transfer' && selectedAccount && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Transfer Money</h3>
                  <p className="text-xs text-slate-400 mb-6">From Account: {selectedAccount.accountNumber}</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Recipient Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. BA0000000000"
                        value={transferTarget}
                        onChange={(e) => setTransferTarget(e.target.value)}
                        className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm font-semibold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Amount ($)</label>
                      <input
                        type="number"
                        placeholder="Transfer Amount"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm font-semibold font-mono"
                      />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        onClick={() => setActiveModal(null)}
                        className="py-2 px-4 rounded-xl border border-slate-850 bg-transparent text-sm hover:bg-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => transferMutation.mutate({ from: selectedAccount.accountNumber, to: transferTarget, amount: parseFloat(transferAmount) })}
                        disabled={transferMutation.isPending || !transferAmount || parseFloat(transferAmount) <= 0 || !transferTarget}
                        className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-sm flex items-center justify-center cursor-pointer"
                      >
                        {transferMutation.isPending ? 'Processing...' : 'Transfer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Dashboard;
