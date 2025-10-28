/**
 * ReactGrid Cell Style Constants
 *
 * Reusable configuration for custom cell templates in ReactGrid.
 * Note: ReactGrid cells only support className, not inline styles.
 */

/**
 * Cell class name for cells that need overflow visible and no padding.
 * Used for custom dropdown cells to allow dropdown menus to extend beyond cell boundaries.
 */
export const CELL_OVERFLOW_VISIBLE_NO_PADDING = 'overflow-visible p-0';

/**
 * Common cell configuration for custom dropdown cells
 * Use with spread operator to add these properties to cell definitions
 */
export const DROPDOWN_CELL_CONFIG = {
  className: CELL_OVERFLOW_VISIBLE_NO_PADDING,
  style: {
    overflow: 'visible' as const,
    padding: 0,
  },
} as const;
