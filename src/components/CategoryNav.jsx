export default function CategoryNav({ categories, activeKey, onSelect }) {
  return (
    <div className="cat-nav">
      {categories.map((cat) => (
        <button key={cat.key} className={activeKey === cat.key ? "active" : ""} onClick={() => onSelect(cat.key)}>
          {cat.title}
        </button>
      ))}
    </div>
  );
}
