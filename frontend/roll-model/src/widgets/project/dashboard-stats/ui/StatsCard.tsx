interface StatsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
}

export const StatsCard = ({ title, value, icon, isSelected = false, onClick }: StatsCardProps) => {
  return (
    <div
      className={`flex cursor-pointer items-center justify-between rounded-lg p-4 shadow-sm transition-all select-none hover:shadow-md ${
        isSelected ? 'bg-[theme(primary-black)] border-[theme(primary-black)] border-2' : 'bg-white'
      }`}
      onClick={onClick}
    >
      <div>
        <h3 className={`${isSelected ? 'text-[theme(color-blue-01)]' : 'text-gray-500'}`}>{title}</h3>
        <p className={`text-2xl font-bold ${isSelected ? 'text-[theme(color-blue-01)]' : ''}`}>{value}</p>
      </div>
      <div className="font-tossface text-3xl">{icon}</div>
    </div>
  );
};
