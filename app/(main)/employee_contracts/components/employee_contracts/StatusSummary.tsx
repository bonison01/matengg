import { Counts } from "../../types";

export default function StatusSummary({ counts }: { counts: Counts }) {
  return (
    <>
      <h3 className="text-md font-semibold mb-2">Application Status</h3>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <SummaryBox label="Pending" count={counts.pending} color="bg-yellow-100" />
        <SummaryBox label="In Talks" count={counts.talks} color="bg-blue-100" />
        <SummaryBox label="Approved" count={counts.approved} color="bg-purple-100" />
        <SummaryBox label="Rejected" count={counts.rejected} color="bg-red-100" />
      </div>

      <h3 className="text-md font-semibold mb-2">Employment Status</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SummaryBox label="Active" count={counts.active} color="bg-green-100" />
        <SummaryBox label="Inactive" count={counts.inactive} color="bg-gray-200" />
      </div>
    </>
  );
}

function SummaryBox({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className={`${color} p-4 text-center rounded`}>
      <p className="text-xs">{label}</p>
      <p className="text-lg font-bold">{count}</p>
    </div>
  );
}
