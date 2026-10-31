export default function Filters({
  filterAppStatus,
  filterEmpStatus,
  setFilterAppStatus,
  setFilterEmpStatus,
}: any) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Application Filter:</span>
        <select
          className="border rounded p-2 text-sm"
          value={filterAppStatus}
          onChange={(e) => setFilterAppStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="talks">In Talks</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Employment Filter:</span>
        <select
          className="border rounded p-2 text-sm"
          value={filterEmpStatus}
          onChange={(e) => setFilterEmpStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
}
