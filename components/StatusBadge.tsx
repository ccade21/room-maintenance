import { MaintenanceStatus } from "@/lib/types";

type Props = {
  status: MaintenanceStatus;
};

export default function StatusBadge({ status }: Props) {
  const className =
    status === "접수"
      ? "badge badge-red"
      : status === "진행중"
      ? "badge badge-blue"
      : "badge badge-green";

  return <span className={className}>{status}</span>;
}