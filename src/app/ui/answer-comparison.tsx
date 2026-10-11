import type { ReactNode } from "react";
import styles from "./answer-comparison.module.css";

export function AnswerComparison(props: {
  correct: ReactNode;
  answer: ReactNode;
}) {
  return (
    <dl className={styles.comparison}>
      <div className={styles.correct}>
        <dt>
          <span aria-hidden="true">○ </span>正解
        </dt>
        <dd>{props.correct}</dd>
      </div>
      <div className={styles.answer}>
        <dt>
          <span aria-hidden="true">△ </span>回答
        </dt>
        <dd>{props.answer}</dd>
      </div>
    </dl>
  );
}
