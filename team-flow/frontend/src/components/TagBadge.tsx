import { X } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagBadgeProps {
  tag: Tag;
  onRemove?: (tagId: string) => void;
  size?: 'sm' | 'md';
}

export function TagBadge({ tag, onRemove, size = 'sm' }: TagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
      style={{
        backgroundColor: hexToRgba(tag.color, 0.15),
        color: tag.color,
        border: `1px solid ${hexToRgba(tag.color, 0.3)}`,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(tag.id); }}
          className="ml-0.5 hover:opacity-70"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

export function TagPicker({ tags, selected, onToggle, onAdd, projectId }: {
  tags: Tag[];
  selected: string[];
  onToggle: (tagId: string) => void;
  onAdd?: (name: string) => void;
  projectId: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const isSelected = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag.id)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
              isSelected
                ? 'ring-2 ring-offset-1 dark:ring-offset-slate-800'
                : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: hexToRgba(tag.color, isSelected ? 0.25 : 0.1),
              color: tag.color,
              border: `1px solid ${hexToRgba(tag.color, isSelected ? 0.5 : 0.2)}`,
              boxShadow: isSelected ? `0 0 0 2px ${tag.color}` : 'none',
            }}
          >
            {tag.name}
          </button>
        );
      })}
      {tags.length === 0 && (
        <p className="text-xs text-gray-400 italic">Nenhuma tag criada</p>
      )}
    </div>
  );
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
