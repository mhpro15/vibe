interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div className="mb-4 md:mb-6">
      <h1 className="text-lg md:text-xl font-medium text-white mb-0.5">
        Good{" "}
        {new Date().getHours() < 12
          ? "morning"
          : new Date().getHours() < 18
          ? "afternoon"
          : "evening"}
        , {userName.split(" ")[0]}
      </h1>
      <p className="text-xs md:text-sm text-neutral-500">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
  );
}
