export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';

export type FlexJustify =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'start'
  | 'end'
  | 'stretch'
  | 'normal';

export type FlexAlign =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'stretch'
  | 'baseline'
  | 'start'
  | 'end';

export type FlexWrap = 'wrap' | 'nowrap' | 'wrap-reverse';

export interface FlexStyleProps {
  // Flex params
  direction?: FlexDirection;
  justify?: FlexJustify;
  align?: FlexAlign;
  wrap?: FlexWrap;
  gap?: string | number;
  rowGap?: string | number;
  columnGap?: string | number;
  inline?: boolean;
  grow?: string | number;
  shrink?: string | number;
  basis?: string | number;

  // Dimensions
  w?: string | number;
  width?: string | number;
  h?: string | number;
  height?: string | number;
  miw?: string | number;
  minWidth?: string | number;
  maw?: string | number;
  maxWidth?: string | number;
  mih?: string | number;
  minHeight?: string | number;
  mah?: string | number;
  maxHeight?: string | number;

  // Spacing (padding)
  p?: string | number;
  padding?: string | number;
  pt?: string | number;
  pb?: string | number;
  pl?: string | number;
  pr?: string | number;
  px?: string | number;
  py?: string | number;

  // Spacing (margin)
  m?: string | number;
  margin?: string | number;
  mt?: string | number;
  mb?: string | number;
  ml?: string | number;
  mr?: string | number;
  mx?: string | number;
  my?: string | number;
}

export function formatCssValue(val?: string | number): string | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') return `${val}px`;
  return val;
}

/**
 * Computes CSS styles map from Flex props.
 */
export function getFlexStyles(props: FlexStyleProps): Record<string, string> {
  const styles: Record<string, string> = {
    display: props.inline ? 'inline-flex' : 'flex',
  };

  if (props.direction) styles['flex-direction'] = props.direction;
  if (props.justify) styles['justify-content'] = props.justify;
  if (props.align) styles['align-items'] = props.align;
  if (props.wrap) styles['flex-wrap'] = props.wrap;

  if (props.gap !== undefined) styles['gap'] = formatCssValue(props.gap)!;
  if (props.rowGap !== undefined) styles['row-gap'] = formatCssValue(props.rowGap)!;
  if (props.columnGap !== undefined) styles['column-gap'] = formatCssValue(props.columnGap)!;

  if (props.grow !== undefined) styles['flex-grow'] = String(props.grow);
  if (props.shrink !== undefined) styles['flex-shrink'] = String(props.shrink);
  if (props.basis !== undefined) styles['flex-basis'] = formatCssValue(props.basis)!;

  // Dimensions
  const w = props.w ?? props.width;
  if (w !== undefined) styles['width'] = formatCssValue(w)!;

  const h = props.h ?? props.height;
  if (h !== undefined) styles['height'] = formatCssValue(h)!;

  const miw = props.miw ?? props.minWidth;
  if (miw !== undefined) styles['min-width'] = formatCssValue(miw)!;

  const maw = props.maw ?? props.maxWidth;
  if (maw !== undefined) styles['max-width'] = formatCssValue(maw)!;

  const mih = props.mih ?? props.minHeight;
  if (mih !== undefined) styles['min-height'] = formatCssValue(mih)!;

  const mah = props.mah ?? props.maxHeight;
  if (mah !== undefined) styles['max-height'] = formatCssValue(mah)!;

  // Spacing: Padding
  const p = props.p ?? props.padding;
  if (p !== undefined) styles['padding'] = formatCssValue(p)!;
  if (props.px !== undefined) {
    styles['padding-left'] = formatCssValue(props.px)!;
    styles['padding-right'] = formatCssValue(props.px)!;
  }
  if (props.py !== undefined) {
    styles['padding-top'] = formatCssValue(props.py)!;
    styles['padding-bottom'] = formatCssValue(props.py)!;
  }
  if (props.pt !== undefined) styles['padding-top'] = formatCssValue(props.pt)!;
  if (props.pb !== undefined) styles['padding-bottom'] = formatCssValue(props.pb)!;
  if (props.pl !== undefined) styles['padding-left'] = formatCssValue(props.pl)!;
  if (props.pr !== undefined) styles['padding-right'] = formatCssValue(props.pr)!;

  // Spacing: Margin
  const m = props.m ?? props.margin;
  if (m !== undefined) styles['margin'] = formatCssValue(m)!;
  if (props.mx !== undefined) {
    styles['margin-left'] = formatCssValue(props.mx)!;
    styles['margin-right'] = formatCssValue(props.mx)!;
  }
  if (props.my !== undefined) {
    styles['margin-top'] = formatCssValue(props.my)!;
    styles['margin-bottom'] = formatCssValue(props.my)!;
  }
  if (props.mt !== undefined) styles['margin-top'] = formatCssValue(props.mt)!;
  if (props.mb !== undefined) styles['margin-bottom'] = formatCssValue(props.mb)!;
  if (props.ml !== undefined) styles['margin-left'] = formatCssValue(props.ml)!;
  if (props.mr !== undefined) styles['margin-right'] = formatCssValue(props.mr)!;

  return styles;
}

/**
 * Converts style dictionary into inline CSS string.
 */
export function stylesToString(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}
