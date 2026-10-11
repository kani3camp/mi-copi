/** Render an already formatted metric without changing its rounding or meaning. */
export function MetricValue(props: { value: string | number; unit?: string }) {
  const text = String(props.value);
  const match = text.match(/^([+−-]?(?:\d[\d,]*(?:\.\d+)?|—))(.*)$/);
  if (!match) return <span>{text}</span>;
  return (
    <span className="ui-metric-reading">
      <span className="ui-metric-reading__number">{match[1]}</span>
      {match[2] ? (
        <span className="ui-metric-reading__unit">{match[2]}</span>
      ) : null}
      {props.unit ? (
        <span className="ui-metric-reading__unit"> {props.unit}</span>
      ) : null}
    </span>
  );
}
