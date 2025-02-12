export function Select({ options, onChange, value }) {
  return (
    <select onChange={onChange} className="border p-2 rounded">
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
