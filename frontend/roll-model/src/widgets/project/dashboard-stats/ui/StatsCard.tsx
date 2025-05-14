interface StatsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
}

export const StatsCard = ({ title, value, icon }: StatsCardProps) => {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md " >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="mb-1 text-sm text-gray-500">{title}</h3>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        {icon && <div className="font-tossface text-2xl text-gray-400">{icon}</div>}
      </div>
    </div>
  );
};
