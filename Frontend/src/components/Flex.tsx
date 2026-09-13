import React from 'react';
import { getFlexStyles, type FlexStyleProps } from './flex-utils';

export interface ReactFlexProps
  extends React.HTMLAttributes<HTMLElement>,
    FlexStyleProps {
  as?: React.ElementType;
  children?: React.ReactNode;
}

export const Flex: React.FC<ReactFlexProps> = ({
  as: Component = 'div',
  direction,
  justify,
  align,
  wrap,
  gap,
  rowGap,
  columnGap,
  inline,
  grow,
  shrink,
  basis,
  w,
  width,
  h,
  height,
  miw,
  minWidth,
  maw,
  maxWidth,
  mih,
  minHeight,
  mah,
  maxHeight,
  p,
  padding,
  pt,
  pb,
  pl,
  pr,
  px,
  py,
  m,
  margin,
  mt,
  mb,
  ml,
  mr,
  mx,
  my,
  style,
  children,
  ...rest
}) => {
  const flexStyles = getFlexStyles({
    direction,
    justify,
    align,
    wrap,
    gap,
    rowGap,
    columnGap,
    inline,
    grow,
    shrink,
    basis,
    w,
    width,
    h,
    height,
    miw,
    minWidth,
    maw,
    maxWidth,
    mih,
    minHeight,
    mah,
    maxHeight,
    p,
    padding,
    pt,
    pb,
    pl,
    pr,
    px,
    py,
    m,
    margin,
    mt,
    mb,
    ml,
    mr,
    mx,
    my,
  });

  return (
    <Component
      style={{
        ...flexStyles,
        ...(typeof style === 'object' ? style : {}),
      }}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default Flex;
