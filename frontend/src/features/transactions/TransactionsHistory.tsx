import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { getUserAccounts } from '../../api/accountService';
import { getTransactionHistory } from '../../api/transactionService';
import type { Transaction } from '../../types';
import { 
  Search, Download, FileText, 
  ChevronLeft, ChevronRight, Filter, Calendar, Landmark
} from 'lucide-react';

export const TransactionsHistory: React.FC = () => {
  const { user } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  // Selector and pagination
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [txType, setTxType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Fetch Accounts
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: () => (user ? getUserAccounts(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
  });

  const selectedAccount = accounts[selectedAccountIdx] || null;

  // 2. Fetch Filtered Transactions
  const { data: historyData, isLoading: isLoadingTx } = useQuery({
    queryKey: [
      'history', 
      selectedAccount?.id, 
      currentPage, 
      pageSize, 
      txType, 
      startDate, 
      endDate, 
      searchTerm
    ],
    queryFn: () => 
      selectedAccount 
        ? getTransactionHistory(selectedAccount.id, { 
            page: currentPage, 
            size: pageSize,
            type: txType || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            search: searchTerm || undefined
          })
        : Promise.resolve({ success: false, message: '', data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 } }),
    enabled: !!selectedAccount?.id,
  });

  const transactions = historyData?.data?.content || [];
  const totalPages = historyData?.data?.totalPages || 0;
  const totalElements = historyData?.data?.totalElements || 0;

  // Export handlers
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      addToast('No transaction data to export.', 'warning');
      return;
    }

    const headers = ['ID', 'Type', 'Amount ($)', 'Description', 'Source Account', 'Destination Account', 'Date/Time'];
    const rows = transactions.map((t) => [
      t.id,
      t.transactionType,
      t.amount,
      `"${t.description.replace(/"/g, '""')}"`,
      t.sourceAccountNumber || '',
      t.destinationAccountNumber || '',
      new Date(t.timestamp).toLocaleString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `statement_${selectedAccount?.accountNumber}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV statement downloaded!', 'success');
  };

  const handleExportPDF = () => {
    if (!selectedAccount || transactions.length === 0) {
      addToast('No transaction data to export.', 'warning');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('Popup blocker prevented opening print window.', 'error');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Account Statement - ${selectedAccount.accountNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 22px; font-weight: 800; color: #4f46e5; }
            .title { font-size: 16px; font-weight: 600; text-transform: uppercase; color: #475569; letter-spacing: 1px; }
            .meta { margin-bottom: 30px; font-size: 13px; line-height: 1.6; color: #334155; }
            .meta strong { color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f8fafc; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; font-weight: 700; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155; }
            .inflow { color: #059669; font-weight: 700; }
            .outflow { color: #dc2626; font-weight: 700; }
            .footer { border-top: 1px solid #e2e8f0; margin-top: 40px; padding-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">BankEase Portal</div>
            <div class="title">Official Account Statement</div>
          </div>
          <div class="meta">
            <strong>Account Holder:</strong> ${user?.fullName}<br/>
            <strong>Account Number:</strong> ${selectedAccount.accountNumber}<br/>
            <strong>Account Type:</strong> ${selectedAccount.accountType}<br/>
            <strong>Date Generated:</strong> ${new Date().toLocaleString()}<br/>
            <strong>Total Transactions Listed:</strong> ${transactions.length}
          </div>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Date / Time</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((tx: Transaction) => {
                const isInflow = tx.transactionType === 'DEPOSIT' || tx.transactionType === 'TRANSFER_IN';
                return `
                  <tr>
                    <td><strong>${tx.transactionType.replace('_', ' ')}</strong></td>
                    <td>${tx.description}</td>
                    <td>${new Date(tx.timestamp).toLocaleString()}</td>
                    <td class="${isInflow ? 'inflow' : 'outflow'}">
                      ${isInflow ? '+' : '-'}$${tx.amount.toFixed(2)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="footer">
            BankEase Inc. | This is a computer generated document and does not require a physical signature.
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    addToast('PDF statement sent to print queue!', 'success');
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTxType('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(0);
    addToast('Filters reset.', 'info');
  };

  return (
    <div className="space-y-6 px-4 md:px-0 pb-12 select-none">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Transaction History</h1>
          <p className="text-sm text-slate-400 mt-1">Audit, filter, and export your account records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-semibold py-2 px-4 rounded-xl disabled:opacity-40 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={transactions.length === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-4 rounded-xl disabled:opacity-40 cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {isLoadingAccounts ? (
        <div className="h-20 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/20">
          <Landmark className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white">No active bank accounts</h3>
        </div>
      ) : (
        <>
          {/* Account selector banner */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {accounts.map((acc, idx) => (
              <button
                key={acc.id}
                onClick={() => {
                  setSelectedAccountIdx(idx);
                  setCurrentPage(0);
                }}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-150 cursor-pointer ${
                  selectedAccountIdx === idx
                    ? 'border-indigo-500 bg-indigo-950/20 text-indigo-400'
                    : 'border-slate-800 bg-slate-900/20 text-slate-400 hover:text-white'
                }`}
              >
                {acc.accountType} ({acc.accountNumber})
              </button>
            ))}
          </div>

          {/* Filtering Control Bar */}
          <div className="backdrop-blur-md bg-slate-900/20 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800/60 pb-3 mb-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Search & Filters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Keyword Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(0);
                  }}
                  placeholder="Search description..."
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500/60 outline-none transition-colors"
                />
              </div>

              {/* Type selector */}
              <div>
                <select
                  value={txType}
                  onChange={(e) => {
                    setTxType(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500/60 transition-colors"
                >
                  <option value="">All Transaction Types</option>
                  <option value="DEPOSIT">Deposits</option>
                  <option value="WITHDRAWAL">Withdrawals</option>
                  <option value="TRANSFER_OUT">Transfers Sent</option>
                  <option value="TRANSFER_IN">Transfers Received</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500/60 transition-colors"
                />
              </div>

              {/* End Date */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500/60 transition-colors"
                />
              </div>
            </div>

            {(searchTerm || txType || startDate || endDate) && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-slate-400 hover:text-white font-semibold underline cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Ledger Table */}
          <div className="backdrop-blur-md bg-slate-900/20 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            {isLoadingTx ? (
              <div className="space-y-4 animate-pulse py-6">
                <div className="h-10 bg-slate-900/40 rounded-xl" />
                <div className="h-10 bg-slate-900/40 rounded-xl" />
                <div className="h-10 bg-slate-900/40 rounded-xl" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                No matching transactions found with the active filters.
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-slate-400">
                    Showing {transactions.length} of {totalElements} transactions
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <th className="pb-3">Transaction ID</th>
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
                          <tr key={tx.id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="py-3.5 font-mono text-xs text-indigo-400">{tx.id}</td>
                            <td className="py-3.5">
                              <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                isInflow ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
                              }`}>
                                {tx.transactionType.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 max-w-xs truncate">{tx.description}</td>
                            <td className="py-3.5 text-xs text-slate-400">
                              {new Date(tx.timestamp).toLocaleString()}
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
              </div>
            )}

            {/* Pagination Panel */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
                <span className="text-xs text-slate-400 font-medium">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 0 || isLoadingTx}
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentPage >= totalPages - 1 || isLoadingTx}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default TransactionsHistory;
