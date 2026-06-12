
"use client";

import { useEffect, useState } from "react";
import { LogIn, Activity, AlertCircle, Calendar, User, Clock, ChevronDown, Loader, Search, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const styles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

export default function ChangeLogs() {
  const [activeTab, setActiveTab] = useState("all"); // all, login, activity, issue
  const [logs, setLogs] = useState({
    loginLogs: [],
    activityLogs: [],
    issueLogs: [],
  });
  const [loading, setLoading] = useState(false);
  const [schoolId, setSchoolId] = useState("");
  const [days, setDays] = useState(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLog, setExpandedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLogs = async (filterDays = days) => {
    try {
      setLoading(true);
      const schoolIdParam = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        toast.error("User not authenticated");
        return;
      }

      setSchoolId(schoolIdParam);

      const res = await fetch(
        `/api/logs?schoolId=${schoolIdParam}&type=all&limit=100&days=${filterDays}`,
        {
          headers: { "x-user-id": userId },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch logs");
      }

      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filterLogs = (logsArray, query) => {
    if (!query.trim()) return logsArray;
    
    return logsArray.filter((log) => {
      const searchStr = query.toLowerCase();
      return (
        log.email?.toLowerCase().includes(searchStr) ||
        log.firstName?.toLowerCase().includes(searchStr) ||
        log.lastName?.toLowerCase().includes(searchStr) ||
        log.description?.toLowerCase().includes(searchStr) ||
        log.title?.toLowerCase().includes(searchStr) ||
        log.entityName?.toLowerCase().includes(searchStr)
      );
    });
  };

  const paginateArray = (array, page, itemsPerPageCount) => {
    const startIndex = (page - 1) * itemsPerPageCount;
    const endIndex = startIndex + itemsPerPageCount;
    return {
      items: array.slice(startIndex, endIndex),
      totalPages: Math.ceil(array.length / itemsPerPageCount),
      totalItems: array.length,
    };
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "open":
        return "bg-red-100 text-red-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-l-4 border-red-500";
      case "high":
        return "bg-orange-100 text-orange-800 border-l-4 border-orange-500";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500";
      case "low":
        return "bg-blue-100 text-blue-800 border-l-4 border-blue-500";
      default:
        return "bg-gray-100 text-gray-800 border-l-4 border-gray-500";
    }
  };

  const renderLoginLogs = () => {
    const filtered = filterLogs(logs.loginLogs, searchQuery);
    const paginated = paginateArray(filtered, currentPage, itemsPerPage);
    
    if (filtered.length === 0) {
      return { items: [], totalPages: 0, totalItems: 0 };
    }

    return {
      items: paginated.items.map((log) => (
        <div
          key={log._id}
          className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition"
        >
          <div className="flex flex-col-reverse md:flex-row items-start justify-between gap-3">
            <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="mt-0.5 sm:mt-1 p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  {log.firstName} {log.lastName}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 truncate">{log.email}</div>
                <div className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                  Role: <span className="font-medium">{log.userRole}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 sm:mt-2 flex-wrap">
                  <span className={`text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium ${getStatusColor(log.status)}`}>
                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                  </span>
                  {log.failureReason && (
                    <span className="text-xs text-red-600 line-clamp-1">{log.failureReason}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="truncate">{formatTime(log.loginTime).split(',').pop()}</span>
              </div>
            </div>
          </div>
        </div>
      )),
      totalPages: paginated.totalPages,
      totalItems: paginated.totalItems,
    };
  };

  const renderActivityLogs = () => {
    const filtered = filterLogs(logs.activityLogs, searchQuery);
    const paginated = paginateArray(filtered, currentPage, itemsPerPage);
    
    if (filtered.length === 0) {
      return { items: [], totalPages: 0, totalItems: 0 };
    }

    return {
      items: paginated.items.map((log) => (
        <div
          key={log._id}
          className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition cursor-pointer"
          onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="mt-0.5 sm:mt-1 p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">{log.description}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-0.5 line-clamp-1">
                  {log.firstName} {log.lastName} • {log.entityType}
                </div>
                <div className="flex items-center gap-2 mt-1.5 sm:mt-2 flex-wrap">
                  <span className={`text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium ${getStatusColor(log.status)}`}>
                    {log.action.replace("-", " ").toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(log.timestamp).split(',').pop()}
                  </span>
                </div>

                {expandedLog === log._id && log.changes && (
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                    <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Changes:</div>
                    <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 max-h-40 overflow-y-auto font-mono break-words">
                      <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(log.changes, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition flex-shrink-0 mt-0.5 ${
                expandedLog === log._id ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      )),
      totalPages: paginated.totalPages,
      totalItems: paginated.totalItems,
    };
  };

  const renderIssueLogs = () => {
    const filtered = filterLogs(logs.issueLogs, searchQuery);
    const paginated = paginateArray(filtered, currentPage, itemsPerPage);
    
    if (filtered.length === 0) {
      return { items: [], totalPages: 0, totalItems: 0 };
    }

    return {
      items: paginated.items.map((issue) => (
        <div
          key={issue._id}
          className={`rounded-lg p-3 sm:p-4 hover:shadow-md transition cursor-pointer ${getSeverityColor(issue.severity)}`}
          onClick={() => setExpandedLog(expandedLog === issue._id ? null : issue._id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="mt-0.5 sm:mt-1 flex-shrink-0">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm sm:text-base line-clamp-2">{issue.title}</div>
                <div className="text-xs sm:text-sm opacity-90 mb-1 sm:mb-2 line-clamp-2">{issue.description}</div>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="truncate">
                    By: <span className="font-medium">{issue.firstName} {issue.lastName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded whitespace-nowrap ${getStatusColor(issue.status)}`}>
                    {issue.status.replace("-", " ").toUpperCase()}
                  </span>
                  <span className="truncate">
                    Cat: <span className="font-medium">{issue.category}</span>
                  </span>
                </div>

                {expandedLog === issue._id && (
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-current border-opacity-20">
                    <div className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Details:</div>
                    <div className="text-xs opacity-90 space-y-1">
                      <p><strong>Priority:</strong> {issue.priority}</p>
                      <p><strong>Reported:</strong> {formatTime(issue.reportedAt).split(',').pop()}</p>
                      {issue.resolvedAt && (
                        <p><strong>Resolved:</strong> {formatTime(issue.resolvedAt).split(',').pop()}</p>
                      )}
                      {issue.resolutionNotes && (
                        <p className="mt-1"><strong>Notes:</strong> <span className="break-words">{issue.resolutionNotes}</span></p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 sm:w-5 sm:h-5 opacity-50 transition flex-shrink-0 mt-0.5 ${
                expandedLog === issue._id ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      )),
      totalPages: paginated.totalPages,
      totalItems: paginated.totalItems,
    };
  };

  const tabs = [
    { id: "all", label: "All Logs", icon: Activity },
    { id: "login", label: "Login History", icon: LogIn },
    { id: "activity", label: "Activities", icon: Activity },
    { id: "issue", label: "Issues", icon: AlertCircle },
  ];

  const PaginationControls = ({ totalPages, totalItems, currentPageNum }) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
        <p className="text-xs sm:text-sm text-gray-600">
          Showing <span className="font-semibold">{(currentPageNum - 1) * itemsPerPage + 1}</span> to <span className="font-semibold">{Math.min(currentPageNum * itemsPerPage, totalItems)}</span> of <span className="font-semibold">{totalItems}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPageNum - 1))}
            disabled={currentPageNum === 1}
            className="p-1.5 sm:p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg font-medium transition ${
                  currentPageNum === page
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPageNum + 1))}
            disabled={currentPageNum === totalPages}
            className="p-1.5 sm:p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>
      <div className="space-y-4 px-2 sm:px-0">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">System Logs</h2>
        
        {/* Controls */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 sm:top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <select
              value={days}
              onChange={(e) => {
                setDays(parseInt(e.target.value));
                fetchLogs(parseInt(e.target.value));
              }}
              className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm whitespace-nowrap transition flex-shrink-0 ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8 sm:py-12">
              <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === "all" && (
                <div className="space-y-6">
                  {logs.loginLogs.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 flex items-center gap-2">
                        <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="truncate">Recent Logins ({logs.loginLogs.length})</span>
                      </h3>
                      <div className="space-y-2">{renderLoginLogs().items.slice(0, 5)}</div>
                    </div>
                  )}
                  {logs.activityLogs.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="truncate">Recent Activities ({logs.activityLogs.length})</span>
                      </h3>
                      <div className="space-y-2">{renderActivityLogs().items.slice(0, 5)}</div>
                    </div>
                  )}
                  {logs.issueLogs.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="truncate">Recent Issues ({logs.issueLogs.length})</span>
                      </h3>
                      <div className="space-y-2">{renderIssueLogs().items.slice(0, 5)}</div>
                    </div>
                  )}
                  {logs.loginLogs.length === 0 &&
                    logs.activityLogs.length === 0 &&
                    logs.issueLogs.length === 0 && (
                      <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">
                        No logs found for the selected period
                      </div>
                    )}
                </div>
              )}

              {activeTab === "login" && (
                <div>
                  <div className="space-y-2">
                    {renderLoginLogs().items.length > 0 ? (
                      renderLoginLogs().items
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                        No login logs found
                      </div>
                    )}
                  </div>
                  <PaginationControls 
                    totalPages={renderLoginLogs().totalPages} 
                    totalItems={renderLoginLogs().totalItems}
                    currentPageNum={currentPage}
                  />
                </div>
              )}
              {activeTab === "activity" && (
                <div>
                  <div className="space-y-2">
                    {renderActivityLogs().items.length > 0 ? (
                      renderActivityLogs().items
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                        No activity logs found
                      </div>
                    )}
                  </div>
                  <PaginationControls 
                    totalPages={renderActivityLogs().totalPages} 
                    totalItems={renderActivityLogs().totalItems}
                    currentPageNum={currentPage}
                  />
                </div>
              )}
              {activeTab === "issue" && (
                <div>
                  <div className="space-y-2">
                    {renderIssueLogs().items.length > 0 ? (
                      renderIssueLogs().items
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                        No issue reports found
                      </div>
                    )}
                  </div>
                  <PaginationControls 
                    totalPages={renderIssueLogs().totalPages} 
                    totalItems={renderIssueLogs().totalItems}
                    currentPageNum={currentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600">Total Logins</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
            {logs.loginLogs.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600">Total Activities</div>
          <div className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">
            {logs.activityLogs.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600">Open Issues</div>
          <div className="text-xl sm:text-2xl font-bold text-red-600 mt-1">
            {logs.issueLogs.filter((i) => i.status === "open").length}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
