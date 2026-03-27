interface HappyRobotTextLogoProps {
  className?: string;
}

export function HappyRobotTextLogo({ className = "h-8" }: HappyRobotTextLogoProps) {
  return (
    <div className={className}>
      <span className="font-bold text-2xl">
        <span className="text-blue-600">Happy</span>
        <span className="text-purple-600">Robot</span>
      </span>
    </div>
  );
}