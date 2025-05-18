import { ReactNode } from 'react';

type TitlePosition = 'start' | 'center' | 'end';

export interface CardProps {
  title?: string;
  titlePosition?: TitlePosition;
  sub?: string;
}

interface ProjectDetailCardProps {
  cardProps?: CardProps;
  children?: ReactNode;
}

export default function ProjectDetailCard({ cardProps, children }: ProjectDetailCardProps) {
  const { title, titlePosition = 'start', sub } = cardProps || {};
  const textAlignment = `text-${titlePosition}`;

  return (
    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
      {title && <h2 className={`mb-3 ${textAlignment} text-lg font-semibold`}>{title}</h2>}
      {sub && <p className={`mb-3 ${textAlignment} text-[theme(color-muted-foreground)] text-sm`}>{sub}</p>}
      {children}
    </div>
  );
}
