import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One labelled probability. */
export interface ProbabilityRow {
  readonly label: string;
  readonly value: number;
  /** Draws the bar in the accent colour, for the chosen answer. */
  readonly chosen?: boolean;
}

/** A small bar chart of a decision's probabilities. */
@Component({
  selector: 'app-probabilities',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="probabilities">
      <figcaption>{{ caption() }}</figcaption>
      @for (row of rows(); track row.label) {
        <div class="probability" [class.chosen]="row.chosen">
          <span class="probability-label">{{ row.label }}</span>
          <span class="probability-track">
            <span class="probability-bar" [style.width.%]="row.value * 100"></span>
          </span>
          <span class="probability-value">{{ row.value.toFixed(2) }}</span>
        </div>
      }
    </figure>
  `,
})
export class Probabilities {
  readonly caption = input.required<string>();
  readonly rows = input.required<readonly ProbabilityRow[]>();
}

/**
 * Rows for a record of probabilities, in its key order.
 *
 * @param probabilities - Probability per option.
 * @param chosen - The option to highlight.
 */
export function toRows(
  probabilities: Record<string, number>,
  chosen?: string | number,
): ProbabilityRow[] {
  return Object.entries(probabilities).map(([label, value]) => ({
    label,
    value,
    chosen: String(chosen) === label,
  }));
}
