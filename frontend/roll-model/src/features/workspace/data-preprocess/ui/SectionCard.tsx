interface Section {
  title: string;
  items: string[];
  icon: string;
}

const SectionCard = ({ section }: { section: Section }) => (
  <div className="bg-muted/50 rounded-md border p-4 shadow-sm">
    <div className="text-foreground mb-2 flex items-center gap-2 text-sm font-semibold">
      <span className="text-xl">{section.icon}</span>
      {section.title}
    </div>
    {section.items.length > 0 && (
      <ul className="text-muted-foreground ml-7 list-disc text-sm">
        {section.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )}
  </div>
);

export default SectionCard;
