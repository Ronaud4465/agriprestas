export default function Toast({ message }) {
  return (
    <div className={`toast ${message ? "on" : ""}`}>
      {message}
    </div>
  );
}
